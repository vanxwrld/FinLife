import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';
import BottomSheet from './BottomSheet';
import { c } from '../theme';

// US-02 kriteria 2 — gabung ke grup lewat kode undangan
export default function JoinGroupModal({ visible, onClose, onJoin }) {
  const [code, setCode] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (visible) { setCode(''); setErr(null); setBusy(false); } }, [visible]);

  const submit = async () => {
    const v = code.trim();
    if (!v) return setErr('Kode grup wajib diisi.');
    setBusy(true);
    const e = await onJoin(v);
    setBusy(false);
    if (e) setErr(e);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={s.title}>Gabung dengan Kode</Text>
      <Text style={s.sub}>Masukkan kode undangan grup dari adminmu.</Text>
      <Text style={s.label}>Kode Undangan</Text>
      <TextInput value={code} autoFocus autoCapitalize="characters" autoCorrect={false} maxLength={10}
        placeholder="KOS824" placeholderTextColor={c.hint} selectionColor={c.green} returnKeyType="done" onSubmitEditing={submit}
        onChangeText={(t) => { setCode(t.toUpperCase()); setErr(null); }}
        style={[s.input, !!err && { borderColor: c.red }]} />
      {!!err && <Text style={s.err}>{err}</Text>}
      <Pressable style={[s.btn, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}><Text style={s.btnTxt}>Gabung ke Grup</Text></Pressable>
      <Pressable style={s.cancel} onPress={onClose} hitSlop={8}><Text style={s.cancelTxt}>Batal</Text></Pressable>
    </BottomSheet>
  );
}
const s = StyleSheet.create({
  title: { color: c.text, fontSize: 19, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  sub: { color: c.mute, fontSize: 12, textAlign: 'center', marginTop: 8, marginBottom: 20 },
  label: { color: c.mute, fontSize: 12, marginBottom: 8 },
  input: { height: 46, borderRadius: 10, backgroundColor: c.bg, borderWidth: 1, borderColor: c.green, paddingHorizontal: 15, color: c.text, fontSize: 16, fontWeight: '700', letterSpacing: 2 },
  err: { color: c.red, fontSize: 12, marginTop: 6 },
  btn: { height: 52, borderRadius: 16, backgroundColor: c.green, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  btnTxt: { color: '#000', fontSize: 15, fontWeight: '700' },
  cancel: { alignItems: 'center', paddingVertical: 18 },
  cancelTxt: { color: c.mute, fontSize: 15, fontWeight: '700' },
});
