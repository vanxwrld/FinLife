import React from 'react';
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import BottomNav, { NAV_HEIGHT } from '../components/BottomNav';
import { timeAgo } from '../store';
import { c, PAD } from '../theme';

// 10 — Notifikasi. Ketuk undangan → 10b (popup). Ketuk pengeluaran/setoran dicatat → Riwayat (09f bila bukan milikmu).
const ICON = {
  invite: ['\u2709\uFE0E', c.green],
  out: ['↑', c.red],
  in: ['↓', c.green],
  reminder: ['!', c.amber],
};

export default function NotifikasiScreen({ notifs, onOpen, onNavigate }) {
  const inset = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;
  const list = [...notifs].sort((a, b) => b.at - a.at);

  // Label kanan: undangan menunggu = "Baru"; sudah dijawab = status; lainnya "Baru" bila belum dibaca, jika tidak waktu.
  const tag = (n) => {
    if (n.kind === 'invite') {
      const st = n.invite.status;
      return st === 'pending' ? { t: 'Baru', col: c.green } : { t: st === 'accepted' ? 'Diterima' : 'Ditolak', col: c.mute };
    }
    return n.unread ? { t: 'Baru', col: c.green } : { t: timeAgo(n.at), col: c.mute };
  };

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: inset + 28, paddingHorizontal: PAD, paddingBottom: NAV_HEIGHT + 24 }}>
        <Text style={s.h1}>Notifikasi</Text>
        <Text style={s.sub}>Pemberitahuan aktivitas & undangan grup.</Text>

        {list.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>Belum ada notifikasi</Text>
            <Text style={s.emptySub}>Undangan grup dan aktivitas anggota lain akan muncul di sini.</Text>
          </View>
        )}

        <View style={{ marginTop: 18 }}>
          {list.map((n) => {
            const [glyph, col] = ICON[n.kind] || ICON.in;
            const t = tag(n);
            const declined = n.kind === 'invite' && n.invite.status === 'declined';
            return (
              <Pressable key={n.id} onPress={() => onOpen(n)} disabled={declined} accessibilityRole="button"
                accessibilityLabel={`${n.title}. ${n.text}. ${t.t}`}
                style={({ pressed }) => [s.row, pressed && { opacity: 0.8 }]}>
                <View style={[s.ic, { backgroundColor: col + '33' }]}><Text style={[s.icTxt, { color: col }]}>{glyph}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.title} numberOfLines={1}>{n.title}</Text>
                  <Text style={s.text} numberOfLines={2}>{n.text}</Text>
                </View>
                <Text style={[s.tag, { color: t.col }]}>{t.t}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <BottomNav active="notif" onNavigate={onNavigate} />
    </View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  h1: { color: c.text, fontSize: 24, fontWeight: '700' },
  sub: { color: c.mute, fontSize: 12, marginTop: 6 },
  row: { minHeight: 70, borderRadius: 12, backgroundColor: c.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, gap: 12 },
  ic: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  icTxt: { fontSize: 16 },
  title: { color: c.text, fontSize: 14, fontWeight: '700' },
  text: { color: c.mute, fontSize: 11, marginTop: 6, lineHeight: 16 },
  tag: { fontSize: 11, fontWeight: '700', alignSelf: 'flex-start', marginTop: 4 },
  empty: { marginTop: 18, borderRadius: 12, backgroundColor: c.card, padding: 20, alignItems: 'center' },
  emptyTitle: { color: c.text, fontSize: 14, fontWeight: '700' },
  emptySub: { color: c.mute, fontSize: 12, marginTop: 6, textAlign: 'center' },
});
