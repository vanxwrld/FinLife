import { c, LEBIH, rb, rupiah } from './theme';
import { sha256 } from './hash';

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
  // Akun versi lama yang masih menyimpan kata sandi biasa otomatis diubah menjadi hash + salt.
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
const GROUP_COLORS = ['#00E676', '#00B0FF', '#FFD600', '#F59E0B', '#EC4899', '#8B5CF6'];
const initialsOf = (name) => {
  const w = name.trim().split(/\s+/);
  return (w.length > 1 ? w[w.length - 2][0] + w[w.length - 1][0] : name.trim().slice(0, 2)).toUpperCase();
};
const makeCode = (name, groups) => {
  const letters = (name.replace(/[^a-z]/gi, '').slice(0, 3) || 'GRP').toUpperCase().padEnd(3, 'X');
  let code;
  do { code = letters + String(Math.floor(100 + Math.random() * 900)); } while (groups.some((g) => g.code === code));
  return code;
};
// Mengembalikan pesan error, atau null bila valid.
export const validateGroupName = (name, groups) => {
  const v = name.trim();
  if (!v) return 'Nama grup wajib diisi.';
  if (v.length < 3) return 'Nama grup minimal 3 karakter.';
  if (groups.some((g) => g.name.toLowerCase() === v.toLowerCase())) return 'Kamu sudah punya grup dengan nama ini.';
  return null;
};
export const createGroup = (name, user, groups) => ({
  id: 'g' + Date.now(), name: name.trim(), initials: initialsOf(name), code: makeCode(name, groups),
  members: 1, balance: 0, unpaid: 0, color: GROUP_COLORS[groups.length % GROUP_COLORS.length],
  expenses: [], history: [], admin: user.username,
  people: [{ name: user.name, username: user.username, color: '#3B82F6', setor: 0, n: 0, wajib: 0 }],
});
export const personInitials = initialsOf;
// Jumlah anggota & anggota yang belum lunas selalu dihitung dari data, bukan disimpan manual.
export const normGroup = (g) => ({ ...g, members: g.people.length, unpaid: g.people.filter((p) => p.setor < p.wajib).length });

// Cari anggota = akun yang benar-benar terdaftar di perangkat ini.
export const findUsers = (q) => {
  const k = q.trim().replace(/^@/, '').toLowerCase();
  if (!k) return [];
  return users.filter((u) => u.username.includes(k)).slice(0, 3).map((u) => ({ name: u.name, username: u.username, color: '#00B0FF' }));
};

