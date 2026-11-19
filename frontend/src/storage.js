import AsyncStorage from '@react-native-async-storage/async-storage';

// Penyimpanan lokal di perangkat (tanpa backend).
//  - Akun disimpan bersama; sesi login disimpan supaya tidak perlu login ulang.
//  - GRUP disimpan di satu tempat bersama (per kode grup), jadi semua anggota yang memakai perangkat ini
//    melihat data grup yang sama (saldo, riwayat, anggota). Data lain (transaksi terbaru, notifikasi, antrian) per akun.
const USERS = 'finlife:users';
const GROUPS = 'finlife:groups';
const SESSION = 'finlife:session';
const dataKey = (u) => `finlife:data:${u}`;
export const emptyData = () => ({ groups: [], txs: [], notifs: [], queue: [] });

const read = async (key, fallback) => {
  try { const s = await AsyncStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
};
const write = async (key, value) => { try { await AsyncStorage.setItem(key, JSON.stringify(value)); } catch {} };

// Semua operasi baca-ubah-tulis diantrekan agar tidak saling menimpa.
let chain = Promise.resolve();
const serial = (fn) => { const p = chain.then(fn, fn); chain = p.catch(() => {}); return p; };

export const loadUsers = () => read(USERS, []);
export const saveUsers = (list) => write(USERS, list);

// Sesi login
export const loadSession = () => read(SESSION, null);
export const saveSession = (username) => write(SESSION, username);
export const clearSession = async () => { try { await AsyncStorage.removeItem(SESSION); } catch {} };

// Data akun: grup diambil dari penyimpanan bersama berdasarkan kode yang dimiliki akun itu.
export const loadUserData = (username) => serial(async () => {
  const d = await read(dataKey(username), {});
  const map = await read(GROUPS, {});
  let codes = d.groupCodes;
  if (!codes) { // data versi lama: grup tersimpan langsung di data akun → pindahkan ke penyimpanan bersama
    codes = (d.groups || []).map((g) => g.code);
    let changed = false;
    (d.groups || []).forEach((g) => { if (!map[g.code]) { map[g.code] = g; changed = true; } });
    if (changed) await write(GROUPS, map);
  }
  return { ...emptyData(), txs: d.txs || [], notifs: d.notifs || [], queue: d.queue || [], groups: codes.map((c) => map[c]).filter(Boolean) };
});
export const saveUserData = (username, data) => serial(async () => {
  const map = await read(GROUPS, {});
  data.groups.forEach((g) => { map[g.code] = g; });
  await write(GROUPS, map);
  await write(dataKey(username), { groupCodes: data.groups.map((g) => g.code), txs: data.txs, notifs: data.notifs, queue: data.queue });
});

// Kirim notifikasi ke akun lain di perangkat ini. Mengembalikan false bila undangan yang sama masih menunggu.
export const pushNotif = (username, notif) => serial(async () => {
  const d = await read(dataKey(username), {});
  const list = d.notifs || [];
  if (notif.invite && list.some((n) => n.invite?.code === notif.invite.code && n.invite.status === 'pending')) return false;
  await write(dataKey(username), { ...d, notifs: [notif, ...list] });
  return true;
});

export const allGroupCodes = () => serial(async () => Object.keys(await read(GROUPS, {})));

const MEMBER_COLORS = ['#3B82F6', '#EC4899', '#8B5CF6', '#14B8A6', '#F59E0B', '#EF4444'];
// Gabung ke grup lewat kode (atau menerima undangan). → { error } | { group, already }
export const joinGroupByCode = (code, user) => serial(async () => {
  const map = await read(GROUPS, {});
  const g = map[String(code).trim().toUpperCase()];
  if (!g) return { error: 'not_found' };
  if (g.people.some((p) => p.username === user.username)) return { group: g, already: true };
  const people = [...g.people, { name: user.name, username: user.username, color: MEMBER_COLORS[g.people.length % MEMBER_COLORS.length], setor: 0, n: 0, wajib: 0 }];
  const next = { ...g, people, members: people.length };
  map[next.code] = next;
  await write(GROUPS, map);
  return { group: next };
});
