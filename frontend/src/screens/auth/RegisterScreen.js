import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import Screen from '../../components/Screen';
import Field from '../../components/Field';
import Button from '../../components/Button';
import { auth, emailOk } from '../../store';
import { register as registerApi } from '../../api/auth.api';
import { saveToken } from '../../utils/tokenStorage';
import { c } from '../../theme';

// 03 — Daftar (username/email terpakai → alert 03b)
export default function RegisterScreen({ go, onLogin, showAlert }) {
  const [f, setF] = useState({ name: '', username: '', email: '', pass: '' });
  const [err, setErr] = useState({});
  const [loading, setLoading] = useState(false);
  const set = (k) => (t) => { setF((x) => ({ ...x, [k]: t })); setErr((x) => ({ ...x, [k]: null })); };

  const submit = async () => {
    const uname = f.username.trim().replace(/^@/, '');
    const e = {};
    if (f.name.trim().length < 3) e.name = 'Nama lengkap minimal 3 karakter.';
    if (!/^[a-z0-9_.]{3,20}$/i.test(uname)) e.username = 'Username 3–20 karakter: huruf, angka, titik, garis bawah.';
    if (!emailOk(f.email)) e.email = 'Format email belum benar.';
    if (f.pass.length < 8) e.pass = 'Kata sandi minimal 8 karakter.';
    setErr(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      // 1. Daftar ke API backend Express + MySQL
      const res = await registerApi(f.name.trim(), uname, f.email.trim(), f.pass);
      if (res?.token) {
        await saveToken(res.token);
      }
      // Simpan juga ke auth lokal sebagai cache
      auth.register({ name: f.name.trim(), username: uname, email: f.email.trim(), pass: f.pass });

      const userData = {
        id: res.id,
        name: res.nama || f.name.trim(),
        nama: res.nama || f.name.trim(),
        username: res.username || uname,
        email: res.email || f.email.trim(),
        token: res.token,
      };

      setF({ name: '', username: '', email: '', pass: '' });
      onLogin(userData, true); // Masuk ke daftar grup kosong (04b)
    } catch (apiErr) {
      // Jika duplikasi atau error validasi dari server
      const msg = apiErr.message || 'Pendaftaran gagal.';
      showAlert('Pendaftaran gagal', [msg, 'Gunakan email/username lain atau periksa koneksi.']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen top={30}>
      <Text style={s.h1}>Buat akun</Text>
      <Text style={s.sub}>Mulai catat keuangan bareng temanmu.</Text>
      <Field label="Nama lengkap" placeholder="Alifatuz Zubaidah" value={f.name} error={err.name} onChangeText={set('name')} autoCapitalize="words" />
      <Field label="Username" placeholder="@alifatuz" value={f.username} error={err.username} onChangeText={set('username')} autoCapitalize="none" autoCorrect={false} />
      <Field label="Email" placeholder="nama@email.com" value={f.email} error={err.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
      <Field label="Kata sandi" placeholder="Minimal 8 karakter" secure value={f.pass} error={err.pass} onChangeText={set('pass')} onSubmitEditing={submit} />
      <Button title={loading ? 'Mendaftarkan...' : 'Daftar'} onPress={submit} disabled={loading} style={{ marginTop: 28 }} />
      {loading && <ActivityIndicator color={c.green} style={{ marginTop: 12 }} />}
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
