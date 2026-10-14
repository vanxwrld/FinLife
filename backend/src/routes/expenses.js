import express from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { syncGroupBalance } from './contributions.js';

const router = express.Router();

// GET /api/groups/:grupId/expenses - Daftar pengeluaran + split detail (US-05, US-14)
router.get('/:grupId/expenses', requireAuth, async (req, res) => {
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

    const [expenses] = await pool.query(
      `SELECT e.id, e.id_klien, e.id_grup, e.id_pembayar, up.nama AS nama_pembayar,
              e.id_pencatat, uc.nama AS nama_pencatat, e.nama_pengeluaran,
              e.total_nominal, e.metode_pembagian, e.tanggal, e.status_data,
              e.created_at, e.diperbarui_pada
       FROM expenses e
       JOIN users up ON e.id_pembayar = up.id
       JOIN users uc ON e.id_pencatat = uc.id
       WHERE e.id_grup = ? AND e.status_data = 'aktif'
       ORDER BY e.tanggal DESC, e.created_at DESC`,
      [grupId]
    );

    // Ambil split untuk setiap expense
    const expenseIds = expenses.map(e => e.id);
    let splitsByExpense = {};

    if (expenseIds.length > 0) {
      const [splits] = await pool.query(
        `SELECT es.id_pengeluaran, es.id_user, u.nama, es.nominal_bagian
         FROM expense_splits es
         JOIN users u ON es.id_user = u.id
         WHERE es.id_pengeluaran IN (?)`,
        [expenseIds]
      );

      for (const s of splits) {
        if (!splitsByExpense[s.id_pengeluaran]) splitsByExpense[s.id_pengeluaran] = [];
        splitsByExpense[s.id_pengeluaran].push({
          id_user: s.id_user,
          nama: s.nama,
          nominal_bagian: parseFloat(s.nominal_bagian)
        });
      }
    }

    const data = expenses.map(e => ({
      ...e,
      splits: splitsByExpense[e.id] || []
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/groups/:grupId/expenses - Catat pengeluaran baru (US-05, US-06, US-07)
router.post('/:grupId/expenses', requireAuth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { grupId } = req.params;
    const userId = req.user.id;
    const {
      id_klien,
      id_pembayar,
      nama_pengeluaran,
      total_nominal,
      metode_pembagian, // 'bagi_rata' atau 'nominal_masing_masing'
      tanggal,
      splits // array of { id_user, nominal_bagian }
    } = req.body;

    const parsedNominal = parseFloat(total_nominal);
    if (isNaN(parsedNominal) || parsedNominal <= 0) {
      return res.status(400).json({ success: false, message: 'Total nominal harus lebih dari 0' });
    }

    if (!nama_pengeluaran || nama_pengeluaran.trim() === '') {
      return res.status(400).json({ success: false, message: 'nama_pengeluaran wajib diisi' });
    }

    if (!Array.isArray(splits) || splits.length === 0) {
      return res.status(400).json({ success: false, message: 'Pilih minimal satu anggota yang terlibat' });
    }

    // Validasi pembagian berdasarkan metode (US-06)
    let calculatedSplits = [];
    if (metode_pembagian === 'nominal_masing_masing') {
      let sumSplit = 0;
      for (const item of splits) {
        const nom = parseFloat(item.nominal_bagian);
        if (isNaN(nom) || nom < 0) {
          return res.status(400).json({ success: false, message: 'Nominal bagian anggota tidak valid' });
        }
        sumSplit += nom;
        calculatedSplits.push({ id_user: item.id_user, nominal_bagian: nom });
      }

      // Selisih pembagian harus pas dengan total_nominal (US-06 Kriteria 3)
      if (Math.abs(sumSplit - parsedNominal) > 0.01) {
        return res.status(400).json({
          success: false,
          message: `Total bagian anggota (Rp${sumSplit}) tidak sama dengan total pengeluaran (Rp${parsedNominal})`
        });
      }
    } else {
      // Default: bagi_rata (US-06 Kriteria 1)
      const count = splits.length;
      const baseShare = Math.floor((parsedNominal / count) * 100) / 100;
      let totalAssigned = 0;

      for (let i = 0; i < count; i++) {
        let share = baseShare;
        // Sisa desimal dibebankan ke anggota terakhir (SRS 6.2 ExpenseSplit)
        if (i === count - 1) {
          share = parseFloat((parsedNominal - totalAssigned).toFixed(2));
        } else {
          totalAssigned += share;
        }
        calculatedSplits.push({
          id_user: splits[i].id_user || splits[i],
          nominal_bagian: share
        });
      }
    }

    await conn.beginTransaction();

    // Idempoten untuk sinkronisasi offline (id_klien)
    if (id_klien) {
      const [existing] = await conn.query('SELECT id FROM expenses WHERE id_klien = ?', [id_klien]);
      if (existing.length > 0) {
        await conn.rollback();
        return res.json({ success: true, message: 'Pengeluaran sudah tersinkronisasi', id: existing[0].id });
      }
    }

    const tgl = tanggal || new Date().toISOString().split('T')[0];
    const pembayarId = id_pembayar || userId;

    // ── SECURITY: Validasi pembayar adalah anggota aktif grup ─────────────────
    const [pembayarCheck] = await conn.query(
      'SELECT id FROM group_members WHERE id_grup = ? AND id_user = ? AND status = "aktif"',
      [grupId, pembayarId]
    );
    if (pembayarCheck.length === 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Pembayar bukan anggota aktif grup ini' });
    }

    // ── SECURITY: Validasi semua id_user dalam splits adalah anggota aktif grup ─
    const splitUserIds = calculatedSplits.map(s => s.id_user);
    if (splitUserIds.length > 0) {
      const [splitMemberCheck] = await conn.query(
        'SELECT id_user FROM group_members WHERE id_grup = ? AND id_user IN (?) AND status = "aktif"',
        [grupId, splitUserIds]
      );
      if (splitMemberCheck.length !== splitUserIds.length) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: 'Satu atau lebih anggota dalam pembagian bukan anggota aktif grup ini' });
      }
    }

    const [expenseResult] = await conn.query(
      `INSERT INTO expenses (id_klien, id_grup, id_pembayar, id_pencatat, nama_pengeluaran, total_nominal, metode_pembagian, tanggal, status_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'aktif')`,
      [id_klien || null, grupId, pembayarId, userId, nama_pengeluaran.trim(), parsedNominal, metode_pembagian || 'bagi_rata', tgl]
    );

    const expenseId = expenseResult.insertId;

    // Simpan rincian kewajiban anggota ke expense_splits (US-07)
    for (const split of calculatedSplits) {
      await conn.query(
        'INSERT INTO expense_splits (id_pengeluaran, id_user, nominal_bagian) VALUES (?, ?, ?)',
        [expenseId, split.id_user, split.nominal_bagian]
      );
    }

    // Update total_pengeluaran dan saldo grup (F7)
    await syncGroupBalance(conn, grupId);

    await conn.commit();

    res.status(201).json({
      success: true,
      message: 'Pengeluaran berhasil dicatat',
      data: {
        id: expenseId,
        nama_pengeluaran: nama_pengeluaran.trim(),
        total_nominal: parsedNominal,
        metode_pembagian: metode_pembagian || 'bagi_rata',
        splits: calculatedSplits
      }
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

// DELETE /api/groups/:grupId/expenses/:id - Hapus pengeluaran (US-15)
router.delete('/:grupId/expenses/:id', requireAuth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { grupId, id } = req.params;
    const userId = req.user.id;

    await conn.beginTransaction();

    const [exp] = await conn.query('SELECT * FROM expenses WHERE id = ? AND id_grup = ?', [id, grupId]);
    if (exp.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Data pengeluaran tidak ditemukan' });
    }

    const [member] = await conn.query(
      'SELECT peran FROM group_members WHERE id_grup = ? AND id_user = ?',
      [grupId, userId]
    );
    const isAdmin = member.length > 0 && member[0].peran === 'admin';
    const isPencatat = exp[0].id_pencatat === userId;

    if (!isAdmin && !isPencatat) {
      await conn.rollback();
      return res.status(403).json({ success: false, message: 'Hanya pencatat atau admin yang boleh menghapus' });
    }

    // Soft delete status_data = 'dihapus'
    await conn.query('UPDATE expenses SET status_data = "dihapus" WHERE id = ?', [id]);

    // Recalculate group balance
    await syncGroupBalance(conn, grupId);

    await conn.commit();

    res.json({ success: true, message: 'Pengeluaran berhasil dihapus dan kewajiban dihitung ulang' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

export default router;
