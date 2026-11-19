import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Screen from '../components/Screen';
import Field from '../components/Field';
import Button from '../components/Button';
import { auth, emailOk } from '../store';
import { c } from '../theme';

// 03 — Daftar (username/email terpakai → alert 03b)
export default function RegisterScreen({ go, onLogin, showAlert }) {
  const [f, setF] = useState({ name: '', username: '', email: '', pass: '' });
  const [err, setErr] = useState({});
  const set = (k) => (t) => { setF((x) => ({ ...x, [k]: t })); setErr((x) => ({ ...x, [k]: null })); };

  const submit = () => {
    const uname = f.username.trim().replace(/^@/, '');
    const e = {};
    if (f.name.trim().length < 3) e.name = 'Nama lengkap minimal 3 karakter.';
    if (!/^[a-z0-9_.]{3,20}$/i.test(uname)) e.username = 'Username 3–20 karakter: huruf, angka, titik, garis bawah.';
    if (!emailOk(f.email)) e.email = 'Format email belum benar.';
    if (f.pass.length < 8) e.pass = 'Kata sandi minimal 8 karakter.';
    setErr(e);
    if (Object.keys(e).length) return;
    if (auth.usernameOrEmailTaken(uname, f.email))
      return showAlert('Pendaftaran gagal', ['Username atau email sudah terdaftar.', 'Gunakan data lain.']);
    const user = auth.register({ ...f, username: uname });
    setF({ name: '', username: '', email: '', pass: '' });
    onLogin(user, true); // desain: setelah daftar langsung masuk ke Daftar grup kosong (04b)
  };

  return (
    <Screen top={30}>
      <Text style={s.h1}>Buat akun</Text>
      <Text style={s.sub}>Mulai catat keuangan bareng temanmu.</Text>
      <Field label="Nama lengkap" placeholder="Alifatuz Zubaidah" value={f.name} error={err.name} onChangeText={set('name')} autoCapitalize="words" />
      <Field label="Username" placeholder="@alifatuz" value={f.username} error={err.username} onChangeText={set('username')} autoCapitalize="none" autoCorrect={false} />
      <Field label="Email" placeholder="nama@email.com" value={f.email} error={err.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
      <Field label="Kata sandi" placeholder="Minimal 8 karakter" secure value={f.pass} error={err.pass} onChangeText={set('pass')} onSubmitEditing={submit} />
      <Button title="Daftar" onPress={submit} style={{ marginTop: 28 }} />
      <Text style={s.foot}>Sudah punya akun? <Text style={s.link} onPress={() => go('login')}>Masuk</Text></Text>
    </Screen>
  );
}
const s = StyleSheet.create({
  h1: { color: c.text, fontSize: 28, fontWeight: '700' },
  sub: { color: c.mute, fontSize: 14, marginTop: 8 },
  foot: { color: c.mute, fontSize: 14, textAlign: 'center', marginTop: 24 },
  link: { color: c.green, fontWeight: '700' },
});
