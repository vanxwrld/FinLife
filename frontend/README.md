# FinLife — Autentikasi + Dashboard & Grup + Setoran + Pengeluaran + Status Keuangan + Riwayat & Koreksi + Notifikasi + Profil & Antrian Offline (Expo / React Native)

Tahap 1: Splash, Sambutan, Login (+gagal), Daftar (+gagal), Lupa kata sandi, Reset kata sandi (OTP).

## Cara menjalankan
```bash
npx create-expo-app@latest finlife --template blank
cd finlife
npx expo install react-native-svg expo-clipboard @react-native-async-storage/async-storage @react-native-community/netinfo
# salin App.js dan folder src/ dari ZIP ini ke dalam folder finlife (timpa App.js)
npx expo start
```
Scan QR dengan Expo Go.

## Tahap 2: Dashboard & Grup (US-02, US-03, US-13 / F2, F3)
- 01 Dashboard — login berhasil masuk ke sini.
- 04 Daftar grup — tab **Grup** (ada pencarian).
- 04b Daftar grup kosong — otomatis tampil setelah **Daftar** akun baru.
- 04c Buat grup — modal dari tombol "+ Buat grup baru"/"+ Buat Grup Pertama" (validasi nama, kode undangan otomatis, kamu jadi admin). Setelah simpan → Detail grup baru.
- 04d Undang anggota — modal dari tombol "Undang" di Dashboard (pilih grup) dan "+ Undang anggota" di Detail grup. Cari username (coba: `@rina`, `@bagas`, `@dimas`), tombol Undang, dan Salin Kode Undangan.
- 05 Detail grup — ketuk kartu grup di Dashboard atau Daftar grup.
- Tombol/tab yang layarnya belum dibuat (Catat, Notifikasi, Profil, Setoran, Pengeluaran, Riwayat, Kirim pengingat) menampilkan toast "belum dibuat".

## Tahap 3: Setoran (US-04 / F4)
- 06 Catat setoran — dari tombol **Setoran** (Dashboard), **+ Setoran** (Detail grup), atau tab **Catat**. Pilih grup aktif ("Ganti ▾"), anggota penyetor, nominal, tanggal (7 hari terakhir), keterangan opsional.
- 06b Validasi nominal — nominal kosong/0 → border merah + "⚠ Nominal setoran harus lebih dari Rp 0".
- 06c Ringkasan setoran — tampil setelah **Simpan setoran**, atau dari "Total setoran …" di Detail grup. Setoran yang disimpan menambah saldo grup, total setor anggota, dan muncul di "Transaksi terbaru" Dashboard.
- Banner "Input bisa disimpan saat offline" hanya tampilan; antrian offline (13/13b) belum dibuat.

## Tahap 4: Pengeluaran & pembagian (US-05, US-06 / F5)
- 07 Pengeluaran: bagi rata — dari tombol **Keluar** (Dashboard) atau **- Pengeluaran** (Detail grup). Isi nama, total nominal, tanggal, centang anggota yang ikut; nominal per orang dihitung otomatis (sisa pembulatan ke anggota teratas).
- 07b Pengeluaran: nominal sendiri — pilih segmen **Nominal sendiri**, isi nominal tiap anggota (awalnya terisi bagi rata).
- 07c Peringatan selisih — bila jumlah nominal per anggota ≠ total, muncul banner amber live, dan saat **Simpan** muncul sheet "Pembagian belum pas" (Kurang/Lebih Rp …) dengan tombol **Sesuaikan otomatis** / **Perbaiki manual**.
- Setelah disimpan: saldo kas grup berkurang sebesar total, "Wajib" tiap anggota naik sebesar bagiannya (status Lebih/Kurang di Detail grup ikut berubah), dan muncul di "Transaksi terbaru" Dashboard (merah).
- Pengeluaran yang melebihi saldo kas ditolak.
- Desain 07/07b/07c tidak dilampirkan, jadi tata letak dirancang mengikuti layar Setoran — sesuaikan bila SVG desainnya berbeda.

