import express from 'express';
import cors from 'cors';
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

// Middlewares
app.use(cors());
app.use(express.json());

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
app.use('/api/auth', authRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/groups', contributionsRouter);
app.use('/api/groups', expensesRouter);
app.use('/api/groups', balanceRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Error Handler]', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal pada server'
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