// ---- Setoran (06 / 06b / 06c) ----
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const formatDate = (d) => `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
const sameDay = (a, b) => a.toDateString() === b.toDateString();
export const isToday = (d) => sameDay(d, new Date());
// 7 hari terakhir (hari ini dulu) untuk pilihan tanggal
export const recentDates = (count = 7) => {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - i));
};
// Mengembalikan pesan error, atau null bila valid. (06b)
export const validateSetoran = (amount) =>
  !Number.isFinite(amount) || amount <= 0 ? 'Nominal setoran harus lebih dari Rp 0' : null;
// Tambah setoran ke grup: saldo grup & total setor anggota naik, jumlah transaksi +1.
// meta = { date, by } → ikut dicatat ke riwayat (09). by = username pencatat.
export const addSetoran = (groups, groupId, username, amount, meta) =>
  groups.map((g) => g.id !== groupId ? g : {
    ...g,
    balance: g.balance + amount,
    people: g.people.map((p) => p.username === username ? { ...p, setor: p.setor + amount, n: (p.n || 0) + 1 } : p),
    history: meta
      ? [{
          id: 'h' + Date.now(), kind: 'in', title: `Setoran ${firstName(g.people.find((p) => p.username === username).name)}`,
          amount, at: stampOn(meta.date), by: meta.by, payer: username,
        }, ...(g.history || [])]
      : g.history,
  });
export const makeSetoranTx = (person, amount, date) => {
  const now = new Date();
  const sub = isToday(date)
    ? `Hari ini · ${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}`
    : `${date.getDate()} ${BULAN[date.getMonth()].slice(0, 3)}`;
  return { id: 't' + Date.now(), type: 'in', title: `Setoran ${person.name.split(' ')[0]}`, sub, amount };
};

// ---- Pengeluaran & pembagian (07 / 07b / 07c) ----
// Mengembalikan pesan error, atau null bila valid. (kas = saldo grup)
export const validatePengeluaran = ({ title, amount, kas, count }) => {
  if (!title.trim()) return { field: 'title', msg: 'Nama pengeluaran wajib diisi.' };
  if (!Number.isFinite(amount) || amount <= 0) return { field: 'amount', msg: 'Nominal pengeluaran harus lebih dari Rp 0' };
  if (amount > kas) return { field: 'amount', msg: `Melebihi saldo kas grup (Rp ${kas.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')})` };
  if (count < 1) return { field: 'people', msg: 'Pilih minimal 1 anggota yang ikut dibagi.' };
  return null;
};
// Bagi rata: sisa pembulatan (Rp 1-an) dibebankan ke anggota pertama agar total pas. → { username: nominal }
export const splitEqual = (amount, usernames) => {
  const n = usernames.length;
  if (!n) return {};
  const base = Math.floor(amount / n);
  const extra = amount - base * n;
  return Object.fromEntries(usernames.map((u, i) => [u, base + (i < extra ? 1 : 0)]));
};
// Selisih = total pengeluaran − jumlah nominal yang dibagi. >0 kurang dibagi, <0 kelebihan. (07c)
export const splitDiff = (amount, shares) => amount - Object.values(shares).reduce((a, v) => a + v, 0);
// Sebar selisih rata ke anggota terpilih (untuk tombol "Sesuaikan otomatis"). Hasil dijamin tidak negatif.
export const redistributeDiff = (amount, shares) => {
  const next = { ...shares };
  let left = splitDiff(amount, next);
  const up = left > 0;
  left = Math.abs(left);
  while (left > 0) {
    const keys = Object.keys(next).filter((k) => up || next[k] > 0); // saat mengurangi, lewati yang sudah 0
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
// Simpan pengeluaran: saldo kas turun, "wajib" tiap anggota naik sebesar bagiannya.
// meta = { title, date, mode } → rincian disimpan di g.expenses (dipakai Status keuangan 08c).
export const addPengeluaran = (groups, groupId, shares, amount, meta) => {
  const stamp = Date.now();
  return groups.map((g) => g.id !== groupId ? g : {
    ...g,
    balance: g.balance - amount,
    people: g.people.map((p) => shares[p.username] ? { ...p, wajib: p.wajib + shares[p.username] } : p),
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
  const who = `dicatat ${recorder.name.split(' ')[0]}`;
  const sub = isToday(date)
    ? `Hari ini · ${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')} · ${who}`
    : `${date.getDate()} ${BULAN[date.getMonth()].slice(0, 3)} · ${who}`;
  return { id: 'x' + Date.now(), type: 'out', title: title.trim(), sub, amount };
};

// ---- Status keuangan (08 / 08b / 08c) ----
export const shortDate = (d) => (isToday(d) ? 'Hari ini' : `${d.getDate()} ${BULAN[d.getMonth()].slice(0, 3)}`);
export const firstName = (name) => name.trim().split(/\s+/)[0];
const sumOf = (arr, f) => arr.reduce((a, x) => a + f(x), 0);

// Ringkasan angka grup. balance = kewajiban seluruh anggota sama dengan total pengeluaran.
export const groupFinance = (g) => {
  const pengeluaran = sumOf(g.expenses || [], (e) => e.amount);
  const kewajiban = sumOf(g.people, (p) => p.wajib);
  return { setoran: sumOf(g.people, (p) => p.setor), pengeluaran, kewajiban, kas: g.balance, balance: kewajiban === pengeluaran };
};
// Status satu anggota = setoran − kewajiban. short untuk daftar (08), badge untuk rincian (08b), long untuk detail (08c).
export const memberStatus = (p) => {
  const diff = p.setor - p.wajib;
  if (diff > 0) return { diff, kind: 'lebih', col: LEBIH, short: `Lebih ${rb(diff)}`, long: `Lebih ${rupiah(diff)}`, badge: `+${rupiah(diff)}` };
  if (diff < 0) return { diff, kind: 'kurang', col: c.amber, short: `Kurang ${rb(-diff)}`, long: `Kurang ${rupiah(diff)}`, badge: `-${rupiah(diff)}` };
  return { diff, kind: 'pas', col: c.green, short: 'Pas', long: 'Pas', badge: 'Pas' };
};
// Urutan 08b: yang kurang bayar dulu (paling kurang di atas), lalu yang lebih (terbesar dulu), terakhir yang pas.
const rank = (d) => (d < 0 ? 0 : d > 0 ? 1 : 2);
export const sortByDiff = (people) =>
  [...people].sort((a, b) => {
    const da = a.setor - a.wajib, db = b.setor - b.wajib;
    return rank(da) - rank(db) || (da < 0 ? da - db : db - da);
  });
// Transaksi pengeluaran yang dibebankan ke satu anggota, beserta bagiannya.
export const expensesOf = (g, username) =>
  (g.expenses || []).filter((e) => e.shares[username] > 0).map((e) => ({ ...e, share: e.shares[username] }));
export const splitLabel = (e) => (e.mode === 'custom' ? 'Nominal sendiri' : `Bagi rata (${Object.keys(e.shares).length} orang)`);

// ---- Riwayat & koreksi (09 / 09b / 09c) ----
// Satu entri riwayat: { id, kind: 'in'|'out', title, amount, at (ms), by (username pencatat), payer (username),
//   mode, shares (hanya 'out'), edited?: { by, at }, deleted?: { by, at } }
// Tanggal pilihan + jam saat ini → urutan kronologis tetap benar untuk transaksi di hari yang sama.
export const stampOn = (date) => {
  const now = new Date();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()).getTime();
};
const pad2 = (v) => String(v).padStart(2, '0');
const mon3 = (d) => BULAN[d.getMonth()].slice(0, 3);
export const dateLabel = (ts) => { const d = new Date(ts); return `${d.getDate()} ${mon3(d)} ${d.getFullYear()}`; }; // 14 Okt 2026
export const dayMonth = (ts) => { const d = new Date(ts); return `${d.getDate()} ${mon3(d)}`; }; // 5 Okt
export const dateTimeLabel = (ts) => { const d = new Date(ts); return `${d.getDate()} ${mon3(d)} ${pad2(d.getHours())}.${pad2(d.getMinutes())}`; }; // 13 Okt 08.15
export const personName = (g, username) => g.people.find((p) => p.username === username)?.name || username;
// Terbaru dulu. filter: 'all' | 'in' (Setoran) | 'out' (Pengeluaran). Transaksi dihapus tetap tampil sebagai jejak audit.
export const historyList = (g, filter = 'all') =>
  [...(g.history || [])].sort((a, b) => b.at - a.at).filter((t) => filter === 'all' || t.kind === filter);
// Hanya pencatat atau admin grup yang boleh mengubah/menghapus (09c). Selain itu read-only (09f).
// Transaksi yang sudah dihapus tidak bisa dibuka.
export const canEditTx = (tx, user, group) => !tx.deleted && (tx.by === user.username || group?.admin === user.username);

// ---- Koreksi (09d) & hapus (09e) ----
// Mengembalikan { field, msg } atau null. Koreksi harus menjaga saldo kas tidak negatif dan wajib beralasan (jejak audit).
export const validateKoreksi = ({ group, tx, title, amount, reason }) => {
  const out = tx.kind === 'out';
  if (out && !title.trim()) return { field: 'title', msg: 'Nama pengeluaran wajib diisi.' };
  if (!Number.isFinite(amount) || amount <= 0)
    return { field: 'amount', msg: out ? 'Nominal pengeluaran harus lebih dari Rp 0' : 'Nominal setoran harus lebih dari Rp 0' };
  const kasAfter = group.balance + (out ? tx.amount - amount : amount - tx.amount);
  if (kasAfter < 0)
    return { field: 'amount', msg: out ? `Melebihi saldo kas grup (${rupiah(group.balance + tx.amount)})` : 'Koreksi ini membuat saldo kas grup menjadi negatif.' };
  if (!reason.trim()) return { field: 'reason', msg: 'Alasan koreksi wajib diisi.' };
  return null;
};
// Terapkan koreksi: saldo kas, setoran/kewajiban anggota, rincian pengeluaran, dan entri riwayat ikut berubah.
export const applyKoreksi = (groups, groupId, txId, { title, amount, mode, shares, reason, by }) =>
  groups.map((g) => {
    const tx = g.id === groupId && (g.history || []).find((t) => t.id === txId);
    if (!tx) return g;
    const edited = { by, at: Date.now(), reason: reason.trim() };
    if (tx.kind === 'in') {
      const d = amount - tx.amount;
      return {
        ...g, balance: g.balance + d,
        people: g.people.map((p) => (p.username === tx.payer ? { ...p, setor: p.setor + d } : p)),
        history: g.history.map((t) => (t.id === txId ? { ...t, amount, edited } : t)),
      };
    }
    const clean = Object.fromEntries(Object.entries(shares).filter(([, v]) => v > 0));
    const name = title.trim();
    return {
      ...g, balance: g.balance + tx.amount - amount,
      people: g.people.map((p) => ({ ...p, wajib: p.wajib - (tx.shares[p.username] || 0) + (clean[p.username] || 0) })),
      expenses: (g.expenses || []).map((e) => (e.id === tx.eid ? { ...e, title: name, amount, mode, shares: clean } : e)),
      history: g.history.map((t) => (t.id === txId ? { ...t, title: name, amount, mode, shares: clean, edited } : t)),
    };
  });
// Pesan error bila transaksi tidak boleh dihapus, atau null. Menghapus setoran tidak boleh membuat kas negatif.
export const validateHapus = (group, tx) =>
  tx.kind === 'in' && group.balance - tx.amount < 0 ? 'Setoran ini tidak bisa dihapus karena saldo kas grup akan menjadi negatif.' : null;
// Hapus = dikeluarkan dari perhitungan saldo & kewajiban, tetapi entrinya tetap ada di riwayat (jejak audit).
export const applyHapus = (groups, groupId, txId, by) =>
  groups.map((g) => {
    const tx = g.id === groupId && (g.history || []).find((t) => t.id === txId);
    if (!tx || tx.deleted) return g;
    const history = g.history.map((t) => (t.id === txId ? { ...t, deleted: { by, at: Date.now() } } : t));
    if (tx.kind === 'in')
      return {
        ...g, balance: g.balance - tx.amount, history,
        people: g.people.map((p) => (p.username === tx.payer ? { ...p, setor: p.setor - tx.amount, n: Math.max(0, (p.n || 0) - 1) } : p)),
      };
    return {
      ...g, balance: g.balance + tx.amount, history,
      people: g.people.map((p) => (tx.shares[p.username] ? { ...p, wajib: p.wajib - tx.shares[p.username] } : p)),
      expenses: (g.expenses || []).filter((e) => e.id !== tx.eid),
    };
  });

// ---- Notifikasi (10), undangan grup (10b), pengingat tagihan (10c) ----
// Notifikasi: { id, kind: 'invite'|'out'|'in', at (ms), unread, title, text, groupId?, txId?, invite? }
// invite: { from, groupName, code, members: [{ name, username, color }], admin, status: 'pending'|'accepted'|'declined', groupId? }
export const timeAgo = (ts, now = Date.now()) => {
  const m = Math.floor((now - ts) / 60000);
  if (m < 1) return 'Baru saja';
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h} jam lalu` : dayMonth(ts);
};
// Terima undangan → grup baru; anggota lama + pengguna, saldo 0. Admin = pengundang.
export const joinGroupFromInvite = (invite, user, groups) => {
  const fresh = (p) => ({ ...p, setor: 0, n: 0, wajib: 0 });
  const people = [...invite.members.map(fresh), fresh({ name: user.name, username: user.username, color: '#3B82F6' })];
  return {
    id: 'g' + Date.now(), name: invite.groupName, initials: initialsOf(invite.groupName), code: invite.code,
    members: people.length, balance: 0, unpaid: 0, color: GROUP_COLORS[groups.length % GROUP_COLORS.length],
    expenses: [], history: [], admin: invite.admin, people,
  };
};
// Teks modal 10c. late = anggota yang kurang bayar. → { to, total }
export const reminderSummary = (late) => {
  const names = late.map((p) => firstName(p.name));
  const to = names.length <= 2 ? names.join(' dan ') : `${names.length} anggota`;
  const total = late.reduce((a, p) => a + (p.wajib - p.setor), 0);
  return { to, total };
};

// ---- Antrian offline sync (13 / 13b) ----
// Setiap setoran/pengeluaran yang disimpan masuk antrian: online → langsung 'sent' (Terkirim), offline → 'pending' (Menunggu).
// Data tetap langsung tampil di app (disimpan lokal). Item: { id, clientId, kind, title, amount, at, status, attempts, sentAt }
export const MAX_ATTEMPTS = 3;
export const makeQueueItem = ({ kind, title, amount, online }) => {
  const now = Date.now();
  return {
    id: 'q' + now + Math.floor(Math.random() * 1000), clientId: 'CLIENT-' + (1000 + Math.floor(Math.random() * 9000)),
    kind, title, amount, at: now, status: online ? 'sent' : 'pending', attempts: 0, sentAt: online ? now : null,
  };
};
export const queueLabel = (i) => `${i.kind === 'in' ? 'Setoran' : i.title} ${rupiah(i.amount)}`;
export const queueStats = (q) => {
  const pending = q.filter((i) => i.status === 'pending').length;
  const failed = q.filter((i) => i.status === 'failed').length;
  return { pending, failed, sent: q.length - pending - failed, unsent: pending + failed };
};
// Kembali online: semua yang menunggu terkirim. Yang sudah gagal (3/3) tetap menunggu "Coba kirim ulang".
export const syncPending = (q, now = Date.now()) => q.map((i) => (i.status === 'pending' ? { ...i, status: 'sent', sentAt: now } : i));
// Coba kirim ulang saat online: semua yang belum terkirim (menunggu & gagal) terkirim.
export const syncAll = (q, now = Date.now()) => q.map((i) => (i.status !== 'sent' ? { ...i, status: 'sent', sentAt: now } : i));
// Coba kirim ulang saat masih offline: percobaan +1; mencapai 3/3 → Gagal.
export const failAttempt = (q) =>
  q.map((i) => {
    if (i.status === 'sent') return i;
    const attempts = Math.min(MAX_ATTEMPTS, i.attempts + 1);
    return { ...i, attempts, status: attempts >= MAX_ATTEMPTS ? 'failed' : 'pending' };
  });
