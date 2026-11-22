// Utilitas format angka — diekstrak dari theme.js

/** Format rupiah penuh: "Rp 1.500.000" (selalu positif) */
export const rupiah = (n) =>
  'Rp ' + Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** Format rupiah ringkas: "Rp 1.500rb" atau "Rp 500" */
export const rb = (n) =>
  n >= 1000 ? 'Rp ' + Math.round(n / 1000) + 'rb' : 'Rp ' + n;
