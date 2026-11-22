import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Logo from '../../components/Logo';
import { c } from '../../theme';

// 00 — Splash: otomatis lanjut ke Sambutan, atau tap layar
export default function SplashScreen({ go }) {
  useEffect(() => {
    const t = setTimeout(() => go('welcome'), 2200);
    return () => clearTimeout(t);
  }, []);
  return (
    <Pressable style={s.root} onPress={() => go('welcome')}>
      <Logo width={100} />
      <Text style={s.title}>FinLife</Text>
      <Text style={s.tag}>Atur Keuangan, Raih Masa Depan</Text>
      <View style={s.dots}>
        <View style={[s.dot, { backgroundColor: c.green }]} /><View style={s.dot} /><View style={s.dot} />
      </View>
    </Pressable>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' },
  title: { color: c.text, fontSize: 36, fontWeight: '700', marginTop: 28 },
  tag: { color: c.mute, fontSize: 14, marginTop: 10 },
  dots: { position: 'absolute', bottom: 80, flexDirection: 'row', gap: 9 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.line },
});
