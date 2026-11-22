// Utilitas tanggal & waktu — diekstrak dari store.js

export const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/** Format penuh: "14 Oktober 2026" */
export const formatDate = (d) =>
  `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;

/** Apakah dua Date jatuh di hari yang sama */
export const sameDay = (a, b) => a.toDateString() === b.toDateString();

/** Apakah Date d adalah hari ini */
export const isToday = (d) => sameDay(d, new Date());

/** 7 hari terakhir (hari ini dulu) untuk picker tanggal */
export const recentDates = (count = 7) => {
  const now = new Date();
  return Array.from({ length: count }, (_, i) =>
    new Date(now.getFullYear(), now.getMonth(), now.getDate() - i),
  );
};

/** Tanggal pendek: "Hari ini" atau "5 Okt" */
export const shortDate = (d) =>
  isToday(d) ? 'Hari ini' : `${d.getDate()} ${BULAN[d.getMonth()].slice(0, 3)}`;

/** Tanggal pilihan + jam saat ini → timestamp ms (urutan kronologis tetap benar) */
export const stampOn = (date) => {
  const now = new Date();
  return new Date(
    date.getFullYear(), date.getMonth(), date.getDate(),
    now.getHours(), now.getMinutes(), now.getSeconds(),
  ).getTime();
};

export const pad2 = (v) => String(v).padStart(2, '0');
export const mon3 = (d) => BULAN[d.getMonth()].slice(0, 3);

/** "14 Okt 2026" */
export const dateLabel = (ts) => {
  const d = new Date(ts);
  return `${d.getDate()} ${mon3(d)} ${d.getFullYear()}`;
};

/** "5 Okt" */
export const dayMonth = (ts) => {
  const d = new Date(ts);
  return `${d.getDate()} ${mon3(d)}`;
};

/** "13 Okt 08.15" */
export const dateTimeLabel = (ts) => {
  const d = new Date(ts);
  return `${d.getDate()} ${mon3(d)} ${pad2(d.getHours())}.${pad2(d.getMinutes())}`;
};

/** "5 menit lalu", "2 jam lalu", atau "5 Okt" */
export const timeAgo = (ts, now = Date.now()) => {
  const m = Math.floor((now - ts) / 60000);
  if (m < 1) return 'Baru saja';
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h} jam lalu` : dayMonth(ts);
};
