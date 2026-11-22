import React from 'react';
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import BottomNav, { NAV_HEIGHT } from '../../components/BottomNav';
import { firstName, memberStatus, sortByDiff } from '../../store';
import { c, PAD, rb } from '../../theme';

// 08b — Status belum lunas. Ketuk anggota → 08c, tombol hijau → kirim pengingat (10c).
export default function StatusLateScreen({ group, onNavigate, onMember, onRemind }) {
  const inset = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;
  if (!group) return null;
  const people = sortByDiff(group.people || []);
  const late = people.filter((p) => (p.setor || 0) < (p.wajib || 0));
  const done = late.length === 0;
  const col = done ? c.green : c.amber;

  const remindLabel = late.length === 1
    ? `Kirim pengingat ke ${firstName(late[0].name)}`
    : `Kirim pengingat ke ${late.length} anggota`;

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: inset + 28, paddingHorizontal: PAD, paddingBottom: NAV_HEIGHT + 24 }}>
        <Text style={s.h1}>Status keuangan</Text>
        <Text style={s.sub}>Kewajiban dan selisih tiap anggota · {group.name}</Text>

        <View style={[s.status, { borderColor: col }]}>
          <Text style={s.lbl}>Status grup</Text>
          <Text style={[s.big, { color: col }]}>{done ? 'Semua lunas' : 'Belum lunas'}</Text>
          <Text style={{ color: done ? c.mute : c.amber, fontSize: 12 }}>
            {done ? 'Tidak ada anggota yang kurang bayar' : `${late.length} anggota masih kurang bayar`}
          </Text>
        </View>

        <Text style={s.h2}>Rincian Kurang / Lebih Bayar</Text>
        {people.map((p) => {
          const st = memberStatus(p);
          return (
            <Pressable key={p.username} onPress={() => onMember(p)} accessibilityRole="button"
              accessibilityLabel={`Detail kewajiban ${p.name}, ${st.badge}`}
              style={({ pressed }) => [s.row, pressed && { opacity: 0.8 }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.name} numberOfLines={1}>{p.name}</Text>
                <Text style={s.meta}>Setoran {rb(p.setor)} · Wajib {rb(p.wajib)}</Text>
              </View>
              <View style={[s.badge, { backgroundColor: st.col + '33' }]}>
                <Text style={[s.badgeTxt, { color: st.col }]}>{st.badge}</Text>
              </View>
            </Pressable>
          );
        })}

        {!done && (
          <Pressable onPress={() => onRemind(late)} accessibilityRole="button"
            style={({ pressed }) => [s.btn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}>
            <Text style={s.btnTxt}>{remindLabel}</Text>
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
  big: { fontSize: 28, fontWeight: '700', marginVertical: 8 },
  h2: { color: c.text, fontSize: 16, fontWeight: '700', marginTop: 22, marginBottom: 12 },
  row: { height: 60, borderRadius: 12, backgroundColor: c.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 8, gap: 12 },
  name: { color: c.text, fontSize: 14, fontWeight: '700' },
  meta: { color: c.mute, fontSize: 11, marginTop: 4 },
  badge: { minWidth: 90, height: 26, borderRadius: 8, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
  btn: { height: 52, borderRadius: 16, backgroundColor: c.green, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  btnTxt: { color: '#000', fontSize: 15, fontWeight: '700' },
});
