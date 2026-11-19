import React from 'react';
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import BottomNav, { NAV_HEIGHT } from '../components/BottomNav';
import { personInitials } from '../store';
import { c, PAD, rb, rupiah } from '../theme';

// 05 — Detail grup
const BLUE = '#3B82F6';
const status = (diff) =>
  diff > 0 ? { t: `Lebih ${rb(diff)}`, col: BLUE } : diff < 0 ? { t: `Kurang ${rb(-diff)}`, col: c.amber } : { t: 'Pas', col: c.green };

export default function GroupDetailScreen({ group, onNavigate, onSoon, onInvite, onSetoran, onSetoranSummary, onPengeluaran, onStatus, onRiwayat }) {
  const inset = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;
  if (!group) return null;
  const totalSetor = group.people.reduce((a, p) => a + p.setor, 0);

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: inset + 28, paddingHorizontal: PAD, paddingBottom: NAV_HEIGHT + 24 }}>
        <Text style={s.h1}>{group.name}</Text>
        <Text style={s.sub}>Ringkasan keuangan · Kode {group.code}</Text>

        <View style={s.card}>
          <Text style={s.cardLbl}>Saldo kas grup</Text>
          <Text style={s.cardAmt}>{rupiah(group.balance)}</Text>
          <Text style={s.cardBal}>● Balance · {group.people.length} anggota</Text>
        </View>

        <View style={s.actions}>
          <Pressable style={s.act} onPress={() => onSetoran(group)}><Text style={[s.actTxt, { color: c.green }]}>+ Setoran</Text></Pressable>
          <Pressable style={s.act} onPress={() => onPengeluaran(group)}><Text style={[s.actTxt, { color: c.red }]}>- Pengeluaran</Text></Pressable>
          <Pressable style={s.act} onPress={() => onRiwayat(group)}><Text style={[s.actTxt, { color: c.blue }]}>Riwayat</Text></Pressable>
        </View>

        <View style={s.head}>
          <Text style={s.h2}>Ringkasan anggota</Text>
          <Pressable hitSlop={8} onPress={() => onStatus(group)}><Text style={s.link}>Status lengkap ›</Text></Pressable>
        </View>
        {group.people.map((p) => {
          const st = status(p.setor - p.wajib);
          return (
            <View key={p.username} style={s.row}>
              <View style={[s.av, { backgroundColor: p.color }]}><Text style={s.avTxt}>{personInitials(p.name)}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{p.name}</Text>
                <Text style={s.meta}>Setor {rb(p.setor)} · Wajib {rb(p.wajib)}</Text>
              </View>
              <Text style={[s.st, { color: st.col }]}>{st.t}</Text>
            </View>
          );
        })}

        <Pressable style={s.outline} onPress={() => onSetoranSummary(group)}>
          <Text style={s.outlineTxt}>Total setoran {rupiah(totalSetor)}  ›</Text>
        </Pressable>
        <Pressable style={[s.outline, { marginTop: 12 }]} onPress={() => onInvite(group)}>
          <Text style={s.outlineTxt}>+ Undang anggota</Text>
        </Pressable>
      </ScrollView>
      <BottomNav active="groups" onNavigate={onNavigate} />
    </View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  h1: { color: c.text, fontSize: 24, fontWeight: '700' },
  sub: { color: c.mute, fontSize: 12, marginTop: 6 },
  card: { marginTop: 16, borderRadius: 16, backgroundColor: c.card, borderWidth: 1.5, borderColor: c.green, padding: 20 },
  cardLbl: { color: c.mute, fontSize: 12 },
  cardAmt: { color: c.text, fontSize: 28, fontWeight: '700', marginTop: 8 },
  cardBal: { color: c.green, fontSize: 12, fontWeight: '700', marginTop: 8 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 14 },
  act: { flex: 1, height: 46, borderRadius: 12, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' },
  actTxt: { fontSize: 12, fontWeight: '700' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 12 },
  h2: { color: c.text, fontSize: 16, fontWeight: '700' },
  link: { color: c.green, fontSize: 12, fontWeight: '700' },
  row: { height: 60, borderRadius: 12, backgroundColor: c.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 6, gap: 12 },
  av: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avTxt: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  name: { color: c.text, fontSize: 14, fontWeight: '700' },
  meta: { color: c.mute, fontSize: 11, marginTop: 3 },
  st: { fontSize: 13, fontWeight: '700' },
  outline: { height: 44, borderRadius: 14, backgroundColor: c.card, borderWidth: 1.5, borderColor: c.line, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  outlineTxt: { color: c.text, fontSize: 14, fontWeight: '700' },
});
