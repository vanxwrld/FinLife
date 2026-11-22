// Utilitas antrian offline sync (F10 / US-13)
import { rupiah } from './format';

export const MAX_ATTEMPTS = 3;

/**
 * Buat item antrian baru
 */
export const makeQueueItem = ({ kind, title, amount, online, data = null }) => {
  const now = Date.now();
  return {
    id: 'q' + now + Math.floor(Math.random() * 1000),
    clientId: 'CLIENT-' + (1000 + Math.floor(Math.random() * 9000)),
    kind,
    title,
    amount,
    at: now,
    status: online ? 'sent' : 'pending',
    attempts: 0,
    sentAt: online ? now : null,
    data,
  };
};

export const queueLabel = (i) =>
  `${i.kind === 'in' ? 'Setoran' : i.title} ${rupiah(i.amount)}`;

export const queueStats = (q = []) => {
  const pending = q.filter((i) => i.status === 'pending').length;
  const failed = q.filter((i) => i.status === 'failed').length;
  return {
    pending,
    failed,
    sent: q.length - pending - failed,
    unsent: pending + failed,
  };
};

/**
 * Update antrian pending menjadi sent saat kembali online
 */
export const syncPending = (q = [], now = Date.now()) =>
  q.map((i) => (i.status === 'pending' ? { ...i, status: 'sent', sentAt: now } : i));

/**
 * Coba kirim ulang semua yang belum terkirim (pending & failed)
 */
export const syncAll = (q = [], now = Date.now()) =>
  q.map((i) => (i.status !== 'sent' ? { ...i, status: 'sent', sentAt: now } : i));

/**
 * Catat kegagalan saat percobaan kirim ulang di kondisi offline
 */
export const failAttempt = (q = []) =>
  q.map((i) => {
    if (i.status === 'sent') return i;
    const attempts = Math.min(MAX_ATTEMPTS, i.attempts + 1);
    return { ...i, attempts, status: attempts >= MAX_ATTEMPTS ? 'failed' : 'pending' };
  });
