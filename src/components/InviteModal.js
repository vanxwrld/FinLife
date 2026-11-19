import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import BottomSheet from './BottomSheet';
import { findUsers, personInitials } from '../store';
import { c } from '../theme';

// 04d — Modal Undang Anggota (cari username + kode undangan)
export default function InviteModal({ visible, groups, groupId, onClose, onInvited }) {
  const [gid, setGid] = useState(groupId);
  const [q, setQ] = useState('');
  const [sent, setSent] = useState({});
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (visible) { setGid(groupId || groups[0]?.id); setQ(''); setSent({}); setCopied(false); }
  }, [visible, groupId]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const group = groups.find((g) => g.id === gid) || groups[0];
  if (!group) return null;
  const results = findUsers(q);
  const isMember = (u) => group.people.some((p) => p.username === u.username);
  const key = (u) => group.id + u.username;

  const invite = (u) => {
    setSent((x) => ({ ...x, [key(u)]: true }));
    onInvited(u, group);
  };
  const copy = async () => {
    await Clipboard.setStringAsync(group.code);
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={s.title}>Undang Anggota Grup</Text>

      {groupId == null && groups.length > 1 && (
        <View style={s.chips}>
          {groups.map((g) => (
            <Pressable key={g.id} onPress={() => setGid(g.id)} style={[s.chip, g.id === group.id && s.chipOn]}>
              <Text style={[s.chipTxt, g.id === group.id && { color: '#000' }]}>{g.name}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Text style={s.label}>Cari Username Anggota</Text>
      <TextInput
        value={q} onChangeText={setQ} placeholder="@username" placeholderTextColor={c.hint}
        selectionColor={c.green} autoCapitalize="none" autoCorrect={false} style={s.input}
      />

      {results.map((u) => (
        <View key={u.username} style={s.result}>
          <View style={[s.av, { backgroundColor: u.color }]}><Text style={s.avTxt}>{personInitials(u.name)}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.rName}>{u.name}</Text>
            <Text style={s.rUser}>@{u.username}</Text>
          </View>
          {isMember(u) ? (
            <Text style={s.state}>Anggota</Text>
          ) : sent[key(u)] ? (
            <Text style={[s.state, { color: c.green }]}>✓ Terkirim</Text>
          ) : (
            <Pressable style={s.inviteBtn} onPress={() => invite(u)}><Text style={s.inviteTxt}>Undang</Text></Pressable>
          )}
        </View>
      ))}
      {q.trim().replace('@', '') !== '' && results.length === 0 && (
        <Text style={s.none}>Username tidak ditemukan.</Text>
      )}

      <View style={s.divider} />
      <Text style={s.or}>Atau bagikan Kode Undangan Grup:</Text>
      <View style={s.codeBox}><Text style={s.code}>{group.code.split('').join(' ')}</Text></View>
      <Pressable style={s.copy} onPress={copy}>
        <Text style={s.copyTxt}>{copied ? '✓ Kode disalin' : '📋 Salin Kode Undangan'}</Text>
      </Pressable>
      <Pressable style={s.done} onPress={onClose} hitSlop={8}><Text style={s.doneTxt}>Selesai</Text></Pressable>
    </BottomSheet>
  );
}
const s = StyleSheet.create({
  title: { color: c.text, fontSize: 18, fontWeight: '700', textAlign: 'center', marginTop: 2, marginBottom: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 12, height: 30, borderRadius: 15, backgroundColor: c.bg, justifyContent: 'center' },
  chipOn: { backgroundColor: c.green },
  chipTxt: { color: c.mute, fontSize: 12, fontWeight: '700' },
  label: { color: c.text, fontSize: 14, fontWeight: '600', marginBottom: 10 },
  input: { height: 48, borderRadius: 12, backgroundColor: c.bg, borderWidth: 1, borderColor: c.green, paddingHorizontal: 15, color: c.text, fontSize: 14 },
  result: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 12, backgroundColor: c.bg, paddingHorizontal: 12, marginTop: 12, gap: 12 },
  av: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avTxt: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  rName: { color: c.text, fontSize: 14, fontWeight: '700' },
  rUser: { color: c.mute, fontSize: 11, marginTop: 2 },
  inviteBtn: { width: 80, height: 30, borderRadius: 8, backgroundColor: c.green, alignItems: 'center', justifyContent: 'center' },
  inviteTxt: { color: '#000', fontSize: 11, fontWeight: '700' },
  state: { color: c.mute, fontSize: 12, fontWeight: '700' },
  none: { color: c.mute, fontSize: 12, marginTop: 12 },
  divider: { height: 1, backgroundColor: c.line, marginTop: 22 },
  or: { color: c.mute, fontSize: 13, textAlign: 'center', marginTop: 22 },
  codeBox: { alignSelf: 'center', width: 225, height: 48, borderRadius: 12, backgroundColor: c.bg, borderWidth: 1.5, borderColor: c.green, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  code: { color: c.green, fontSize: 20, fontWeight: '700' },
  copy: { height: 48, borderRadius: 12, backgroundColor: c.line, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  copyTxt: { color: c.text, fontSize: 14, fontWeight: '700' },
  done: { alignItems: 'center', paddingVertical: 18 },
  doneTxt: { color: c.mute, fontSize: 14 },
});
