// Token warna & ukuran — diambil dari SVG desain FinLife
export const c = {
  bg: '#0B132B', card: '#1C2541', line: '#2A3558',
  green: '#00E676', blue: '#00B0FF', red: '#EF4444', yellow: '#FFD600', amber: '#F59E0B',
  text: '#FFFFFF', mute: '#9CA3AF', hint: '#6B7280',
};
// Warna "Lebih bayar" pada desain Status keuangan (08–08c)
export const LEBIH = '#3B82F6';
export const PAD = 25;
export const rupiah = (n) => 'Rp ' + Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
export const rb = (n) => (n >= 1000 ? 'Rp ' + Math.round(n / 1000) + 'rb' : 'Rp ' + n);
