// API layer — Autentikasi (register, login, getMe)
import { apiFetch } from './client';

/**
 * Daftar akun baru.
 * @returns {{ id, nama, username, email, token }} user data + JWT
 */
export function register(nama, username, email, password) {
  return apiFetch('auth/register', {
    method: 'POST',
    body: { nama, username, email, password },
  });
}

/**
 * Login.
 * @returns {{ id, nama, username, email, token }} user data + JWT
 */
export function login(email, password) {
  return apiFetch('auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

/**
 * Ambil profil user yang sedang login (validasi token).
 * @returns {{ id, nama, username, email, created_at }}
 */
export function getMe() {
  return apiFetch('auth/me');
}

/**
 * Simpan / perbarui push token perangkat ke backend
 * @param {string} push_token - ExponentPushToken[...]
 */
export function updatePushToken(push_token) {
  return apiFetch('auth/push-token', {
    method: 'POST',
    body: { push_token },
  });
}

