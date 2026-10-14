import express from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * Helper: Recalculate dan update total_setoran, total_pengeluaran, dan saldo_grup di tabel `groups`
 */
async function syncGroupBalance(conn, grupId) {
  const [sumContrib] = await conn.query(
    'SELECT COALESCE(SUM(nominal), 0) AS total FROM contributions WHERE id_grup = ? AND status_data = "aktif"',
    [grupId]
  );
  const [sumExpense] = await conn.query(
    'SELECT COALESCE(SUM(total_nominal), 0) AS total FROM expenses WHERE id_grup = ? AND status_data = "aktif"',
    [grupId]
  );

  const totalSetoran = parseFloat(sumContrib[0].total);
  const totalPengeluaran = parseFloat(sumExpense[0].total);
  const saldoGrup = totalSetoran - totalPengeluaran;

  await conn.query(
    'UPDATE `groups` SET total_setoran = ?, total_pengeluaran = ?, saldo_grup = ? WHERE id = ?',
    [totalSetoran, totalPengeluaran, saldoGrup, grupId]
  );

  return { totalSetoran, totalPengeluaran, saldoGrup };
}

// GET /api/groups/:grupId/contributions - Daftar setoran grup (US-04, US-14)
router.get('/:grupId/contributions', requireAuth, async (req, res) => {
  try {
    const { grupId } = req.params;
    const userId = req.user.id;

    // Verifikasi keanggotaan
    const [membership] = await pool.query(
      'SELECT id FROM group_members WHERE id_grup = ? AND id_user = ? AND status = "aktif"',
      [grupId, userId]
    );
    if (membership.length === 0) {
      return res.status(403).json({ success: false, message: 'Bukan anggota grup ini' });
    }

    const [rows] = await pool.query(
      `SELECT c.id, c.id_klien, c.id_grup, c.id_user, u.nama AS nama_penyetor,
              c.id_pencatat, up.nama AS nama_pencatat, c.nominal, c.keterangan,
              c.tanggal, c.status_data, c.created_at, c.diperbarui_pada
       FROM contributions c
       JOIN users u ON c.id_user = u.id
       JOIN users up ON c.id_pencatat = up.id
       WHERE c.id_grup = ? AND c.status_data = 'aktif'
       ORDER BY c.tanggal DESC, c.created_at DESC`,
      [grupId]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Contributions GET Error]', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
});

// POST /api/groups/:grupId/contributions - Catat setoran baru (US-04)
router.post('/:grupId/contributions', requireAuth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { grupId } = req.params;
    const userId = req.user.id;
    const { id_user, nominal, keterangan, tanggal, id_klien } = req.body;

    const parsedNominal = parseFloat(nominal);
    if (isNaN(parsedNominal) || !Number.isFinite(parsedNominal) || parsedNominal <= 0 || parsedNominal > 1000000000) {
      return res.status(400).json({ success: false, message: 'Nominal setoran tidak valid (harus > 0 dan realistis)' });
    }

    await conn.beginTransaction();

    // 1. Pessimistic lock pada baris grup untuk mencegah race condition kalkulasi saldo
    const [groupCheck] = await conn.query('SELECT id FROM `groups` WHERE id = ? FOR UPDATE', [grupId]);
    if (groupCheck.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Grup tidak ditemukan' });
    }

    // 2. Proteksi BOLA: Verifikasi bahwa pembuat request adalah anggota aktif grup
    const [callerMembership] = await conn.query(
      'SELECT peran FROM group_members WHERE id_grup = ? AND id_user = ? AND status = "aktif"',
      [grupId, userId]
    );
    if (callerMembership.length === 0) {
      await conn.rollback();
      return res.status(403).json({ success: false, message: 'Anda bukan anggota aktif dalam grup ini' });
    }

    // 3. Jika mencatat untuk user lain, pastikan target penyetor adalah anggota aktif grup
    const penyetorId = id_user ? parseInt(id_user, 10) : userId;
    if (penyetorId !== userId) {
      const [targetMembership] = await conn.query(
        'SELECT id FROM group_members WHERE id_grup = ? AND id_user = ? AND status = "aktif"',
        [grupId, penyetorId]
      );
      if (targetMembership.length === 0) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: 'User target bukan anggota aktif dalam grup ini' });
      }
    }

    // Idempoten untuk sinkronisasi offline (US-04 / F10 id_klien)
    if (id_klien) {
      const [existing] = await conn.query('SELECT id FROM contributions WHERE id_klien = ?', [id_klien]);
      if (existing.length > 0) {
        await conn.rollback();
        return res.json({ success: true, message: 'Setoran sudah tersinkronisasi sebelumnya', id: existing[0].id });
      }
    }

    const tgl = tanggal || new Date().toISOString().split('T')[0];

    const [result] = await conn.query(
      `INSERT INTO contributions (id_klien, id_grup, id_user, id_pencatat, nominal, keterangan, tanggal, status_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'aktif')`,
      [id_klien || null, grupId, penyetorId, userId, parsedNominal, keterangan ? String(keterangan).substring(0, 255) : null, tgl]
    );

    const contribId = result.insertId;

    // Sinkronkan saldo grup seketika (F7, US-09 balance)
    await syncGroupBalance(conn, grupId);

    await conn.commit();

    res.status(201).json({
      success: true,
      message: 'Setoran berhasil dicatat',
      data: {
        id: contribId,
        id_grup: Number(grupId),
        id_user: penyetorId,
        nominal: parsedNominal,
        tanggal: tgl
      }
    });
  } catch (err) {
    await conn.rollback();
    console.error('[Contributions POST Error]', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  } finally {
    conn.release();
  }
});

