/**
 * Centralized Error Handler Middleware
 * Sanitasi pesan error agar tidak membocorkan skema DB / stack trace ke client
 */
export function errorHandler(err, req, res, next) {
  console.error('[Error Handler]', err);

  // Jika response sudah mulai dikirim, delegasikan ke Express default handler
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || err.statusCode || 500;
  const message = err.isOperational
    ? err.message
    : 'Terjadi kesalahan internal pada server';

  res.status(status).json({ success: false, message });
}

/**
 * AppError — class untuk operational errors yang aman dikirim ke client
 * @param {string} message - Pesan error yang aman ditampilkan
 * @param {number} status  - HTTP status code
 */
export class AppError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