## Tahap 5: Status & kewajiban (US-07–09 / F7)
- 08 Status keuangan (Balance) — dari **Status lengkap ›** di Detail grup. Kartu status, ringkasan total setoran / pengeluaran / kewajiban / saldo kas, dan status tiap anggota. Ketuk anggota → 08c.
- 08b Status belum lunas — tombol **Lihat yang belum lunas ›** (hanya muncul bila ada anggota kurang bayar). Urutan: kurang bayar dulu, lalu lebih, lalu pas. Ketuk anggota → 08c.
- 08c Detail kewajiban anggota — total kewajiban, selisih setoran, dan rincian tiap transaksi pengeluaran yang dibebankan (bagi rata / nominal sendiri). Tombol **Kirim pengingat** hanya untuk anggota yang kurang bayar.
- Semua angka dihitung dari data grup. Pengeluaran baru dari layar 07 otomatis masuk ke rincian 08c dan mengubah status.
- **Kirim pengingat** menuju 10c (Notifikasi) yang belum dibuat → toast "belum dibuat".

## Tahap 6: Riwayat & koreksi (US-14, US-15 / F6, F8) — bagian 09, 09b, 09c
- 09 Riwayat transaksi — dari tombol **Riwayat** di Detail grup. Log kronologis (terbaru di atas), chip filter **Semua / Setoran / Pengeluaran**.
- 09b Filter setoran — ketuk chip **Setoran** (atau **Pengeluaran**); tetap satu layar, hanya daftarnya yang disaring. Chip **Semua** mengembalikan semua.
- Penanda: badge amber **Diedit** pada transaksi yang pernah dikoreksi; transaksi yang **dihapus** tetap tampil abu-abu (✕) dengan keterangan "Dihapus oleh … · tanggal" sebagai jejak audit (tidak bisa dibuka).
- 09c Detail transaksi (pencatat) — ketuk transaksi yang **kamu catat sendiri** (demo: *Setoran Alifatuz* dan *Galon & sabun*). Bottom sheet: Dicatat oleh, Dibayar oleh, Tanggal, Metode pembagian, Pembagian biaya per anggota, banner "Diedit oleh …", tombol **Ubah Data** / **Hapus** / **Tutup**. Untuk setoran, baris "Dibayar oleh" menjadi "Disetor oleh" dan tidak ada pembagian biaya.
- Transaksi anggota lain → 09f (lihat Tahap 7). **Ubah Data** → 09d dan **Hapus** → 09e (lihat Tahap 7).
- Setoran dan pengeluaran baru (layar 06 / 07) otomatis masuk ke riwayat grup, dengan pencatat = akun yang login.
- Data riwayat disimpan di `group.history` (lihat bagian "Riwayat & koreksi" di `src/store.js`). Seed demo grup *Anak Kos Ceria* sama dengan desain 09.

