import 'dotenv/config';
import app from './src/app.js';
import pool, { verifyConnection } from './src/config/db.js';

const PORT = process.env.PORT || 3000;

// Fail-fast: verify DB connection before starting server
try {
  await verifyConnection();

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
        console.error('[FinLife Backend] Error saat menutup pool:', e.message);
        process.exit(1);
      }
    });
  });
} catch (error) {
  console.error('[FinLife Backend] Gagal terhubung ke database:', error.message);
  process.exit(1);
}
