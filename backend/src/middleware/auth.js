import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'finlife_secret_ganti_di_produksi';

/**
 * Middleware autentikasi JWT.
 * Sisipkan header: Authorization: Bearer <token>
 * Kalau valid, req.user = { id, email, nama, username }
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token tidak valid atau kedaluwarsa' });
  }
}
