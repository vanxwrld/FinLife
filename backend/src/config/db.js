import 'dotenv/config';
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'finlife_db',
  waitForConnections: true,
  connectionLimit: 10,
  // Kolom DATE dikirim sebagai 'YYYY-MM-DD' (bukan ISO), mencegah tanggal geser 1 hari
  dateStrings: ['DATE'],
});

export async function verifyConnection() {
  const conn = await pool.getConnection();
  try {
    // Pastikan kolom push_token ada di tabel users
    const [cols] = await conn.query("SHOW COLUMNS FROM `users` LIKE 'push_token'");
    if (cols.length === 0) {
      await conn.query("ALTER TABLE `users` ADD COLUMN `push_token` VARCHAR(255) NULL AFTER `password_hash`");
      console.log('[FinLife Backend] Kolom push_token berhasil ditambahkan ke tabel users');
    }
    console.log('[FinLife Backend] MySQL terhubung');
  } catch (err) {
    console.warn('[FinLife Backend] Info kolom push_token:', err.message);
  } finally {
    conn.release();
  }
}

export default pool;

