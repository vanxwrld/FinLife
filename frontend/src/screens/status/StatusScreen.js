import React from 'react';
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import BottomNav, { NAV_HEIGHT } from '../../components/BottomNav';
import { groupFinance, memberStatus, personInitials } from '../../store';
import { c, PAD, rupiah } from '../../theme';

// 08 — Status keuangan (Balance). Ketuk anggota → 08c, "Lihat yang belum lunas" → 08b.
export default function StatusScreen({ group, onNavigate, onMember, onUnpaid }) {
  const inset = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;
  if (!group) return null;
  const people = group.people || [];
  const f = groupFinance(group);
  const hasUnpaid = people.some((p) => (p.setor || 0) < (p.wajib || 0));
  const col = f.balance ? c.green : c.red;

  const rows = [
    ['Total setoran', f.setoran, c.text],
    ['Total pengeluaran', f.pengeluaran, c.text],
    ['Total kewajiban anggota', f.kewajiban, c.text],
    ['Saldo kas (setoran − pengeluaran)', f.kas, c.green],
  ];

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: inset + 28, paddingHorizontal: PAD, paddingBottom: NAV_HEIGHT + 24 }}>
        <Text style={s.h1}>Status keuangan</Text>
        <Text style={s.sub}>Kewajiban dan selisih tiap anggota · {group.name}</Text>

        <View style={[s.status, { borderColor: col }]}>
          <Text style={s.lbl}>Status grup</Text>
          <Text style={[s.big, { color: col }]}>{f.balance ? 'Balance' : 'Tidak balance'}</Text>
          <Text style={s.lbl}>{f.balance ? 'Kewajiban anggota = total pengeluaran' : 'Kewajiban anggota ≠ total pengeluaran'}</Text>
        </View>

        <View style={s.sum}>
          {rows.map(([k, v, vc]) => (
            <View key={k} style={s.sumRow}>
              <Text style={s.sumK} numberOfLines={1}>{k}</Text>
              <Text style={[s.sumV, { color: vc }]}>{rupiah(v)}</Text>
            </View>
          ))}
        </View>

        <Text style={s.h2}>Status anggota</Text>
        {people.map((p) => {
          const st = memberStatus(p);
          return (
            <Pressable key={p.username} onPress={() => onMember(p)} accessibilityRole="button"
              accessibilityLabel={`Detail kewajiban ${p.name}, ${st.short}`}
              style={({ pressed }) => [s.row, pressed && { opacity: 0.8 }]}>
              <View style={[s.av, { backgroundColor: p.color }]}><Text style={s.avTxt}>{personInitials(p.name)}</Text></View>
              <Text style={s.name} numberOfLines={1}>{p.name}</Text>
              <Text style={[s.st, { color: st.col }]}>{st.short}</Text>
            </Pressable>
          );
        })}

        {hasUnpaid && (
          <Pressable onPress={onUnpaid} accessibilityRole="button"
            style={({ pressed }) => [s.outline, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}>
            <Text style={s.outlineTxt}>Lihat yang belum lunas  ›</Text>
          </Pressable>
        )}
      </ScrollView>
      <BottomNav active="groups" onNavigate={onNavigate} />
    </View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  h1: { color: c.text, fontSize: 24, fontWeight: '700' },
  sub: { color: c.mute, fontSize: 12, marginTop: 6 },
  status: { marginTop: 16, borderRadius: 16, backgroundColor: c.card, borderWidth: 1.5, paddingHorizontal: 20, paddingVertical: 16 },
  lbl: { color: c.mute, fontSize: 12 },
  big: { fontSize: 30, fontWeight: '700', marginVertical: 8 },
  sum: { marginTop: 14, borderRadius: 12, backgroundColor: c.card, paddingHorizontal: 15, paddingVertical: 14, gap: 14 },
  sumRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sumK: { color: c.mute, fontSize: 13, flex: 1 },
  sumV: { fontSize: 14, fontWeight: '700' },
  h2: { color: c.text, fontSize: 16, fontWeight: '700', marginTop: 28, marginBottom: 12 },
  row: { height: 50, borderRadius: 12, backgroundColor: c.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 6, gap: 12 },
  av: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avTxt: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  name: { flex: 1, color: c.text, fontSize: 14, fontWeight: '700' },
  st: { fontSize: 13, fontWeight: '700' },
  outline: { height: 44, borderRadius: 14, backgroundColor: c.card, borderWidth: 1.5, borderColor: c.line, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  outlineTxt: { color: c.text, fontSize: 14, fontWeight: '700' },
});
