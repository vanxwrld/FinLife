import rateLimit from 'express-rate-limit';

// Rate Limiting untuk Endpoint Autentikasi (Proteksi Brute Force & Credential Stuffing)
export const authLimiter = rateLimit({
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
export const generalApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  max: 300, // Maksimal 300 request per menit per IP
  standardHeaders: true,
  legacyHeaders: false
});

