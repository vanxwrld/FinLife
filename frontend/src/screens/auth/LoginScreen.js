import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Screen from '../../components/Screen';
import Field from '../../components/Field';
import Button from '../../components/Button';
import Logo from '../../components/Logo';
import { auth, emailOk } from '../../store';
import { login as loginApi } from '../../api/auth.api';
import { saveToken } from '../../utils/tokenStorage';
import { c } from '../../theme';

// 02 — Login (gagal → alert 02d)
export default function LoginScreen({ go, onLogin, showAlert }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const e = {};
    if (!email.trim()) e.email = 'Email wajib diisi.';
    else if (!emailOk(email)) e.email = 'Format email belum benar.';
    if (!pass) e.pass = 'Kata sandi wajib diisi.';
    setErr(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      // 1. Coba login ke API backend MySQL + Express
      const res = await loginApi(email.trim(), pass);
      if (res?.token) {
        await saveToken(res.token);
      }
      const userData = {
        id: res.id,
        name: res.nama || res.name,
        nama: res.nama || res.name,
        username: res.username,
        email: res.email,
        token: res.token,
      };
      setEmail('');
      setPass('');
      onLogin(userData);
    } catch (apiErr) {
      // 2. Fallback offline: cek akun lokal jika ada
      const localUser = auth.login(email, pass);
      if (localUser) {
        setEmail('');
        setPass('');
        onLogin(localUser);
      } else {
        const msg = apiErr.message || 'Email atau kata sandi salah.';
        showAlert('Login gagal', [msg, 'Silakan coba lagi.'], () => setPass(''));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen top={36}>
      <View style={s.brand}>
        <Logo width={50} />
        <Text style={s.title}>FinLife</Text>
        <Text style={s.sub}>Urunan bareng, lebih jelas.</Text>
      </View>
      <Field
        label="Email"
        placeholder="nama@email.com"
        value={email}
        error={err.email}
        onChangeText={(t) => {
          setEmail(t);
          setErr((x) => ({ ...x, email: null }));
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="next"
      />
      <Field
        label="Kata sandi"
        placeholder="••••••••"
        secure
        value={pass}
        error={err.pass}
        onChangeText={(t) => {
          setPass(t);
          setErr((x) => ({ ...x, pass: null }));
        }}
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      <Pressable style={s.forgot} onPress={() => go('forgot')}>
        <Text style={s.forgotTxt}>Lupa kata sandi?</Text>
      </Pressable>
      <Button
        title={loading ? 'Memeriksa...' : 'Masuk'}
        onPress={submit}
        disabled={loading}
        style={{ marginTop: 24 }}
      />
      {loading && <ActivityIndicator color={c.green} style={{ marginTop: 12 }} />}
      <Text style={s.foot}>
        Belum punya akun? <Text style={s.link} onPress={() => go('register')}>Daftar</Text>
      </Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  brand: { alignItems: 'center', marginBottom: 14 },
  title: { color: c.text, fontSize: 28, fontWeight: '700', marginTop: 14 },
  sub: { color: c.mute, fontSize: 14, marginTop: 6 },
  forgot: { alignSelf: 'flex-end', marginTop: 12, paddingVertical: 4 },
  forgotTxt: { color: c.green, fontSize: 13 },
  foot: { color: c.mute, fontSize: 14, textAlign: 'center', marginTop: 24 },
  link: { color: c.green, fontWeight: '700' },
});