// PUT /api/groups/:grupId/contributions/:id - Edit koreksi setoran (US-15)
router.put('/:grupId/contributions/:id', requireAuth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { grupId, id } = req.params;
    const userId = req.user.id;
    const { nominal, keterangan, tanggal } = req.body;

    const parsedNominal = parseFloat(nominal);
    if (isNaN(parsedNominal) || !Number.isFinite(parsedNominal) || parsedNominal <= 0 || parsedNominal > 1000000000) {
      return res.status(400).json({ success: false, message: 'Nominal setoran tidak valid' });
    }

    await conn.beginTransaction();

    // Lock baris grup
    await conn.query('SELECT id FROM `groups` WHERE id = ? FOR UPDATE', [grupId]);

    // Cek hak akses: hanya pencatat atau admin grup (US-15 Kriteria 3)
    const [contribs] = await conn.query('SELECT * FROM contributions WHERE id = ? AND id_grup = ? AND status_data = "aktif"', [id, grupId]);
    if (contribs.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Data setoran tidak ditemukan' });
    }

    const [member] = await conn.query(
      'SELECT peran FROM group_members WHERE id_grup = ? AND id_user = ? AND status = "aktif"',
      [grupId, userId]
    );
    const isAdmin = member.length > 0 && member[0].peran === 'admin';
    const isPencatat = contribs[0].id_pencatat === userId;

    if (!isAdmin && !isPencatat) {
      await conn.rollback();
      return res.status(403).json({ success: false, message: 'Hanya pencatat atau admin yang boleh mengoreksi' });
    }

    await conn.query(
      `UPDATE contributions 
       SET nominal = ?, keterangan = ?, tanggal = ? 
       WHERE id = ?`,
      [parsedNominal, keterangan ? String(keterangan).substring(0, 255) : null, tanggal || contribs[0].tanggal, id]
    );

    // Hitung ulang saldo
    await syncGroupBalance(conn, grupId);

    await conn.commit();

    res.json({ success: true, message: 'Setoran berhasil diperbarui' });
  } catch (err) {
    await conn.rollback();
    console.error('[Contributions PUT Error]', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  } finally {
    conn.release();
  }
});

// DELETE /api/groups/:grupId/contributions/:id - Hapus/soft-delete setoran (US-15)
router.delete('/:grupId/contributions/:id', requireAuth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { grupId, id } = req.params;
    const userId = req.user.id;

    await conn.beginTransaction();

    // Lock baris grup
    await conn.query('SELECT id FROM `groups` WHERE id = ? FOR UPDATE', [grupId]);

    const [contribs] = await conn.query('SELECT * FROM contributions WHERE id = ? AND id_grup = ? AND status_data = "aktif"', [id, grupId]);
    if (contribs.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Data setoran tidak ditemukan' });
    }

    const [member] = await conn.query(
      'SELECT peran FROM group_members WHERE id_grup = ? AND id_user = ? AND status = "aktif"',
      [grupId, userId]
    );
    const isAdmin = member.length > 0 && member[0].peran === 'admin';
    const isPencatat = contribs[0].id_pencatat === userId;

    if (!isAdmin && !isPencatat) {
      await conn.rollback();
      return res.status(403).json({ success: false, message: 'Hanya pencatat atau admin yang boleh menghapus' });
    }

    // Soft delete status_data = 'dihapus' (SRS bagian 6.2)
    await conn.query('UPDATE contributions SET status_data = "dihapus" WHERE id = ?', [id]);

    await syncGroupBalance(conn, grupId);

    await conn.commit();

    res.json({ success: true, message: 'Setoran berhasil dihapus dan saldo dihitung ulang' });
  } catch (err) {
    await conn.rollback();
    console.error('[Contributions DELETE Error]', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  } finally {
    conn.release();
  }
});

export { syncGroupBalance };
export default router;
