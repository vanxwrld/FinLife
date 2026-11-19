import React from 'react';
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import BottomNav, { NAV_HEIGHT } from '../components/BottomNav';
import { personInitials, queueStats } from '../store';
import { c, PAD } from '../theme';

// 11 — Profil & pengaturan. Antrian Offline Sync / Riwayat Sinkronisasi → 13 / 13b, Keamanan → 02b, Keluar Akun → 02.
export default function ProfilScreen({ user, queue, online, onNavigate, onEdit, onSecurity, onQueue, onLogout }) {
  const inset = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;
  if (!user) return null;
  const q = queueStats(queue);
  // Nilai kanan baris "Antrian Offline Sync": menunggu (amber) · gagal (merah) · semua terkirim (hijau)
  const qv = q.pending ? { t: `${q.pending} menunggu`, col: c.amber } : q.failed ? { t: `${q.failed} gagal`, col: c.red } : { t: 'Tersinkron', col: c.green };

  const rows = [
    { k: 'edit', label: 'Edit Profil', right: '›', col: c.mute, onPress: onEdit },
    { k: 'sec', label: 'Keamanan & Kata Sandi', right: '›', col: c.mute, onPress: onSecurity },
    { k: 'queue', label: 'Antrian Offline Sync', right: qv.t, col: qv.col, onPress: onQueue },
    { k: 'hist', label: 'Riwayat Sinkronisasi', right: online ? 'Online ›' : 'Offline ›', col: online ? c.green : c.amber, onPress: onQueue },
  ];

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: inset + 28, paddingHorizontal: PAD, paddingBottom: NAV_HEIGHT + 24 }}>
        <Text style={s.h1}>Profil saya</Text>
        <Text style={s.sub}>Akun & pengaturan</Text>

        <View style={s.avatar}><Text style={s.avTxt}>{personInitials(user.name)}</Text></View>
        <Text style={s.name}>{user.name}</Text>
        <Text style={s.handle}>@{user.username} · {user.email}</Text>

        <View style={{ marginTop: 28 }}>
          {rows.map((r) => (
            <Pressable key={r.k} onPress={r.onPress} accessibilityRole="button" accessibilityLabel={`${r.label}, ${r.right.replace('›', '').trim()}`}
              style={({ pressed }) => [s.row, pressed && { opacity: 0.8 }]}>
              <Text style={s.label}>{r.label}</Text>
              <Text style={[s.right, { color: r.col }]}>{r.right}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={onLogout} accessibilityRole="button"
          style={({ pressed }) => [s.logout, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}>
          <Text style={s.logoutTxt}>Keluar Akun</Text>
        </Pressable>
      </ScrollView>
      <BottomNav active="profile" onNavigate={onNavigate} />
    </View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  h1: { color: c.text, fontSize: 24, fontWeight: '700' },
  sub: { color: c.mute, fontSize: 12, marginTop: 6 },
  avatar: { alignSelf: 'center', marginTop: 28, width: 76, height: 76, borderRadius: 38, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  avTxt: { color: '#FFF', fontSize: 24, fontWeight: '700' },
  name: { color: c.text, fontSize: 18, fontWeight: '700', textAlign: 'center', marginTop: 16 },
  handle: { color: c.mute, fontSize: 12, textAlign: 'center', marginTop: 6 },
  row: { height: 48, borderRadius: 12, backgroundColor: c.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, marginBottom: 10 },
  label: { color: c.text, fontSize: 14 },
  right: { fontSize: 12, fontWeight: '700' },
  logout: { height: 52, borderRadius: 16, backgroundColor: c.red, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  logoutTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
