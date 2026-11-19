import React from 'react';
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import BottomNav, { NAV_HEIGHT } from '../components/BottomNav';
import { personInitials } from '../store';
import { c, PAD, rupiah } from '../theme';

// 06c — Ringkasan setoran per anggota
export default function SetoranSummaryScreen({ group, onNavigate, onAdd }) {
  const inset = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;
  if (!group) return null;
  const total = group.people.reduce((a, p) => a + p.setor, 0);

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: inset + 28, paddingHorizontal: PAD, paddingBottom: NAV_HEIGHT + 24 }}>
        <Text style={s.h1}>Ringkasan Setoran</Text>
        <Text style={s.sub}>Total kontribusi per anggota · {group.name}</Text>

        <View style={s.card}>
          <Text style={s.cardLbl}>Total Setoran Terkumpul</Text>
          <Text style={s.cardAmt}>{rupiah(total)}</Text>
        </View>

        {group.people.map((p) => (
          <View key={p.username} style={s.row}>
            <View style={[s.av, { backgroundColor: p.color }]}><Text style={s.avTxt}>{personInitials(p.name)}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.name} numberOfLines={1}>{p.name}</Text>
              <Text style={s.meta}>{p.n || 0} transaksi setoran</Text>
            </View>
            <Text style={s.amt}>{rupiah(p.setor)}</Text>
          </View>
        ))}

        <Pressable onPress={onAdd} accessibilityRole="button"
          style={({ pressed }) => [s.btn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}>
          <Text style={s.btnTxt}>+ Catat setoran</Text>
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
  card: { marginTop: 22, borderRadius: 16, backgroundColor: c.card, paddingHorizontal: 20, paddingVertical: 16, marginBottom: 20 },
  cardLbl: { color: c.mute, fontSize: 12 },
  cardAmt: { color: c.green, fontSize: 24, fontWeight: '700', marginTop: 8 },
  row: { height: 60, borderRadius: 12, backgroundColor: c.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 8, gap: 12 },
  av: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avTxt: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  name: { color: c.text, fontSize: 14, fontWeight: '700' },
  meta: { color: c.mute, fontSize: 11, marginTop: 3 },
  amt: { color: c.green, fontSize: 13, fontWeight: '700' },
  btn: { height: 52, borderRadius: 16, backgroundColor: c.green, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  btnTxt: { color: '#000', fontSize: 15, fontWeight: '700' },
});