## Tahap 7: Koreksi & hapus (US-14, US-15 / F6, F8) — bagian 09f, 09d, 09e
- 09f Detail transaksi (read-only) — ketuk transaksi yang dicatat **orang lain** (demo: *Makan malam bersama*, *Setoran Novan*). Isinya sama dengan 09c, tetapi diganti banner "Terkunci: hanya pencatat (…) atau admin grup yang dapat mengoreksi transaksi ini." dan tombol **Tutup**.
- Siapa yang boleh mengoreksi/menghapus: **pencatat** atau **admin grup** (`group.admin`). Demo: admin *Anak Kos Ceria* = Novan, *Liburan Jogja* = Alifatuz, *Proyek Kelas* = Novan. Grup baru: pembuatnya jadi admin.
- 09d Koreksi transaksi — dari **Ubah Data** di sheet 09c. Pengeluaran: nama, total, metode pembagian (Bagi rata / Nominal sendiri, lengkap dengan input per anggota dan "Sesuaikan otomatis"), alasan. Setoran: nominal dan alasan. **Alasan koreksi wajib diisi** (jejak audit). Validasi: nominal > 0, kas tidak boleh negatif, jumlah pembagian harus pas dengan total.
- Setelah **Simpan Perubahan**: saldo kas, setoran/kewajiban anggota, rincian pengeluaran (Status 08c), dan riwayat ikut berubah; transaksi diberi badge **Diedit** + banner "Diedit oleh … · waktu". Status grup tetap Balance.
- 09e Konfirmasi hapus — dari **Hapus** di sheet 09c. **Ya, Hapus**: transaksi dikeluarkan dari saldo & kewajiban (dihitung ulang) tetapi tetap tampil abu-abu di riwayat ("Dihapus oleh … · tanggal"). Setoran tidak bisa dihapus bila membuat saldo kas negatif.
- Catatan: banner "Koreksi hanya dapat dilakukan saat online" baru tampilan (antrian offline 13/13b belum dibuat). Daftar "Transaksi terbaru" di Dashboard adalah daftar terpisah dan belum ikut berubah saat koreksi/hapus.

## Tahap 8: Notifikasi, undangan & pengingat (US-10, US-11 / F9) — bagian 10, 10b, 10c
- 10 Notifikasi — tab **Notifikasi** di bottom nav. Daftar terbaru di atas: undangan grup (label **Baru**), pengeluaran dicatat (*2 jam lalu*), setoran dicatat (*6 Okt*). Akun baru (hasil Daftar) punya notifikasi kosong.
- 10b Pop-up undangan — ketuk **Undangan Grup Baru**. **Terima** → kamu masuk ke grup *Jalan-jalan Bromo* (kode BRM315, 4 anggota, saldo Rp 0) dan diarahkan ke Daftar grup (04). **Tolak** → kembali ke Notifikasi. Setelah dijawab, label berubah jadi *Diterima* / *Ditolak*; undangan yang diterima bisa diketuk untuk membuka grupnya.
- Ketuk **Pengeluaran Dicatat** → Riwayat grup *Anak Kos Ceria* dengan detail *Makan malam bersama* langsung terbuka (09f, read-only karena dicatat Novan). Ketuk **Setoran Dicatat** → Riwayat grup tersebut.
- 10c Kirim pengingat — dari **Kirim pengingat** di 08c atau **Kirim pengingat ke …** di 08b. Modal "Kirim Pengingat Tagihan" menampilkan nama dan jumlah kurang bayar (beberapa anggota → total). **Kirim Notifikasi Pengingat** → toast terkirim, **Batal** → kembali.
- Catatan: ini aplikasi satu pengguna di memori, jadi pengingat yang "dikirim" belum benar-benar sampai ke akun lain (butuh backend). Tab **Profil** (11) masih toast.

## Tahap 9: Profil & antrian offline (F1, F10) — bagian 11, 13, 13b
- 11 Profil & pengaturan — tab **Profil**. Avatar inisial, nama, @username · email, lalu menu:
  - **Edit Profil** → belum dibuat (toast; desainnya tidak ada).
  - **Keamanan & Kata Sandi** → alur Lupa/Reset kata sandi (02b/02c) dengan email terisi otomatis; selesai → kembali ke Profil (tidak logout).
  - **Antrian Offline Sync** (nilai kanan: *N menunggu* amber / *N gagal* merah / *Tersinkron* hijau) dan **Riwayat Sinkronisasi** (*Online ›* / *Offline ›*) → layar Antrian.
  - **Keluar Akun** → Login (02). Bila masih ada data belum terkirim, muncul dialog konfirmasi dulu.
