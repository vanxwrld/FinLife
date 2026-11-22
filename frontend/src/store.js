import { c, LEBIH } from './theme';
import { sha256 } from './hash';

// Import dari utils modular & re-export untuk backward compatibility
export { rupiah, rb } from './utils/format';
export {
  BULAN, formatDate, isToday, recentDates, shortDate, stampOn,
  pad2, mon3, dateLabel, dayMonth, dateTimeLabel, timeAgo,
} from './utils/date';
export {
  validateGroupName, validateSetoran, validatePengeluaran,
  splitEqual, splitDiff, redistributeDiff, validateKoreksi, validateHapus,
} from './utils/splitCalc';
export {
  MAX_ATTEMPTS, makeQueueItem, queueLabel, queueStats,
  syncPending, syncAll, failAttempt,
} from './utils/syncQueue';

import { rupiah, rb } from './utils/format';
import { BULAN, isToday, shortDate, stampOn } from './utils/date';

// Tidak ada data dummy: akun, grup, transaksi dst. dibuat sendiri di dalam app dan disimpan di perangkat (lihat storage.js).
// Belum ada backend email, jadi kode OTP reset kata sandi masih tetap (hanya untuk mode demo).
export const DEMO_OTP = '8241';
const users = [];
let notifyUsers = () => {};
const n = (s) => s.trim().toLowerCase();

const rand = () => Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
const hashPass = (pass, salt) => sha256(salt + ':' + pass);

export const auth = {
  // Isi daftar akun dari penyimpanan perangkat; cb dipanggil tiap daftar akun berubah (untuk disimpan).
  init: (list, cb) => {
    let migrated = false;
    const fixed = list.map((u) => {
      if (u.pass === undefined) return u;
      migrated = true;
      const { pass, ...rest } = u;
      const salt = rand();
      return { ...rest, salt, hash: hashPass(pass, salt) };
    });
    users.splice(0, users.length, ...fixed);
    notifyUsers = cb || (() => {});
    if (migrated) notifyUsers([...users]);
  },
  byUsername: (username) => users.find((u) => u.username === username) || null,
  login: (email, pass) => users.find((u) => u.email === n(email) && u.hash === hashPass(pass, u.salt)) || null,
  emailExists: (email) => users.some((u) => u.email === n(email)),
  usernameOrEmailTaken: (username, email) =>
    users.some((u) => u.username === n(username) || u.email === n(email)),
  register: ({ name, username, email, pass }) => {
    const salt = rand();
    const u = { name: name.trim(), username: n(username), email: n(email), salt, hash: hashPass(pass, salt) };
    users.push(u);
    notifyUsers([...users]);
    return u;
  },
  resetPassword: (email, pass) => {
    const u = users.find((x) => x.email === n(email));
    if (u) { u.salt = rand(); u.hash = hashPass(pass, u.salt); notifyUsers([...users]); }
  },
};
export const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export const greeting = (d = new Date()) => {
  const h = d.getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 18) return 'Selamat sore';
  return 'Selamat malam';
};

// ---- Grup baru (04c) & cari anggota (04d) ----
export const GROUP_COLORS = ['#00E676', '#00B0FF', '#FFD600', '#F59E0B', '#EC4899', '#8B5CF6'];
export const initialsOf = (name) => {
  const w = name.trim().split(/\s+/);
  return (w.length > 1 ? w[w.length - 2][0] + w[w.length - 1][0] : name.trim().slice(0, 2)).toUpperCase();
};
const makeCode = (name, groups) => {
  const letters = (name.replace(/[^a-z]/gi, '').slice(0, 3) || 'GRP').toUpperCase().padEnd(3, 'X');
  let code;
  do { code = letters + String(Math.floor(100 + Math.random() * 900)); } while (groups.some((g) => g.code === code));
  return code;
};

export const createGroup = (name, user, groups) => ({
  id: 'g' + Date.now(), name: name.trim(), initials: initialsOf(name), code: makeCode(name, groups),
  members: 1, balance: 0, unpaid: 0, color: GROUP_COLORS[groups.length % GROUP_COLORS.length],
  expenses: [], history: [], admin: user.username,
  people: [{ name: user.name, username: user.username, color: '#3B82F6', setor: 0, n: 0, wajib: 0 }],
});
export const personInitials = initialsOf;
export const normGroup = (g) => ({
  ...g,
  members: (g.people || []).length || g.members || 1,
  unpaid: (g.people || []).filter((p) => p.setor < p.wajib).length || 0,
});

