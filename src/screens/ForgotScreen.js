import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Screen from '../components/Screen';
import Field from '../components/Field';
import Button from '../components/Button';
import { auth, emailOk } from '../store';
import { c } from '../theme';

// 02b — Lupa kata sandi
// initialEmail + onBack dipakai saat dibuka dari Profil (Keamanan & Kata Sandi): email terisi, tombol kembali ke Profil.
export default function ForgotScreen({ go, onCodeSent, initialEmail = '', onBack }) {
  const [email, setEmail] = useState(initialEmail);
  const [err, setErr] = useState(null);

  const submit = () => {
    if (!email.trim()) return setErr('Email wajib diisi.');
    if (!emailOk(email)) return setErr('Format email belum benar.');
    if (!auth.emailExists(email)) return setErr('Email ini belum terdaftar.');
    onCodeSent(email.trim().toLowerCase());
    setEmail(initialEmail);
  };

  return (
    <Screen top={52}>
      <Text style={s.h1}>Lupa kata sandi</Text>
      <Text style={s.sub}>Masukkan email terdaftar untuk menerima kode reset.</Text>
      <Field label="Email terdaftar" placeholder="nama@email.com" value={email} error={err} style={{ marginTop: 36 }}
        onChangeText={(t) => { setEmail(t); setErr(null); }}
        keyboardType="email-address" autoCapitalize="none" autoCorrect={false} onSubmitEditing={submit} />
      <Button title="Kirim Kode Reset" onPress={submit} />
      <Pressable onPress={() => (onBack ? onBack() : go('login'))} style={{ marginTop: 28, alignSelf: 'center', padding: 6 }}>
        <Text style={s.back}>{onBack ? '‹ Kembali' : '‹ Kembali ke Login'}</Text>
      </Pressable>
    </Screen>
  );
}
const s = StyleSheet.create({
  h1: { color: c.text, fontSize: 26, fontWeight: '700' },
  sub: { color: c.mute, fontSize: 14, lineHeight: 21, marginTop: 10 },
  back: { color: c.green, fontSize: 14 },
});
