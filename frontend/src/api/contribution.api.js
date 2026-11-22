// API layer — Setoran / Contributions
import { apiFetch } from './client';

/** Daftar semua setoran di grup */
export function getContributions(grupId) {
  return apiFetch(`groups/${grupId}/contributions`);
}

/** Catat setoran baru */
export function createContribution(grupId, data) {
  return apiFetch(`groups/${grupId}/contributions`, {
    method: 'POST',
    body: data,
  });
}

/** Update setoran (koreksi) */
export function updateContribution(grupId, id, data) {
  return apiFetch(`groups/${grupId}/contributions/${id}`, {
    method: 'PUT',
    body: data,
  });
}

/** Hapus setoran */
export function deleteContribution(grupId, id) {
  return apiFetch(`groups/${grupId}/contributions/${id}`, {
    method: 'DELETE',
  });
}
