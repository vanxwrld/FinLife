import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Screen from '../components/Screen';
import Field from '../components/Field';
import Button from '../components/Button';
import { auth, DEMO_OTP } from '../store';
import { c } from '../theme';

// 02c — Reset kata sandi (OTP 4 digit)
export default function ResetScreen({ email, onDone }) {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [np, setNp] = useState('');
  const [cp, setCp] = useState('');
  const [err, setErr] = useState({});
  const refs = [useRef(), useRef(), useRef(), useRef()];

  const onOtp = (i, text) => {
    const d = text.replace(/\D/g, '');
    const next = [...otp];
    if (d.length > 1) { // paste beberapa digit
      d.slice(0, 4).split('').forEach((ch, k) => (next[k] = ch));
      setOtp(next);
      refs[Math.min(d.length, 4) - 1].current?.focus();
    } else {
      next[i] = d;
      setOtp(next);
      if (d && i < 3) refs[i + 1].current?.focus();
    }
    setErr((x) => ({ ...x, otp: null }));
  };
  const onKey = (i, e) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[i] && i > 0) {
      const next = [...otp]; next[i - 1] = ''; setOtp(next); refs[i - 1].current?.focus();
    }
  };

  const submit = () => {
    const code = otp.join('');
    const e = {};
    if (code.length < 4) e.otp = 'Masukkan 4 digit kode.';
    else if (code !== DEMO_OTP) e.otp = 'Kode salah. Periksa kembali.';
    if (np.length < 8) e.np = 'Kata sandi minimal 8 karakter.';
    if (cp !== np) e.cp = 'Konfirmasi tidak sama dengan kata sandi baru.';
    setErr(e);
    if (Object.keys(e).length) return;
    auth.resetPassword(email, np);
    onDone();
  };

  return (
    <Screen top={52}>
      <Text style={s.h1}>Buat kata sandi baru</Text>
      <Text style={s.sub}>Kode verifikasi telah dikirim ke {email}</Text>

      <Text style={s.label}>Kode Verifikasi (OTP)</Text>
      <View style={s.row}>
        {otp.map((v, i) => (
          <TextInput key={i} ref={refs[i]} value={v} keyboardType="number-pad" maxLength={i === 0 ? 4 : 1}
            selectionColor={c.green} onChangeText={(t) => onOtp(i, t)} onKeyPress={(e) => onKey(i, e)}
            style={[s.box, v && s.boxOn, !!err.otp && s.boxErr]} accessibilityLabel={`Digit ${i + 1}`} />
        ))}
      </View>
      {!!err.otp && <Text style={s.msg}>{err.otp}</Text>}
      <Text style={s.demo}>Mode demo: kode OTP adalah <Text style={{ color: c.green, fontWeight: '700' }}>{DEMO_OTP}</Text></Text>

      <Field label="Kata sandi baru" placeholder="Minimal 8 karakter" secure value={np} error={err.np}
        onChangeText={(t) => { setNp(t); setErr((x) => ({ ...x, np: null })); }} style={{ marginTop: 24 }} />
      <Field label="Konfirmasi kata sandi" placeholder="Ulangi kata sandi baru" secure value={cp} error={err.cp}
        onChangeText={(t) => { setCp(t); setErr((x) => ({ ...x, cp: null })); }} onSubmitEditing={submit} />
      <Button title="Simpan Kata Sandi" onPress={submit} />
    </Screen>
  );
}
const s = StyleSheet.create({
  h1: { color: c.text, fontSize: 24, fontWeight: '700' },
  sub: { color: c.mute, fontSize: 13, lineHeight: 20, marginTop: 8 },
  label: { color: c.text, fontSize: 14, fontWeight: '600', marginTop: 28, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 12 },
  box: { flex: 1, height: 48, borderRadius: 10, backgroundColor: c.card, borderWidth: 2, borderColor: c.line, color: c.green, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  boxOn: { borderColor: c.green },
  boxErr: { borderColor: c.red },
  msg: { color: c.red, fontSize: 12, marginTop: 6 },
  demo: { color: c.mute, fontSize: 12, marginTop: 10 },
});
