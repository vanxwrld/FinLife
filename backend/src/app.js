import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Config
import { authLimiter, generalApiLimiter } from './config/rateLimiter.js';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';

// Routes
import authRouter from './routes/auth.js';
import groupsRouter from './routes/groups.js';
import contributionsRouter from './routes/contributions.js';
import expensesRouter from './routes/expenses.js';
import balanceRouter from './routes/balance.js';

const app = express();

// Security Headers (Helmet)
app.use(helmet());

// CORS Policy: Batasi asal permintaan yang diizinkan
const allowedOrigins = [
  'http://localhost:8081',  // Expo local dev
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

// Rate Limiting umum untuk semua API
app.use('/api/', generalApiLimiter);

// Health Check
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

// Global Error Handler terpusat
app.use(errorHandler);

export default app;
