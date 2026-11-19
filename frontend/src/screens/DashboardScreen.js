import React from 'react';
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import BottomNav, { NAV_HEIGHT } from '../components/BottomNav';
import { greeting } from '../store';
import { c, PAD, rupiah } from '../theme';

// 01 — Dashboard
const ACTIONS = [
  { k: 'setoran', label: 'Setoran', icon: '+', color: c.green },
  { k: 'keluar', label: 'Keluar', icon: '-', color: c.red },
  { k: 'riwayat', label: 'Riwayat', icon: 'R', color: c.blue },
  { k: 'undang', label: 'Undang', icon: '@', color: c.yellow },
];

export default function DashboardScreen({ user, groups, onNavigate, onSoon, onOpenGroup, onInvite, onSetoran, onKeluar, transactions = [] }) {
  const inset = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;
  const total = groups.reduce((a, g) => a + g.balance, 0);
  const unpaid = groups.reduce((a, g) => a + g.unpaid, 0);
  const first = user?.name?.split(' ')[0] || '';

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: inset + 28, paddingHorizontal: PAD, paddingBottom: NAV_HEIGHT + 24 }}>
        <Text style={s.hello}>{greeting()}</Text>
        <Text style={s.name}>{first}</Text>

        <View style={s.hero}>
          <Text style={s.mute13}>Total saldo semua grup</Text>
          <Text style={s.total}>{rupiah(total)}</Text>
          <View style={[s.pill, unpaid > 0 && { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
            <Text style={[s.pillTxt, unpaid > 0 && { color: c.amber }]}>
              {unpaid > 0 ? `${unpaid} belum lunas` : '✓ Balance'} · {groups.length} grup
            </Text>
          </View>
        </View>

        <View style={s.actions}>
          {ACTIONS.map((a) => (
            <Pressable key={a.k} style={s.action} onPress={() => (a.k === 'undang' ? onInvite() : a.k === 'setoran' ? onSetoran() : a.k === 'keluar' ? onKeluar() : onSoon(a.label))} accessibilityRole="button">
              <View style={s.circle}><Text style={[s.icon, { color: a.color }]}>{a.icon}</Text></View>
              <Text style={s.actionLbl}>{a.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={s.head}>
          <Text style={s.h2}>Grup saya</Text>
          <Pressable hitSlop={8} onPress={() => onNavigate('groups')}><Text style={s.link}>Lihat semua</Text></Pressable>
        </View>
        {groups.length === 0 && <Text style={s.empty}>Belum ada grup. Buat grup pertamamu di tab Grup.</Text>}
        {groups.map((g) => (
          <Pressable key={g.id} style={s.row} onPress={() => onOpenGroup(g)}>
            <View style={[s.av, { backgroundColor: g.color + '33' }]}><Text style={[s.avTxt, { color: g.color }]}>{g.initials}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>{g.name}</Text>
              <Text style={{ color: g.unpaid ? c.amber : c.green, fontSize: 11, marginTop: 2 }}>
                {g.unpaid ? `${g.unpaid} belum lunas` : 'Semua lunas'}
              </Text>
            </View>
            <Text style={s.rowTitle}>{rupiah(g.balance)}</Text>
          </Pressable>
        ))}

        {groups.length > 0 && transactions.length > 0 && (
          <>
            <View style={[s.head, { marginTop: 22 }]}>
              <Text style={s.h2}>Transaksi terbaru</Text>
              <Pressable hitSlop={8} onPress={() => onSoon('Riwayat')}><Text style={s.link}>Lihat semua</Text></Pressable>
            </View>
            {transactions.map((t) => {
              const inn = t.type === 'in';
              const col = inn ? c.green : c.red;
              return (
                <Pressable key={t.id} style={s.tx} onPress={() => onSoon('Detail transaksi')}>
                  <View style={[s.txIcon, { backgroundColor: col + '33' }]}>
                    <Text style={{ color: col, fontSize: 16 }}>{inn ? '↓' : '↑'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.txTitle}>{t.title}</Text>
                    <Text style={s.txSub}>{t.sub}</Text>
                  </View>
                  <Text style={[s.txTitle, { color: col }]}>{inn ? '+' : '-'}{rupiah(t.amount)}</Text>
                </Pressable>
              );
            })}
          </>
        )}
      </ScrollView>
      <BottomNav active="home" onNavigate={onNavigate} />
    </View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  hello: { color: c.mute, fontSize: 13 },
  name: { color: c.text, fontSize: 22, fontWeight: '700', marginTop: 4 },
  hero: { alignItems: 'center', marginTop: 28 },
  mute13: { color: c.mute, fontSize: 13 },
  total: { color: c.text, fontSize: 34, fontWeight: '700', marginTop: 10 },
  pill: { marginTop: 14, height: 28, paddingHorizontal: 16, borderRadius: 14, backgroundColor: 'rgba(0,230,118,0.15)', justifyContent: 'center' },
  pillTxt: { color: c.green, fontSize: 13, fontWeight: '700' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 32, paddingHorizontal: 9 },
  action: { alignItems: 'center', width: 64 },
  circle: { width: 52, height: 52, borderRadius: 26, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 22 },
  actionLbl: { color: c.mute, fontSize: 12, marginTop: 10 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, marginBottom: 12 },
  h2: { color: c.text, fontSize: 16, fontWeight: '700' },
  link: { color: c.green, fontSize: 13, fontWeight: '700' },
  empty: { color: c.mute, fontSize: 13, backgroundColor: c.card, borderRadius: 12, padding: 14 },
  row: { height: 44, borderRadius: 12, backgroundColor: c.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, marginBottom: 8, gap: 10 },
  av: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avTxt: { fontSize: 10, fontWeight: '700' },
  rowTitle: { color: c.text, fontSize: 13, fontWeight: '700' },
  tx: { height: 62, borderRadius: 12, backgroundColor: c.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 8, gap: 12 },
  txIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  txTitle: { color: c.text, fontSize: 14, fontWeight: '700' },
  txSub: { color: c.mute, fontSize: 11, marginTop: 3 },
});
