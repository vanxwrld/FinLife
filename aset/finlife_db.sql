-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 15 Okt 2026 pada 07.37
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `finlife_db`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `contributions`
--

CREATE TABLE `contributions` (
  `id` int(11) NOT NULL,
  `id_klien` varchar(36) DEFAULT NULL,
  `id_grup` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `id_pencatat` int(11) NOT NULL,
  `nominal` decimal(15,2) NOT NULL,
  `keterangan` varchar(255) DEFAULT NULL,
  `tanggal` date NOT NULL,
  `status_data` enum('aktif','dihapus') DEFAULT 'aktif',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `diperbarui_pada` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `contributions`
--

INSERT INTO `contributions` (`id`, `id_klien`, `id_grup`, `id_user`, `id_pencatat`, `nominal`, `keterangan`, `tanggal`, `status_data`, `created_at`, `diperbarui_pada`) VALUES
(1, NULL, 1, 4, 4, 100000.00, 'Uang kas awal', '2026-10-13', 'aktif', '2026-10-13 10:44:01', '2026-10-13 10:44:01'),
(2, NULL, 2, 5, 5, 150000.00, 'Setoran minggu 1', '2026-10-14', 'aktif', '2026-10-14 00:46:53', '2026-10-14 00:46:53'),
(3, NULL, 2, 5, 5, 100.00, 'keterangan\"; DROP TABLE contributions; --', '2026-10-14', 'aktif', '2026-10-14 00:57:51', '2026-10-14 00:57:51');

-- --------------------------------------------------------

--
-- Struktur dari tabel `expenses`
--

CREATE TABLE `expenses` (
  `id` int(11) NOT NULL,
  `id_klien` varchar(36) DEFAULT NULL,
  `id_grup` int(11) NOT NULL,
  `id_pembayar` int(11) NOT NULL,
  `id_pencatat` int(11) NOT NULL,
  `nama_pengeluaran` varchar(150) NOT NULL,
  `total_nominal` decimal(15,2) NOT NULL,
  `metode_pembagian` enum('bagi_rata','nominal_masing_masing') NOT NULL DEFAULT 'bagi_rata',
  `tanggal` date NOT NULL,
  `status_data` enum('aktif','dihapus') DEFAULT 'aktif',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `diperbarui_pada` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `expenses`
--

INSERT INTO `expenses` (`id`, `id_klien`, `id_grup`, `id_pembayar`, `id_pencatat`, `nama_pengeluaran`, `total_nominal`, `metode_pembagian`, `tanggal`, `status_data`, `created_at`, `diperbarui_pada`) VALUES
(1, NULL, 1, 4, 4, 'Galon & Gas', 50000.00, 'bagi_rata', '2026-10-13', 'aktif', '2026-10-13 10:44:03', '2026-10-13 10:44:03'),
(2, NULL, 2, 5, 5, 'Makan malam', 90000.00, 'bagi_rata', '2026-10-14', 'aktif', '2026-10-14 00:47:26', '2026-10-14 00:47:26'),
(3, NULL, 2, 5, 5, 'Test inject user lain', 100.00, 'bagi_rata', '2026-10-14', 'aktif', '2026-10-14 00:57:51', '2026-10-14 00:57:51'),
(4, NULL, 2, 6, 5, 'Test bad pembayar', 100.00, 'bagi_rata', '2026-10-14', 'aktif', '2026-10-14 00:58:32', '2026-10-14 00:58:32'),
(5, NULL, 2, 5, 5, 'Test bagi 3', 100.00, 'bagi_rata', '2026-10-14', 'aktif', '2026-10-14 00:58:33', '2026-10-14 00:58:33'),
(6, NULL, 2, 6, 5, 'Test bad pembayar', 100.00, 'bagi_rata', '2026-10-14', 'aktif', '2026-10-14 01:00:37', '2026-10-14 01:00:37'),
(7, NULL, 2, 5, 5, 'Test bad split', 100.00, 'bagi_rata', '2026-10-14', 'aktif', '2026-10-14 01:00:37', '2026-10-14 01:00:37'),
(8, NULL, 2, 5, 5, 'Test normal post-fix', 60.00, 'bagi_rata', '2026-10-14', 'aktif', '2026-10-14 01:00:37', '2026-10-14 01:00:37'),
(9, NULL, 2, 5, 5, 'Normal', 50000.00, 'bagi_rata', '2026-10-14', 'aktif', '2026-10-14 01:02:47', '2026-10-14 01:02:47');

-- --------------------------------------------------------

--
-- Struktur dari tabel `expense_splits`
--

CREATE TABLE `expense_splits` (
  `id` int(11) NOT NULL,
  `id_pengeluaran` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `nominal_bagian` decimal(15,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `expense_splits`
--

INSERT INTO `expense_splits` (`id`, `id_pengeluaran`, `id_user`, `nominal_bagian`) VALUES
(1, 1, 4, 50000.00),
(2, 2, 5, 90000.00),
(3, 3, 6, 100.00),
(4, 4, 5, 100.00),
(5, 5, 5, 33.33),
(6, 5, 5, 33.33),
(7, 5, 5, 33.34),
(8, 6, 5, 100.00),
(9, 7, 6, 100.00),
(10, 8, 5, 60.00),
(11, 9, 5, 50000.00);

-- --------------------------------------------------------

--
-- Struktur dari tabel `groups`
--

CREATE TABLE `groups` (
  `id` int(11) NOT NULL,
  `nama_grup` varchar(100) NOT NULL,
  `id_pembuat` int(11) NOT NULL,
  `kode_undangan` varchar(20) NOT NULL,
  `total_setoran` decimal(15,2) DEFAULT 0.00,
  `total_pengeluaran` decimal(15,2) DEFAULT 0.00,
  `saldo_grup` decimal(15,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `groups`
--

INSERT INTO `groups` (`id`, `nama_grup`, `id_pembuat`, `kode_undangan`, `total_setoran`, `total_pengeluaran`, `saldo_grup`, `created_at`) VALUES
(1, 'Kos Berkah', 4, '9CBA58', 100000.00, 50000.00, 50000.00, '2026-10-13 10:43:59'),
(2, 'Arisan RT 01', 5, 'F0B4A6', 150100.00, 140560.00, 9540.00, '2026-10-14 00:46:37');

-- --------------------------------------------------------

--
-- Struktur dari tabel `group_members`
--

CREATE TABLE `group_members` (
  `id` int(11) NOT NULL,
  `id_grup` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `id_pengundang` int(11) DEFAULT NULL,
  `peran` enum('admin','anggota') NOT NULL DEFAULT 'anggota',
  `status` enum('aktif','undangan') NOT NULL DEFAULT 'aktif',
  `tanggal_bergabung` timestamp NULL DEFAULT NULL,
  `tanggal_diundang` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `group_members`
--

INSERT INTO `group_members` (`id`, `id_grup`, `id_user`, `id_pengundang`, `peran`, `status`, `tanggal_bergabung`, `tanggal_diundang`) VALUES
(1, 1, 4, NULL, 'admin', 'aktif', '2026-10-13 10:43:59', '2026-10-13 10:43:59'),
(2, 2, 5, NULL, 'admin', 'aktif', '2026-10-14 00:46:37', '2026-10-14 00:46:37');

-- --------------------------------------------------------

--
-- Struktur dari tabel `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `id_grup` int(11) NOT NULL,
  `id_referensi` int(11) DEFAULT NULL,
  `jenis` enum('undangan','transaksi','pengingat') NOT NULL,
  `pesan` varchar(255) NOT NULL,
  `status_baca` tinyint(1) DEFAULT 0,
  `tanggal` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `password_resets`
--

CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `kedaluwarsa_pada` datetime NOT NULL,
  `sudah_dipakai` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `transaction_logs`
--

CREATE TABLE `transaction_logs` (
  `id` int(11) NOT NULL,
  `id_grup` int(11) NOT NULL,
  `id_transaksi` int(11) NOT NULL,
  `jenis_transaksi` enum('setoran','pengeluaran') NOT NULL,
  `aksi` enum('tambah','ubah','hapus') NOT NULL,
  `id_pelaku` int(11) NOT NULL,
  `nilai_lama` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`nilai_lama`)),
  `nilai_baru` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`nilai_baru`)),
  `waktu` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `username` varchar(50) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `nama`, `username`, `email`, `password_hash`, `created_at`) VALUES
(1, 'Novan', NULL, 'novan@test.com', '12345', '2026-10-10 11:59:24'),
(2, 'Test User', NULL, 'test@test.com', 'pass123', '2026-10-13 09:20:53'),
(3, 'Test User', NULL, 'test@example.com', 'password123', '2026-10-13 10:23:00'),
(4, 'Test User 2', 'testuser2', 'test2@example.com', '$2b$10$DVujHaZ26Y8AtWUKUWPyJePYjQ2PtE17OHmF1mQ2Nh.WbG9zHsXB6', '2026-10-13 10:37:33'),
(5, 'Test User', 'testuser', 'test@finlife.com', '$2b$10$jzcpLw7Do.9hI3lSuZJVBe5I9VvNA7gx9yJvgJslfW.Mae01Je7Mm', '2026-10-14 00:46:08'),
(6, 'User Lain', 'userlain', 'lain@finlife.com', '$2b$10$x30YCKurrPbpplM9r3PsAuForIf2nSUNzJv1I5ydy04mc3OknVO0K', '2026-10-14 00:57:25'),
(7, 'Test User', NULL, 'test_debug_2@example.com', '$2b$10$RLLAhcaO8mrG61dp68qJO.JqdeO2L/DYuFo.lSuQ3TZgdCJkZVyQ6', '2026-10-14 02:20:07');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `contributions`
--
ALTER TABLE `contributions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id_klien` (`id_klien`),
  ADD KEY `id_grup` (`id_grup`),
  ADD KEY `id_user` (`id_user`),
  ADD KEY `id_pencatat` (`id_pencatat`);

--
-- Indeks untuk tabel `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id_klien` (`id_klien`),
  ADD KEY `id_grup` (`id_grup`),
  ADD KEY `id_pembayar` (`id_pembayar`),
  ADD KEY `id_pencatat` (`id_pencatat`);

--
-- Indeks untuk tabel `expense_splits`
--
ALTER TABLE `expense_splits`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_pengeluaran` (`id_pengeluaran`),
  ADD KEY `id_user` (`id_user`);

--
-- Indeks untuk tabel `groups`
--
ALTER TABLE `groups`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kode_undangan` (`kode_undangan`),
  ADD KEY `id_pembuat` (`id_pembuat`);

--
-- Indeks untuk tabel `group_members`
--
ALTER TABLE `group_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_group_user` (`id_grup`,`id_user`),
  ADD KEY `id_user` (`id_user`);

--
-- Indeks untuk tabel `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_user` (`id_user`),
  ADD KEY `id_grup` (`id_grup`);

--
-- Indeks untuk tabel `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_user` (`id_user`);

--
-- Indeks untuk tabel `transaction_logs`
--
ALTER TABLE `transaction_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_grup` (`id_grup`),
  ADD KEY `id_pelaku` (`id_pelaku`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `contributions`
--
ALTER TABLE `contributions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT untuk tabel `expenses`
--
ALTER TABLE `expenses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT untuk tabel `expense_splits`
--
ALTER TABLE `expense_splits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT untuk tabel `groups`
--
ALTER TABLE `groups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT untuk tabel `group_members`
--
ALTER TABLE `group_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT untuk tabel `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `transaction_logs`
--
ALTER TABLE `transaction_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `contributions`
--
ALTER TABLE `contributions`
  ADD CONSTRAINT `contributions_ibfk_1` FOREIGN KEY (`id_grup`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `contributions_ibfk_2` FOREIGN KEY (`id_user`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `contributions_ibfk_3` FOREIGN KEY (`id_pencatat`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`id_grup`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `expenses_ibfk_2` FOREIGN KEY (`id_pembayar`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `expenses_ibfk_3` FOREIGN KEY (`id_pencatat`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `expense_splits`
--
ALTER TABLE `expense_splits`
  ADD CONSTRAINT `expense_splits_ibfk_1` FOREIGN KEY (`id_pengeluaran`) REFERENCES `expenses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `expense_splits_ibfk_2` FOREIGN KEY (`id_user`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `groups`
--
ALTER TABLE `groups`
  ADD CONSTRAINT `groups_ibfk_1` FOREIGN KEY (`id_pembuat`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `group_members`
--
ALTER TABLE `group_members`
  ADD CONSTRAINT `group_members_ibfk_1` FOREIGN KEY (`id_grup`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `group_members_ibfk_2` FOREIGN KEY (`id_user`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`id_grup`) REFERENCES `groups` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `password_resets`
--
ALTER TABLE `password_resets`
  ADD CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `transaction_logs`
--
ALTER TABLE `transaction_logs`
  ADD CONSTRAINT `transaction_logs_ibfk_1` FOREIGN KEY (`id_grup`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transaction_logs_ibfk_2` FOREIGN KEY (`id_pelaku`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
