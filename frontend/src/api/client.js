// HTTP client untuk berkomunikasi dengan backend Express.
// Menggunakan native fetch (tanpa axios) + auto-attach JWT token.
import { getToken } from '../utils/tokenStorage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000/api';
const TIMEOUT = Number(process.env.EXPO_PUBLIC_API_TIMEOUT) || 10000;

/**
 * Custom error yang membawa info dari response backend.
 * @property {number} status — HTTP status code
 * @property {string} message — pesan error dari backend
 */
export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Fetch wrapper utama.
 * - Auto-attach Bearer token dari SecureStore/AsyncStorage
 * - Auto-set Content-Type: application/json
 * - Timeout via AbortController
 * - Throw ApiError jika response `success: false` atau HTTP error
 *
 * @param {string} path — path relatif tanpa leading slash, contoh: 'auth/login'
 * @param {object} [options] — override fetch options (method, body, headers, dll.)
 * @returns {Promise<any>} — response.data dari backend
 */
export async function apiFetch(path, options = {}) {
  const token = await getToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);

  const url = `${BASE_URL}/${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
      body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
    });

    // Coba parse JSON; kalau gagal (misalnya 204 No Content), kembalikan null.
    let json;
    try {
      json = await res.json();
    } catch {
      if (res.ok) return null;
      throw new ApiError(`Server error (${res.status})`, res.status);
    }

    if (!res.ok || json.success === false) {
      throw new ApiError(json.message || `Request gagal (${res.status})`, res.status);
    }

    return json.data !== undefined ? json.data : json;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ApiError('Request timeout — server tidak merespons.', 0);
    }
    if (err instanceof ApiError) throw err;
    // Network error (tidak ada koneksi, DNS gagal, dll.)
    throw new ApiError('Tidak dapat terhubung ke server. Periksa koneksi internet.', 0);
  } finally {
    clearTimeout(timer);
  }
}
