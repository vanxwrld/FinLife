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

export default pool;