// Cari anggota = akun yang benar-benar terdaftar di perangkat ini.
export const findUsers = (q) => {
  const k = q.trim().replace(/^@/, '').toLowerCase();
  if (!k) return [];
  return users.filter((u) => u.username.includes(k)).slice(0, 3).map((u) => ({ name: u.name, username: u.username, color: '#00B0FF' }));
};

// ---- Setoran (06 / 06b / 06c) ----
export const addSetoran = (groups, groupId, username, amount, meta) =>
  groups.map((g) => g.id !== groupId ? g : {
    ...g,
    balance: (g.balance || 0) + amount,
    people: (g.people || []).map((p) => p.username === username ? { ...p, setor: (p.setor || 0) + amount, n: (p.n || 0) + 1 } : p),
    history: meta
      ? [{
          id: 'h' + Date.now(), kind: 'in', title: `Setoran ${firstName((g.people || []).find((p) => p.username === username)?.name || username)}`,
          amount, at: stampOn(meta.date), by: meta.by, payer: username,
        }, ...(g.history || [])]
      : g.history,
  });

export const makeSetoranTx = (person, amount, date) => {
  const now = new Date();
  const sub = isToday(date)
    ? `Hari ini · ${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}`
    : `${date.getDate()} ${BULAN[date.getMonth()].slice(0, 3)}`;
  return { id: 't' + Date.now(), type: 'in', title: `Setoran ${(person?.name || '').split(' ')[0]}`, sub, amount };
};

// ---- Pengeluaran & pembagian (07 / 07b / 07c) ----
export const addPengeluaran = (groups, groupId, shares, amount, meta) => {
  const stamp = Date.now();
  return groups.map((g) => g.id !== groupId ? g : {
    ...g,
    balance: (g.balance || 0) - amount,
    people: (g.people || []).map((p) => shares[p.username] ? { ...p, wajib: (p.wajib || 0) + shares[p.username] } : p),
    expenses: meta
      ? [{
          id: 'e' + stamp, title: meta.title, date: shortDate(meta.date), mode: meta.mode || 'equal', amount,
          shares: Object.fromEntries(Object.entries(shares).filter(([, v]) => v > 0)),
        }, ...(g.expenses || [])]
      : g.expenses,
    history: meta
      ? [{
          id: 'h' + stamp, eid: 'e' + stamp, kind: 'out', title: meta.title, amount, at: stampOn(meta.date),
          by: meta.by, payer: meta.payer || meta.by, mode: meta.mode || 'equal',
          shares: Object.fromEntries(Object.entries(shares).filter(([, v]) => v > 0)),
        }, ...(g.history || [])]
      : g.history,
  });
};

export const makePengeluaranTx = (title, amount, date, recorder) => {
  const now = new Date();
  const who = `dicatat ${(recorder?.name || '').split(' ')[0]}`;
  const sub = isToday(date)
    ? `Hari ini · ${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')} · ${who}`
    : `${date.getDate()} ${BULAN[date.getMonth()].slice(0, 3)} · ${who}`;
  return { id: 'x' + Date.now(), type: 'out', title: title.trim(), sub, amount };
};

// ---- Status keuangan (08 / 08b / 08c) ----
export const firstName = (name = '') => name.trim().split(/\s+/)[0];
const sumOf = (arr = [], f) => arr.reduce((a, x) => a + f(x), 0);

export const groupFinance = (g) => {
  const pengeluaran = sumOf(g.expenses || [], (e) => e.amount);
  const kewajiban = sumOf(g.people || [], (p) => p.wajib);
  return { setoran: sumOf(g.people || [], (p) => p.setor), pengeluaran, kewajiban, kas: g.balance || 0, balance: kewajiban === pengeluaran };
};

export const memberStatus = (p) => {
  const diff = (p.setor || 0) - (p.wajib || 0);
  if (diff > 0) return { diff, kind: 'lebih', col: LEBIH, short: `Lebih ${rb(diff)}`, long: `Lebih ${rupiah(diff)}`, badge: `+${rupiah(diff)}` };
  if (diff < 0) return { diff, kind: 'kurang', col: c.amber, short: `Kurang ${rb(-diff)}`, long: `Kurang ${rupiah(diff)}`, badge: `-${rupiah(diff)}` };
  return { diff, kind: 'pas', col: c.green, short: 'Pas', long: 'Pas', badge: 'Pas' };
};

