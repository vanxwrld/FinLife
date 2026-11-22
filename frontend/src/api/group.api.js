// API layer — Grup (list, create, detail, join, invite)
import { apiFetch } from './client';

/** Daftar grup yang diikuti user saat ini */
export function getGroups() {
  return apiFetch('groups');
}

/** Buat grup baru */
export function createGroup(nama_grup) {
  return apiFetch('groups', {
    method: 'POST',
    body: { nama_grup },
  });
}

/** Detail grup beserta daftar anggota */
export function getGroupDetail(id) {
  return apiFetch(`groups/${id}`);
}

/** Gabung grup via kode undangan */
export function joinGroup(kode_undangan) {
  return apiFetch('groups/join', {
    method: 'POST',
    body: { kode_undangan },
  });
}

/** Undang user ke grup via username (hanya admin) */
export function inviteMember(grupId, username) {
  return apiFetch(`groups/${grupId}/invite`, {
    method: 'POST',
    body: { username },
  });
}
