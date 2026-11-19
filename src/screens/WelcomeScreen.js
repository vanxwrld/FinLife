import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import Button from '../components/Button';
import Logo from '../components/Logo';
import { c } from '../theme';

// 00b — Sambutan
export default function WelcomeScreen({ go }) {
  return (
    <Screen top={56} contentStyle={{ justifyContent: 'space-between' }}>
      <View style={{ alignItems: 'center' }}><Logo width={100} /></View>
      <View>
        <Text style={s.h1}>Urunan bareng,{'\n'}tanpa ribet.</Text>
        <Text style={s.sub}>Catat setoran dan pengeluaran grup, lalu lihat siapa yang masih kurang.</Text>
      </View>
      <View>
        <Button title="Mulai sekarang" onPress={() => go('register')} style={{ marginTop: 0 }} />
        <Text style={s.foot}>
          Sudah punya akun? <Text style={s.link} onPress={() => go('login')}>Masuk</Text>
        </Text>
      </View>
    </Screen>
  );
}
const s = StyleSheet.create({
  h1: { color: c.text, fontSize: 30, fontWeight: '700', lineHeight: 38 },
  sub: { color: c.mute, fontSize: 14, lineHeight: 22, marginTop: 14 },
  foot: { color: c.mute, fontSize: 14, textAlign: 'center', marginTop: 24 },
  link: { color: c.green, fontWeight: '700' },
});
