import React from 'react';
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Switch, Text, View } from 'react-native';
import BottomNav, { NAV_HEIGHT } from '../../components/BottomNav';
import { MAX_ATTEMPTS, dateTimeLabel, queueLabel, queueStats } from '../../store';
import { c, PAD } from '../../theme';

// 13 — Antrian offline: online (semua terkirim + riwayat pengiriman) · 13b — offline: menunggu / gagal + Coba kirim ulang.
// Satu layar yang mengikuti status koneksi dan isi antrian.
const BADGE = {
  sent: { t: 'Terkirim', col: c.green },
  pending: { t: 'Menunggu', col: c.amber },
  failed: { t: 'Gagal', col: c.red },
};

export default function AntrianScreen({ queue, online, onToggleOnline, onRetry, onNavigate }) {
  const inset = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;
  const q = queueStats(queue);
  // Menunggu dulu, lalu gagal (terbaru di atas); riwayat terkirim terbaru di atas.
  const waiting = queue.filter((i) => i.status !== 'sent').sort((a, b) => (a.status === b.status ? b.at - a.at : a.status === 'pending' ? -1 : 1));
  const sent = queue.filter((i) => i.status === 'sent').sort((a, b) => b.at - a.at);

  const card = online
    ? q.unsent
      ? { col: c.green, title: 'Status koneksi: ONLINE', msg: `${q.unsent} data belum terkirim. Ketuk Coba kirim ulang.` }
      : { col: c.green, title: 'Status koneksi: ONLINE', msg: 'Seluruh data lokal sudah tersinkron ke server.' }
    : { col: c.amber, title: 'Status koneksi: OFFLINE', msg: 'Data disimpan lokal, dikirim saat online.' };

  const sub = (i) =>
    i.status === 'sent' ? `ID klien: ${i.clientId} · dicatat ${dateTimeLabel(i.at)}`
      : i.status === 'failed' ? `Gagal sinkron · ${MAX_ATTEMPTS}/${MAX_ATTEMPTS} percobaan`
        : `Menunggu koneksi · percobaan ${i.attempts}/${MAX_ATTEMPTS}`;

  const Item = ({ i }) => {
    const b = BADGE[i.status];
    return (
      <View style={s.item} accessible accessibilityLabel={`${queueLabel(i)}, ${b.t}`}>
        <View style={{ flex: 1 }}>
          <Text style={s.title} numberOfLines={1}>{queueLabel(i)}</Text>
          <Text style={s.meta} numberOfLines={2}>{sub(i)}</Text>
        </View>
        <View style={[s.badge, { backgroundColor: b.col + '33' }]}><Text style={[s.badgeTxt, { color: b.col }]}>{b.t}</Text></View>
      </View>
    );
  };

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: inset + 28, paddingHorizontal: PAD, paddingBottom: NAV_HEIGHT + 24 }}>
        <Text style={s.h1}>Antrian Offline Sync</Text>
        <Text style={s.sub}>Status pengiriman data lokal ke server.</Text>

        <View style={[s.status, { borderColor: card.col }]}>
          <Text style={[s.statusTitle, { color: card.col }]}>{card.title}</Text>
          <Text style={s.statusMsg}>{card.msg}</Text>
        </View>

        {/* Status koneksi asli dibaca dari NetInfo (di App.js). Saklar ini memaksa offline untuk uji coba/demo. */}
        <View style={s.sim}>
          <View style={{ flex: 1 }}>
            <Text style={s.simTitle}>Simulasikan mode offline</Text>
            <Text style={s.simSub}>Untuk uji coba tanpa mematikan internet HP.</Text>
          </View>
          <Switch value={!online} onValueChange={(v) => onToggleOnline(!v)}
            trackColor={{ false: c.line, true: c.amber }} thumbColor="#FFF" accessibilityLabel="Simulasikan mode offline" />
        </View>

        {waiting.length > 0 && (
          <>
            <Text style={s.h2}>Antrian pengiriman</Text>
            {waiting.map((i) => <Item key={i.id} i={i} />)}
            <Pressable onPress={onRetry} accessibilityRole="button"
              style={({ pressed }) => [s.retry, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}>
              <Text style={s.retryTxt}>Coba kirim ulang</Text>
            </Pressable>
          </>
        )}

        {sent.length > 0 && (
          <>
            <Text style={s.h2}>Riwayat pengiriman antrian</Text>
            {sent.map((i) => <Item key={i.id} i={i} />)}
          </>
        )}

        {queue.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>Antrian kosong</Text>
            <Text style={s.emptySub}>Setoran dan pengeluaran yang kamu catat akan tercatat di sini beserta status pengirimannya.</Text>
          </View>
        )}
      </ScrollView>
      <BottomNav active="profile" onNavigate={onNavigate} />
    </View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  h1: { color: c.text, fontSize: 24, fontWeight: '700' },
  sub: { color: c.mute, fontSize: 12, marginTop: 6 },
  status: { marginTop: 16, minHeight: 64, borderRadius: 16, backgroundColor: c.card, borderWidth: 1.5, paddingHorizontal: 20, paddingVertical: 12, justifyContent: 'center' },
  statusTitle: { fontSize: 14, fontWeight: '700' },
  statusMsg: { color: c.mute, fontSize: 12, marginTop: 6, lineHeight: 17 },
  sim: { marginTop: 12, borderRadius: 12, backgroundColor: c.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, gap: 12 },
  simTitle: { color: c.text, fontSize: 13, fontWeight: '600' },
  simSub: { color: c.hint, fontSize: 11, marginTop: 3 },
  h2: { color: c.text, fontSize: 15, fontWeight: '700', marginTop: 26, marginBottom: 12 },
  item: { minHeight: 74, borderRadius: 12, backgroundColor: c.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, marginBottom: 8, gap: 12 },
  title: { color: c.text, fontSize: 14, fontWeight: '700' },
  meta: { color: c.mute, fontSize: 11, marginTop: 6, lineHeight: 16 },
  badge: { minWidth: 70, height: 22, borderRadius: 11, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
  retry: { height: 44, borderRadius: 14, backgroundColor: c.card, borderWidth: 1.5, borderColor: c.line, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  retryTxt: { color: c.text, fontSize: 14, fontWeight: '700' },
  empty: { marginTop: 26, borderRadius: 12, backgroundColor: c.card, padding: 20, alignItems: 'center' },
  emptyTitle: { color: c.text, fontSize: 14, fontWeight: '700' },
  emptySub: { color: c.mute, fontSize: 12, marginTop: 6, textAlign: 'center', lineHeight: 18 },
});
