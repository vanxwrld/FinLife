// API layer — Saldo & Riwayat Transaksi
import { apiFetch } from './client';

/** Ringkasan saldo grup (total setoran, pengeluaran, saldo, per anggota) */
export function getBalance(grupId) {
  return apiFetch(`groups/${grupId}/balance`);
}

/** Riwayat transaksi grup (setoran + pengeluaran) */
export function getTransactions(grupId) {
  return apiFetch(`groups/${grupId}/transactions`);
}
