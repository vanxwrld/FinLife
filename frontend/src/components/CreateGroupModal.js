import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import BottomSheet from './BottomSheet';
import { validateGroupName } from '../store';
import { c } from '../theme';

// 04c — Modal Buat Grup
export default function CreateGroupModal({ visible, groups, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [err, setErr] = useState(null);
  const [focus, setFocus] = useState(false);
  useEffect(() => { if (visible) { setName(''); setErr(null); } }, [visible]);

  const submit = () => {
    const e = validateGroupName(name, groups);
    setErr(e);
    if (!e) onCreate(name);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={s.title}>Buat Grup Baru</Text>
      <Text style={s.label}>Nama Grup</Text>
      <TextInput
        value={name} autoFocus maxLength={40} placeholder="Kos Ceria Surabaya" placeholderTextColor={c.hint}
        selectionColor={c.green} returnKeyType="done" onSubmitEditing={submit}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        onChangeText={(t) => { setName(t); setErr(null); }}
        style={[s.input, focus && { borderColor: c.green }, !!err && { borderColor: c.red }]}
      />
      {!!err && <Text style={s.err}>{err}</Text>}
      <View style={s.info}>
        <Text style={s.infoA}>Kamu otomatis menjadi admin grup.</Text>
        <Text style={s.infoB}>Kode undangan dibuat otomatis oleh sistem.</Text>
      </View>
      <Pressable style={s.btn} onPress={submit}><Text style={s.btnTxt}>Simpan & Buat Grup</Text></Pressable>
      <Pressable style={s.cancel} onPress={onClose} hitSlop={8}><Text style={s.cancelTxt}>Batal</Text></Pressable>
    </BottomSheet>
  );
}
const s = StyleSheet.create({
  title: { color: c.text, fontSize: 19, fontWeight: '700', textAlign: 'center', marginTop: 4, marginBottom: 14 },
  label: { color: c.mute, fontSize: 12, marginBottom: 8 },
  input: { height: 42, borderRadius: 10, backgroundColor: c.bg, borderWidth: 1, borderColor: 'transparent', paddingHorizontal: 15, color: c.text, fontSize: 14 },
  err: { color: c.red, fontSize: 12, marginTop: 6 },
  info: { backgroundColor: 'rgba(0,230,118,0.1)', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, marginTop: 22 },
  infoA: { color: c.green, fontSize: 12, fontWeight: '700' },
  infoB: { color: c.mute, fontSize: 11, marginTop: 4 },
  btn: { height: 52, borderRadius: 16, backgroundColor: c.green, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  btnTxt: { color: '#000', fontSize: 15, fontWeight: '700' },
  cancel: { alignItems: 'center', paddingVertical: 18 },
  cancelTxt: { color: c.mute, fontSize: 15, fontWeight: '700' },
});
