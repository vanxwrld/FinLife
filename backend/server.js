import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import pool from './src/db.js';

// Route imports
import authRouter from './src/routes/auth.js';
import groupsRouter from './src/routes/groups.js';
import contributionsRouter from './src/routes/contributions.js';
import expensesRouter from './src/routes/expenses.js';
import balanceRouter from './src/routes/balance.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security Headers (Helmet)
app.use(helmet());

// CORS Policy: Batasi asal permintaan yang diizinkan
const allowedOrigins = [
  'http://localhost:8081', // Expo local dev
  'http://localhost:19006', // Expo web
  'http://localhost:3000'
];
app.use(cors({
  origin: (origin, callback) => {
    // Izinkan requests tanpa origin (misal mobile app native atau curl saat testing)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin tidak diizinkan oleh CORS policy'));
  },
  credentials: true
}));

// Body parsing dengan batas payload agar terhindar dari Memory DoS
app.use(express.json({ limit: '100kb' }));

// Rate Limiting untuk Endpoint Autentikasi (Proteksi Brute Force & Credential Stuffing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 30, // Maksimal 30 percobaan per IP dalam 15 menit
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan autentikasi. Silakan coba lagi setelah 15 menit.'
  }
});

// Rate Limiting Umum untuk API
const generalApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  max: 300, // Maksimal 300 request per menit per IP
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', generalApiLimiter);

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'FinLife Backend API',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Modular Routes Sesuai SRS FinLife
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/groups', contributionsRouter);
app.use('/api/groups', expensesRouter);
app.use('/api/groups', balanceRouter);

// Global Error Handler (Sanitasi Error Message agar tidak membocorkan skema DB/Stack Trace)
app.use((err, req, res, next) => {
  console.error('[Error Handler]', err);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan internal pada server'
  });
});

// Jalankan Server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[FinLife Backend] Server aktif di port ${PORT}`);
});

// Graceful Shutdown
process.on('SIGINT', async () => {
  console.log('\n[FinLife Backend] Menutup server dan koneksi pool database...');
  server.close(async () => {
    try {
      await pool.end();
      console.log('[FinLife Backend] Pool database ditutup bersih.');
      process.exit(0);
    } catch (e) {
      process.exit(1);
    }
  });
});
