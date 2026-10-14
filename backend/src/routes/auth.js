import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'finlife_secret_ganti_di_produksi';

// POST /api/auth/register (US-01)
router.post('/register', async (req, res) => {
  try {
    const { nama, username, email, password } = req.body;
    if (!nama || !email || !password) {
      return res.status(400).json({ success: false, message: 'nama, email, dan password wajib diisi' });
    }

    // Cek duplikasi email atau username
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? OR (username = ? AND username IS NOT NULL)',
      [email, username || null]
    );
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email atau username sudah digunakan' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      'INSERT INTO users (nama, username, email, password_hash) VALUES (?, ?, ?, ?)',
      [nama, username || null, email, password_hash]
    );

    const userId = result.insertId;
    const token = jwt.sign({ id: userId, email, nama, username }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: { id: userId, nama, username, email, token }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login (US-01)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi' });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, nama: user.nama, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        id: user.id,
        nama: user.nama,
        username: user.username,
        email: user.email,
        token
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me (Profil pengguna yang sedang login)
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, nama, username, email, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
    res.json({ success: true, data: users[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
