import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
  console.error('FATAL: Variabel lingkungan JWT_SECRET wajib diatur di .env');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware autentikasi JWT ketat.
 * Mencegah token forgery & algorithm confusion.
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Autentikasi diperlukan. Token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token tidak valid atau telah kedaluwarsa' });
  }
}

export { JWT_SECRET };
