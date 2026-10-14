import express from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/groups/:grupId/balance - Ringkasan Saldo, Kewajiban, & Status Anggota (US-07, US-08, US-09, F7)
router.get('/:grupId/balance', requireAuth, async (req, res) => {
  try {
    const { grupId } = req.params;
    const userId = req.user.id;

    // Verifikasi keanggotaan
    const [membership] = await pool.query(
      'SELECT peran FROM group_members WHERE id_grup = ? AND id_user = ? AND status = "aktif"',
      [grupId, userId]
    );
    if (membership.length === 0) {
      return res.status(403).json({ success: false, message: 'Bukan anggota grup ini' });
    }

    // 1. Ambil data dasar grup
    const [groups] = await pool.query('SELECT * FROM `groups` WHERE id = ?', [grupId]);
    if (groups.length === 0) {
      return res.status(404).json({ success: false, message: 'Grup tidak ditemukan' });
    }
    const grup = groups[0];

    // 2. Ambil daftar semua anggota aktif
    const [members] = await pool.query(
      `SELECT u.id, u.nama, u.username, gm.peran
       FROM group_members gm
       JOIN users u ON gm.id_user = u.id
       WHERE gm.id_grup = ? AND gm.status = 'aktif'`,
      [grupId]
    );

    // 3. Hitung total setoran per user
    const [contributions] = await pool.query(
      `SELECT id_user, COALESCE(SUM(nominal), 0) AS total_setoran
       FROM contributions
       WHERE id_grup = ? AND status_data = 'aktif'
       GROUP BY id_user`,
      [grupId]
    );
    const setoranMap = {};
    contributions.forEach(c => {
      setoranMap[c.id_user] = parseFloat(c.total_setoran);
    });

    // 4. Hitung total kewajiban per user dari expense_splits
    const [obligations] = await pool.query(
      `SELECT es.id_user, COALESCE(SUM(es.nominal_bagian), 0) AS total_kewajiban
       FROM expense_splits es
       JOIN expenses e ON es.id_pengeluaran = e.id
       WHERE e.id_grup = ? AND e.status_data = 'aktif'
       GROUP BY es.id_user`,
      [grupId]
    );
    const kewajibanMap = {};
    obligations.forEach(o => {
      kewajibanMap[o.id_user] = parseFloat(o.total_kewajiban);
    });

    // 5. Susun rekapitulasi status tiap anggota (US-08 & US-09)
    let totalSemuaSetoran = 0;
    let totalSemuaKewajiban = 0;

    const ringkasanAnggota = members.map(m => {
      const setoran = setoranMap[m.id] || 0;
      const kewajiban = kewajibanMap[m.id] || 0;
      const selisih = parseFloat((setoran - kewajiban).toFixed(2));

      totalSemuaSetoran += setoran;
      totalSemuaKewajiban += kewajiban;

      let status = 'pas';
      if (selisih < 0) status = 'kurang_bayar';
      else if (selisih > 0) status = 'lebih_bayar';

      return {
        id_user: m.id,
        nama: m.nama,
        username: m.username,
        peran: m.peran,
        total_setoran: setoran,
        total_kewajiban: kewajiban,
        selisih: Math.abs(selisih),
        status // 'kurang_bayar' | 'pas' | 'lebih_bayar'
      };
    });

    // Status balance grup (US-09 Kriteria 3)
    const totalPengeluaran = parseFloat(grup.total_pengeluaran);
    const isBalance = Math.abs(totalSemuaSetoran - totalPengeluaran) < 0.01 &&
                      Math.abs(totalSemuaKewajiban - totalPengeluaran) < 0.01;

    // Status keuangan user yang sedang login (US-08)
    const statusSaya = ringkasanAnggota.find(a => a.id_user === userId);

    res.json({
      success: true,
      data: {
        grup: {
          id: grup.id,
          nama_grup: grup.nama_grup,
          total_setoran: totalSemuaSetoran,
          total_pengeluaran: totalPengeluaran,
          saldo_grup: parseFloat((totalSemuaSetoran - totalPengeluaran).toFixed(2)),
          status_balance: isBalance ? 'balance' : 'tidak_seimbang'
        },
        status_saya: statusSaya,
        ringkasan_anggota: ringkasanAnggota
      }
    });
  } catch (err) {
    console.error('[Balance GET Error]', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
});

// GET /api/groups/:grupId/transactions - Riwayat transaksi terpadu kronologis (US-14, F8)
router.get('/:grupId/transactions', requireAuth, async (req, res) => {
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

    // Ambil setoran
    const [contributions] = await pool.query(
      `SELECT c.id, 'setoran' AS jenis, c.nominal, c.keterangan, c.tanggal,
              c.created_at, u.nama AS nama_penyetor, up.nama AS nama_pencatat
       FROM contributions c
       JOIN users u ON c.id_user = u.id
       JOIN users up ON c.id_pencatat = up.id
       WHERE c.id_grup = ? AND c.status_data = 'aktif'`,
      [grupId]
    );

    // Ambil pengeluaran
    const [expenses] = await pool.query(
      `SELECT e.id, 'pengeluaran' AS jenis, e.total_nominal AS nominal, 
              e.nama_pengeluaran AS keterangan, e.tanggal, e.created_at,
              up.nama AS nama_pembayar, uc.nama AS nama_pencatat, e.metode_pembagian
       FROM expenses e
       JOIN users up ON e.id_pembayar = up.id
       JOIN users uc ON e.id_pencatat = uc.id
       WHERE e.id_grup = ? AND e.status_data = 'aktif'`,
      [grupId]
    );

    // Gabungkan dan urutkan kronologis terbaru ke terlama
    const all = [...contributions, ...expenses].sort((a, b) => {
      const dateA = new Date(a.tanggal + ' ' + (a.created_at ? a.created_at.toISOString().split('T')[1] : '00:00:00'));
      const dateB = new Date(b.tanggal + ' ' + (b.created_at ? b.created_at.toISOString().split('T')[1] : '00:00:00'));
      return dateB - dateA;
    });

    res.json({ success: true, data: all });
  } catch (err) {
    console.error('[Transactions GET Error]', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
});

export default router;
