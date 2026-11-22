// Utilitas kalkulasi split bill, validasi, dan pembagian pengeluaran
import { rupiah } from './format';

/**
 * Validasi nama grup saat pembuatan
 * @returns {string|null} Pesan error atau null jika valid
 */
export const validateGroupName = (name, groups = []) => {
  const v = name.trim();
  if (!v) return 'Nama grup wajib diisi.';
  if (v.length < 3) return 'Nama grup minimal 3 karakter.';
  if (groups.some((g) => (g.name || g.nama_grup || '').toLowerCase() === v.toLowerCase())) {
    return 'Kamu sudah punya grup dengan nama ini.';
  }
  return null;
};

/**
 * Validasi nominal setoran
 * @returns {string|null}
 */
export const validateSetoran = (amount) =>
  !Number.isFinite(amount) || amount <= 0 ? 'Nominal setoran harus lebih dari Rp 0' : null;

/**
 * Validasi pengeluaran
 * @returns {{ field: string, msg: string }|null}
 */
export const validatePengeluaran = ({ title, amount, kas, count }) => {
  if (!title.trim()) return { field: 'title', msg: 'Nama pengeluaran wajib diisi.' };
  if (!Number.isFinite(amount) || amount <= 0) return { field: 'amount', msg: 'Nominal pengeluaran harus lebih dari Rp 0' };
  if (amount > kas) return { field: 'amount', msg: `Melebihi saldo kas grup (Rp ${kas.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')})` };
  if (count < 1) return { field: 'people', msg: 'Pilih minimal 1 anggota yang ikut dibagi.' };
  return null;
};

/**
 * Bagi rata: sisa pembulatan dibebankan ke anggota pertama agar total pas
 * @returns {Object.<string, number>} { username: nominal }
 */
export const splitEqual = (amount, usernames) => {
  const n = usernames.length;
  if (!n) return {};
  const base = Math.floor(amount / n);
  const extra = amount - base * n;
  return Object.fromEntries(usernames.map((u, i) => [u, base + (i < extra ? 1 : 0)]));
};

/**
 * Selisih nominal pengeluaran vs total porsi
 */
export const splitDiff = (amount, shares) =>
  amount - Object.values(shares).reduce((a, v) => a + v, 0);

/**
 * Sebar selisih rata ke anggota terpilih secara otomatis
 */
export const redistributeDiff = (amount, shares) => {
  const next = { ...shares };
  let left = splitDiff(amount, next);
  const up = left > 0;
  left = Math.abs(left);
  while (left > 0) {
    const keys = Object.keys(next).filter((k) => up || next[k] > 0);
    if (!keys.length) break;
    const each = Math.max(1, Math.floor(left / keys.length));
    for (const k of keys) {
      if (left <= 0) break;
      const d = Math.min(each, up ? left : Math.min(left, next[k]));
      next[k] += up ? d : -d;
      left -= d;
    }
  }
  return next;
};

/**
 * Validasi koreksi transaksi
 */
export const validateKoreksi = ({ group, tx, title, amount, reason }) => {
  const out = tx.kind === 'out';
  if (out && !title.trim()) return { field: 'title', msg: 'Nama pengeluaran wajib diisi.' };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { field: 'amount', msg: out ? 'Nominal pengeluaran harus lebih dari Rp 0' : 'Nominal setoran harus lebih dari Rp 0' };
  }
  const kasAfter = group.balance + (out ? tx.amount - amount : amount - tx.amount);
  if (kasAfter < 0) {
    return {
      field: 'amount',
      msg: out
        ? `Melebihi saldo kas grup (${rupiah(group.balance + tx.amount)})`
        : 'Koreksi ini membuat saldo kas grup menjadi negatif.',
    };
  }
  if (!reason.trim()) return { field: 'reason', msg: 'Alasan koreksi wajib diisi.' };
  return null;
};

/**
 * Validasi hapus transaksi
 */
export const validateHapus = (group, tx) =>
  tx.kind === 'in' && group.balance - tx.amount < 0
    ? 'Setoran ini tidak bisa dihapus karena saldo kas grup akan menjadi negatif.'
    : null;
