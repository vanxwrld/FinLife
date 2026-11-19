import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import BottomNav, { NAV_HEIGHT } from '../components/BottomNav';
import { c, PAD, rupiah } from '../theme';

// 04 — Daftar grup · 04b — Daftar grup kosong
export default function GroupListScreen({ groups, onNavigate, onCreate, onOpenGroup, onJoin }) {
  const [q, setQ] = useState('');
  const inset = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;
  const empty = groups.length === 0;
  const list = groups.filter((g) => g.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <View style={s.root}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingTop: inset + 28, paddingHorizontal: PAD, paddingBottom: NAV_HEIGHT + (empty ? 24 : 100) }}>
        <Text style={[s.h1, empty && { fontSize: 26 }]}>Grup saya</Text>
        <Text style={s.sub}>Pilih grup yang ingin kamu kelola.</Text>

        {empty ? (
          <View style={s.emptyBox}>
            <View style={s.emptyCircle}><Text style={{ fontSize: 40 }}>📁</Text></View>
            <Text style={s.emptyTitle}>Belum Ada Grup Keuangan</Text>
            <Text style={s.emptyTxt}>Buat grup pertama kamu untuk mencatat urunan dan pengeluaran bersama teman.</Text>
            <Pressable style={[s.btn, { alignSelf: 'stretch', marginHorizontal: 25, marginTop: 40 }]} onPress={onCreate}>
              <Text style={s.btnTxt}>+ Buat Grup Pertama</Text>
            </Pressable>
            <Pressable style={s.joinBtn} onPress={onJoin} accessibilityRole="button"><Text style={s.joinTxt}>Sudah punya kode? Gabung dengan kode</Text></Pressable>
          </View>
        ) : (
          <>
            <Pressable style={s.joinLink} onPress={onJoin} hitSlop={8} accessibilityRole="button"><Text style={s.joinLinkTxt}>Gabung dengan kode ›</Text></Pressable>
            <TextInput value={q} onChangeText={setQ} placeholder="Cari grup..." placeholderTextColor={c.hint}
              selectionColor={c.green} style={s.search} />
            {list.length === 0 && <Text style={s.none}>Tidak ada grup bernama “{q}”.</Text>}
            {list.map((g) => (
              <Pressable key={g.id} style={s.card} onPress={() => onOpenGroup(g)}>
                <View style={[s.av, { backgroundColor: g.color + '33' }]}><Text style={[s.avTxt, { color: g.color }]}>{g.initials}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{g.name}</Text>
                  <Text style={s.meta}>{g.members} anggota · {g.code}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.amount}>{rupiah(g.balance)}</Text>
                  <Text style={[s.status, { color: g.unpaid ? c.amber : c.green }]}>
                    {g.unpaid ? `${g.unpaid} belum lunas` : 'Semua lunas'}
                  </Text>
                </View>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>

      {!empty && (
        <Pressable style={[s.btn, s.fab]} onPress={onCreate}><Text style={s.btnTxt}>+ Buat grup baru</Text></Pressable>
      )}
      <BottomNav active="groups" onNavigate={onNavigate} />
    </View>
  );
}
const s = StyleSheet.create({
  joinBtn: { alignSelf: 'stretch', marginHorizontal: 25, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  joinTxt: { color: c.green, fontSize: 14, fontWeight: '700' },
  joinLink: { alignSelf: 'flex-end', marginTop: 14 },
  joinLinkTxt: { color: c.green, fontSize: 13, fontWeight: '700' },
  root: { flex: 1, backgroundColor: c.bg },
  h1: { color: c.text, fontSize: 24, fontWeight: '700' },
  sub: { color: c.mute, fontSize: 12, marginTop: 6 },
  search: { height: 42, borderRadius: 10, backgroundColor: c.card, paddingHorizontal: 17, color: c.text, fontSize: 13, marginTop: 8, marginBottom: 18 },
  none: { color: c.mute, fontSize: 13, textAlign: 'center', marginTop: 24 },
  card: { height: 76, borderRadius: 16, backgroundColor: c.card, borderWidth: 1.5, borderColor: c.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, marginBottom: 14, gap: 13 },
  av: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avTxt: { fontSize: 14, fontWeight: '700' },
  name: { color: c.text, fontSize: 16, fontWeight: '700' },
  meta: { color: c.mute, fontSize: 12, marginTop: 5 },
  amount: { color: c.text, fontSize: 15, fontWeight: '700' },
  status: { fontSize: 12, fontWeight: '700', marginTop: 5 },
  btn: { height: 52, borderRadius: 16, backgroundColor: c.green, alignItems: 'center', justifyContent: 'center' },
  btnTxt: { color: '#000', fontSize: 15, fontWeight: '700' },
  fab: { position: 'absolute', left: PAD, right: PAD, bottom: NAV_HEIGHT + 16 },
  emptyBox: { flex: 1, alignItems: 'center', paddingTop: 80 },
  emptyCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: c.text, fontSize: 18, fontWeight: '700', marginTop: 40 },
  emptyTxt: { color: c.mute, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 12, paddingHorizontal: 10 },
});