- 13 / 13b Antrian offline — satu layar yang mengikuti status koneksi. Online: kartu hijau "ONLINE" + **Riwayat pengiriman antrian** (Terkirim, ID klien CLIENT-xxxx, waktu dicatat). Offline: kartu amber "OFFLINE" + **Antrian pengiriman** (Menunggu *percobaan n/3*, Gagal *3/3*) + tombol **Coba kirim ulang**.
- Cara mencoba (tanpa mematikan internet HP): Profil → Antrian Offline Sync → nyalakan **Simulasikan mode offline**. Lalu catat setoran/pengeluaran → masuk antrian *Menunggu* (data tetap langsung tampil di app, toast "Dikirim saat online"). Ketuk **Coba kirim ulang** 3× saat offline → status **Gagal**. Matikan simulasi → yang *Menunggu* otomatis **Terkirim**; yang *Gagal* tetap menunggu **Coba kirim ulang** saat online.
- Saat offline: **Koreksi** (09d) dan **Hapus** (09e) ditolak dengan pesan "hanya dapat dilakukan saat online"; banner di layar Setoran berubah jadi "Kamu sedang offline".
- Status koneksi saat ini **simulasi** (state `online` di `App.js`). Saat backend siap, ganti dengan `@react-native-community/netinfo` dan kirim `queue` ke API.

## Struktur
```
App.js                 navigasi sederhana (stack state) + alert + toast
src/theme.js           warna dari desain
src/store.js           data dummy & helper validasi
src/components/        Logo, Screen, Field, Button, AlertModal, Toast
src/screens/           Splash, Welcome, Login, Register, Forgot, Reset, Dashboard, GroupList, GroupDetail, Setoran, SetoranSummary, Pengeluaran, Status, StatusLate, StatusMember, Riwayat, Koreksi, Notifikasi, Profil, Antrian
src/components/PickerSheet.js  sheet pilihan (grup / anggota / tanggal)
src/components/BottomNav.js  navigasi bawah
src/components/TxDetailSheet.js  sheet detail transaksi (09c / 09f)
src/components/ConfirmDeleteModal.js  konfirmasi hapus (09e)
src/components/DialogModal.js  dialog tengah layar (10b undangan, 10c pengingat)
```

## Tanpa data dummy
App mulai **kosong**. Semuanya dibuat sendiri di dalam app:
1. **Daftar** akun → langsung masuk ke Daftar grup kosong. Sesi tersimpan: buka app lagi langsung masuk (Keluar di Profil untuk mengakhiri sesi).
2. **Buat grup** → bagikan **kode grup** atau undang lewat **username**. Anggota lain bisa **Gabung dengan kode** (tombol di Daftar grup) atau menerima undangan di Notifikasi.
3. Catat setoran, pengeluaran (ada pilihan **Dibayar oleh**), koreksi, dst. — mulai dari saldo Rp 0.

Cara uji dua akun di satu HP: daftar akun A → buat grup → catat setoran → Keluar → daftar akun B → Gabung dengan kode → buka Notifikasi (ada "Setoran Dicatat" dari A) → saldo & riwayat grup sama dengan yang dilihat A.

## Penyimpanan & keamanan
- Akun, sesi, grup, dan data tiap akun disimpan di perangkat (AsyncStorage, `src/storage.js`) — tidak hilang saat reload.
- Grup disimpan bersama per kode grup, jadi semua akun di perangkat ini melihat data grup yang sama. Antar-perangkat butuh backend.
- Kata sandi disimpan sebagai **hash SHA-256 + salt** (`src/hash.js`), bukan teks biasa.
- Status online dibaca dari **NetInfo**. Saklar "Simulasikan mode offline" (Profil → Antrian) memaksa offline untuk demo. Saat kembali online, antrian menunggu otomatis terkirim.
- Notifikasi: undangan, setoran/pengeluaran baru, dan pengingat tagihan dikirim ke akun tujuan (di perangkat yang sama).
- Kode OTP reset kata sandi tetap `8241` (belum ada layanan email).
- Mengosongkan semua data: hapus data Expo Go (Android: Pengaturan → Aplikasi → Expo Go → Hapus data).
