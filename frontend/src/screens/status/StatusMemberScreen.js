import React from 'react';
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import BottomNav, { NAV_HEIGHT } from '../../components/BottomNav';
import { expensesOf, firstName, memberStatus, splitLabel } from '../../store';
import { c, PAD, rupiah } from '../../theme';

// 08c — Detail kewajiban satu anggota: total kewajiban + rincian tiap transaksi pengeluaran.
export default function StatusMemberScreen({ group, username, onNavigate, onRemind }) {
  const inset = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;
  const person = (group?.people || []).find((p) => p.username === username);
  if (!group || !person) return null;
  const st = memberStatus(person);
  const name = firstName(person.name);
  const items = expensesOf(group, username);

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: inset + 28, paddingHorizontal: PAD, paddingBottom: NAV_HEIGHT + 24 }}>
        <Text style={s.h1} numberOfLines={1}>Detail Kewajiban {name}</Text>
        <Text style={s.sub}>Rincian pembagian biaya yang dibebankan</Text>

        <View style={[s.card, { borderColor: st.col }]}>
          <Text style={s.lbl}>Total Kewajiban {name}</Text>
          <Text style={[s.amt, { color: st.col }]}>{rupiah(person.wajib)}</Text>
          <Text style={[s.line, { color: st.col }]}>
            Setoran {rupiah(person.setor)}{st.kind === 'pas' ? ' → Pas' : ` → ${st.long}`}
          </Text>
        </View>

        <Text style={s.h2}>Rincian dari transaksi pengeluaran:</Text>
        {items.length === 0 && <Text style={s.empty}>Belum ada pengeluaran yang dibebankan ke {name}.</Text>}
        {items.map((e) => (
          <View key={e.id} style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.name} numberOfLines={1}>{e.title}</Text>
              <Text style={s.meta}>{e.date} · {splitLabel(e)}</Text>
            </View>
            <Text style={s.share}>{rupiah(e.share)}</Text>
          </View>
        ))}

        {st.kind === 'kurang' && (
          <Pressable onPress={() => onRemind([person])} accessibilityRole="button"
            style={({ pressed }) => [s.btn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}>
            <Text style={s.btnTxt}>Kirim pengingat</Text>
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
  card: { marginTop: 20, borderRadius: 16, backgroundColor: c.card, borderWidth: 1.5, paddingHorizontal: 20, paddingVertical: 16 },
  lbl: { color: c.mute, fontSize: 12 },
  amt: { fontSize: 26, fontWeight: '700', marginTop: 8 },
  line: { fontSize: 12, fontWeight: '700', marginTop: 8 },
  h2: { color: c.text, fontSize: 15, fontWeight: '700', marginTop: 22, marginBottom: 12 },
  empty: { color: c.mute, fontSize: 13, lineHeight: 19 },
  row: { height: 56, borderRadius: 12, backgroundColor: c.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 8, gap: 12 },
  name: { color: c.text, fontSize: 14, fontWeight: '700' },
  meta: { color: c.mute, fontSize: 11, marginTop: 4 },
  share: { color: c.text, fontSize: 13, fontWeight: '700' },
  btn: { height: 52, borderRadius: 16, backgroundColor: c.green, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  btnTxt: { color: '#000', fontSize: 15, fontWeight: '700' },
});
