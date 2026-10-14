import express from 'express';
import crypto from 'crypto';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/groups - List grup yang diikuti oleh user login (US-13)
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const [groups] = await pool.query(
      `SELECT g.id, g.nama_grup, g.id_pembuat, g.kode_undangan, 
              g.total_setoran, g.total_pengeluaran, g.saldo_grup, g.created_at,
              gm.peran, gm.status AS status_keanggotaan
       FROM \`groups\` g
       JOIN group_members gm ON g.id = gm.id_grup
       WHERE gm.id_user = ? AND gm.status = 'aktif'
       ORDER BY g.created_at DESC`,
      [userId]
    );

    res.json({ success: true, data: groups });
  } catch (err) {
    console.error('[Groups GET Error]', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
});

// POST /api/groups - Buat grup baru (US-02)
router.post('/', requireAuth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { nama_grup } = req.body;
    const userId = req.user.id;

    if (!nama_grup || typeof nama_grup !== 'string' || nama_grup.trim() === '') {
      return res.status(400).json({ success: false, message: 'nama_grup wajib diisi' });
    }

    // Kode unik 6 karakter huruf kapital & angka
    const kode_undangan = crypto.randomBytes(3).toString('hex').toUpperCase();

    await conn.beginTransaction();

    const [groupResult] = await conn.query(
      'INSERT INTO `groups` (nama_grup, id_pembuat, kode_undangan) VALUES (?, ?, ?)',
      [nama_grup.trim().substring(0, 100), userId, kode_undangan]
    );

    const grupId = groupResult.insertId;

    // Pembuat langsung menjadi admin grup dengan status aktif
    await conn.query(
      `INSERT INTO group_members (id_grup, id_user, peran, status, tanggal_bergabung) 
       VALUES (?, ?, 'admin', 'aktif', NOW())`,
      [grupId, userId]
    );

    await conn.commit();

    res.status(201).json({
      success: true,
      message: 'Grup berhasil dibuat',
      data: {
        id: grupId,
        nama_grup: nama_grup.trim().substring(0, 100),
        kode_undangan,
        peran: 'admin'
      }
    });
  } catch (err) {
    await conn.rollback();
    console.error('[Groups POST Error]', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  } finally {
    conn.release();
  }
});

// GET /api/groups/:id - Detail grup beserta daftar anggota
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const grupId = req.params.id;
    const userId = req.user.id;

    // Cek apakah user adalah anggota grup ini
    const [membership] = await pool.query(
      'SELECT peran, status FROM group_members WHERE id_grup = ? AND id_user = ? AND status = "aktif"',
      [grupId, userId]
    );
    if (membership.length === 0) {
      return res.status(403).json({ success: false, message: 'Bukan anggota aktif grup ini' });
    }

    const [groups] = await pool.query('SELECT * FROM `groups` WHERE id = ?', [grupId]);
    if (groups.length === 0) {
      return res.status(404).json({ success: false, message: 'Grup tidak ditemukan' });
    }

    const [members] = await pool.query(
      `SELECT gm.id, gm.id_user, u.nama, u.username, u.email, gm.peran, gm.status, gm.tanggal_bergabung
       FROM group_members gm
       JOIN users u ON gm.id_user = u.id
       WHERE gm.id_grup = ? AND gm.status = 'aktif'
       ORDER BY gm.peran ASC, u.nama ASC`,
      [grupId]
    );

    res.json({
      success: true,
      data: {
        ...groups[0],
        peran_saya: membership[0].peran,
        members
      }
    });
  } catch (err) {
    console.error('[Groups Detail Error]', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
});

// POST /api/groups/join - Gabung grup via kode undangan (US-02 / US-03)
router.post('/join', requireAuth, async (req, res) => {
  try {
    const { kode_undangan } = req.body;
    const userId = req.user.id;

    if (!kode_undangan || typeof kode_undangan !== 'string') {
      return res.status(400).json({ success: false, message: 'kode_undangan wajib diisi' });
    }

    const [groups] = await pool.query(
      'SELECT id, nama_grup FROM `groups` WHERE kode_undangan = ?',
      [kode_undangan.trim().toUpperCase()]
    );
    if (groups.length === 0) {
      return res.status(404).json({ success: false, message: 'Grup dengan kode ini tidak ditemukan' });
    }

    const grup = groups[0];

    // Cek apakah sudah terdaftar
    const [existing] = await pool.query(
      'SELECT id, status FROM group_members WHERE id_grup = ? AND id_user = ?',
      [grup.id, userId]
    );

    if (existing.length > 0) {
      if (existing[0].status === 'aktif') {
        return res.status(400).json({ success: false, message: 'Sudah bergabung di grup ini' });
      } else {
        // Jika statusnya undangan, langsung aktifkan
        await pool.query(
          "UPDATE group_members SET status = 'aktif', tanggal_bergabung = NOW() WHERE id = ?",
          [existing[0].id]
        );
        return res.json({ success: true, message: 'Berhasil bergabung dengan grup', data: grup });
      }
    }

    await pool.query(
      `INSERT INTO group_members (id_grup, id_user, peran, status, tanggal_bergabung) 
       VALUES (?, ?, 'anggota', 'aktif', NOW())`,
      [grup.id, userId]
    );

    res.json({
      success: true,
      message: 'Berhasil bergabung dengan grup',
      data: grup
    });
  } catch (err) {
    console.error('[Groups Join Error]', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
});

// POST /api/groups/:id/invite - Undang anggota lewat username (US-02)
router.post('/:id/invite', requireAuth, async (req, res) => {
  try {
    const grupId = req.params.id;
    const { username } = req.body;
    const userId = req.user.id;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ success: false, message: 'username wajib diisi' });
    }

    // Cek hak akses: hanya admin yang bisa undang (US-02)
    const [membership] = await pool.query(
      'SELECT peran FROM group_members WHERE id_grup = ? AND id_user = ? AND status = "aktif"',
      [grupId, userId]
    );
    if (membership.length === 0 || membership[0].peran !== 'admin') {
      return res.status(403).json({ success: false, message: 'Hanya admin grup yang berhak mengundang anggota' });
    }

    const [targetUsers] = await pool.query('SELECT id, nama, username FROM users WHERE username = ?', [username.trim()]);
    if (targetUsers.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    const targetUser = targetUsers[0];

    // Cek apakah sudah pernah diundang atau sudah anggota
    const [existing] = await pool.query(
      'SELECT id, status FROM group_members WHERE id_grup = ? AND id_user = ?',
      [grupId, targetUser.id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'User sudah ada di grup atau sudah diundang' });
    }

    await pool.query(
      `INSERT INTO group_members (id_grup, id_user, id_pengundang, peran, status, tanggal_diundang)
       VALUES (?, ?, ?, 'anggota', 'undangan', NOW())`,
      [grupId, targetUser.id, userId]
    );

    res.json({
      success: true,
      message: `Undangan terkirim ke ${targetUser.nama}`
    });
  } catch (err) {
    console.error('[Groups Invite Error]', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
});

export default router;
