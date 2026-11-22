// API layer — Pengeluaran / Expenses
import { apiFetch } from './client';

/** Daftar semua pengeluaran di grup */
export function getExpenses(grupId) {
  return apiFetch(`groups/${grupId}/expenses`);
}

/** Catat pengeluaran baru */
export function createExpense(grupId, data) {
  return apiFetch(`groups/${grupId}/expenses`, {
    method: 'POST',
    body: data,
  });
}

/** Hapus pengeluaran */
export function deleteExpense(grupId, id) {
  return apiFetch(`groups/${grupId}/expenses/${id}`, {
    method: 'DELETE',
  });
}