const rank = (d) => (d < 0 ? 0 : d > 0 ? 1 : 2);
export const sortByDiff = (people = []) =>
  [...people].sort((a, b) => {
    const da = (a.setor || 0) - (a.wajib || 0), db = (b.setor || 0) - (b.wajib || 0);
    return rank(da) - rank(db) || (da < 0 ? da - db : db - da);
  });

export const expensesOf = (g, username) =>
  (g.expenses || []).filter((e) => e.shares && e.shares[username] > 0).map((e) => ({ ...e, share: e.shares[username] }));

export const splitLabel = (e) => (e.mode === 'custom' ? 'Nominal sendiri' : `Bagi rata (${Object.keys(e.shares || {}).length} orang)`);

export const personName = (g, username) => (g.people || []).find((p) => p.username === username)?.name || username;

export const historyList = (g, filter = 'all') =>
  [...(g.history || [])].sort((a, b) => b.at - a.at).filter((t) => filter === 'all' || t.kind === filter);

export const canEditTx = (tx, user, group) => !tx.deleted && (tx.by === user?.username || group?.admin === user?.username);

export const applyKoreksi = (groups, groupId, txId, { title, amount, mode, shares, reason, by }) =>
  groups.map((g) => {
    const tx = g.id === groupId && (g.history || []).find((t) => t.id === txId);
    if (!tx) return g;
    const edited = { by, at: Date.now(), reason: reason.trim() };
    if (tx.kind === 'in') {
      const d = amount - tx.amount;
      return {
        ...g, balance: (g.balance || 0) + d,
        people: (g.people || []).map((p) => (p.username === tx.payer ? { ...p, setor: (p.setor || 0) + d } : p)),
        history: (g.history || []).map((t) => (t.id === txId ? { ...t, amount, edited } : t)),
      };
    }
    const clean = Object.fromEntries(Object.entries(shares).filter(([, v]) => v > 0));
    const name = title.trim();
    return {
      ...g, balance: (g.balance || 0) + tx.amount - amount,
      people: (g.people || []).map((p) => ({ ...p, wajib: (p.wajib || 0) - (tx.shares?.[p.username] || 0) + (clean[p.username] || 0) })),
      expenses: (g.expenses || []).map((e) => (e.id === tx.eid ? { ...e, title: name, amount, mode, shares: clean } : e)),
      history: (g.history || []).map((t) => (t.id === txId ? { ...t, title: name, amount, mode, shares: clean, edited } : t)),
    };
  });

export const applyHapus = (groups, groupId, txId, by) =>
  groups.map((g) => {
    const tx = g.id === groupId && (g.history || []).find((t) => t.id === txId);
    if (!tx || tx.deleted) return g;
    const history = (g.history || []).map((t) => (t.id === txId ? { ...t, deleted: { by, at: Date.now() } } : t));
    if (tx.kind === 'in')
      return {
        ...g, balance: (g.balance || 0) - tx.amount, history,
        people: (g.people || []).map((p) => (p.username === tx.payer ? { ...p, setor: (p.setor || 0) - tx.amount, n: Math.max(0, (p.n || 0) - 1) } : p)),
      };
    return {
      ...g, balance: (g.balance || 0) + tx.amount, history,
      people: (g.people || []).map((p) => (tx.shares?.[p.username] ? { ...p, wajib: (p.wajib || 0) - tx.shares[p.username] } : p)),
      expenses: (g.expenses || []).filter((e) => e.id !== tx.eid),
    };
  });

export const joinGroupFromInvite = (invite, user, groups) => {
  const fresh = (p) => ({ ...p, setor: 0, n: 0, wajib: 0 });
  const people = [...invite.members.map(fresh), fresh({ name: user.name, username: user.username, color: '#3B82F6' })];
  return {
    id: 'g' + Date.now(), name: invite.groupName, initials: initialsOf(invite.groupName), code: invite.code,
    members: people.length, balance: 0, unpaid: 0, color: GROUP_COLORS[groups.length % GROUP_COLORS.length],
    expenses: [], history: [], admin: invite.admin, people,
  };
};

export const reminderSummary = (late = []) => {
  const names = late.map((p) => firstName(p.name));
  const to = names.length <= 2 ? names.join(' dan ') : `${names.length} anggota`;
  const total = late.reduce((a, p) => a + ((p.wajib || 0) - (p.setor || 0)), 0);
  return { to, total };
};
