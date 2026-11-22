import pool from '../config/db.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Kirim push notification ke daftar Expo Push Token via Expo Push Service.
 * Format token: 'ExponentPushToken[xxxxxxxxxxxxxx]'
 *
 * @param {string[]} tokens - Array push token penerima
 * @param {object} payload - { title, body, data }
 */
export async function sendExpoPush(tokens, { title, body, data = {} }) {
  const validTokens = (tokens || []).filter(
    (t) => typeof t === 'string' && t.startsWith('ExponentPushToken[')
  );

  if (validTokens.length === 0) return;

  const messages = validTokens.map((to) => ({
    to,
    sound: 'default',
    title,
    body,
    data,
    priority: 'high',
    channelId: 'default',
  }));

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await res.json();
    return result;
  } catch (err) {
    console.error('[NotificationService] Gagal mengirim push notifikasi:', err.message);
  }
}

/**
 * Simpan notifikasi ke database MySQL dan kirim push notification ke HP anggota grup.
 *
 * @param {number} grupId - ID grup
 * @param {number|null} excludeUserId - ID user pengirim (tidak perlu diberi notifikasi sendiri)
 * @param {object} params - { title, body, jenis, referensiId, data }
 */
export async function notifyGroupMembers(
  grupId,
  excludeUserId,
  { title, body, jenis = 'transaksi', referensiId = null, data = {} }
) {
  try {
    // 1. Ambil semua anggota aktif grup beserta push_token mereka
    const [members] = await pool.query(
      `SELECT gm.id_user, u.push_token, u.nama
       FROM group_members gm
       JOIN users u ON gm.id_user = u.id
       WHERE gm.id_grup = ? AND gm.status = 'aktif' ${
         excludeUserId ? 'AND gm.id_user != ?' : ''
       }`,
      excludeUserId ? [grupId, excludeUserId] : [grupId]
    );

    if (members.length === 0) return;

    // 2. Simpan record notifikasi ke tabel `notifications` untuk setiap anggota (pesan maks 255 karakter)
    const truncatedBody = body ? String(body).substring(0, 255) : '';
    const values = members.map((m) => [
      m.id_user,
      grupId,
      referensiId,
      jenis,
      truncatedBody,
    ]);

    await pool.query(
      `INSERT INTO notifications (id_user, id_grup, id_referensi, jenis, pesan)
       VALUES ?`,
      [values]
    );

    // 3. Kirim push notification ke HP anggota yang memiliki push_token aktif
    const pushTokens = members
      .map((m) => m.push_token)
      .filter(Boolean);

    if (pushTokens.length > 0) {
      await sendExpoPush(pushTokens, {
        title,
        body,
        data: { grupId, ...data },
      });
    }
  } catch (err) {
    console.error('[NotificationService] Gagal memproses notifikasi anggota grup:', err.message);
  }
}

/**
 * Kirim notifikasi personal ke satu user tertentu (misal: undangan grup).
 */
export async function notifySingleUser(
  userId,
  grupId,
  { title, body, jenis = 'undangan', referensiId = null, data = {} }
) {
  try {
    // 1. Simpan ke database (pesan maks 255 karakter)
    const truncatedBody = body ? String(body).substring(0, 255) : '';
    await pool.query(
      `INSERT INTO notifications (id_user, id_grup, id_referensi, jenis, pesan)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, grupId, referensiId, jenis, truncatedBody]
    );

    // 2. Ambil token user
    const [users] = await pool.query('SELECT push_token FROM users WHERE id = ?', [userId]);
    const token = users[0]?.push_token;

    if (token) {
      await sendExpoPush([token], {
        title,
        body,
        data: { grupId, ...data },
      });
    }
  } catch (err) {
    console.error('[NotificationService] Gagal mengirim notifikasi ke user:', err.message);
  }
}
