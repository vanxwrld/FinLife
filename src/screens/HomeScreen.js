import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Logo from '../components/Logo';
import { c } from '../theme';

// Placeholder — Dashboard belum dibuat (tahap Autentikasi saja)
export default function HomeScreen({ user, onLogout }) {
  return (
    <View style={s.root}>
      <Logo width={70} />
      <Text style={s.h1}>Halo, {user?.name?.split(' ')[0]}!</Text>
      <Text style={s.sub}>Dashboard belum dibuat — ini tahap Autentikasi saja.</Text>
      <View style={s.badge}><Text style={s.badgeTxt}>✓ Berhasil masuk</Text></View>
      <Pressable onPress={onLogout} style={{ marginTop: 28, padding: 8 }}><Text style={{ color: c.green }}>Keluar</Text></Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', padding: 25 },
  h1: { color: c.text, fontSize: 28, fontWeight: '700', marginTop: 20 },
  sub: { color: c.mute, fontSize: 14, marginTop: 8, textAlign: 'center' },
  badge: { backgroundColor: 'rgba(0,230,118,0.15)', borderRadius: 14, paddingVertical: 6, paddingHorizontal: 14, marginTop: 16 },
  badgeTxt: { color: c.green, fontWeight: '700', fontSize: 13 },
});
