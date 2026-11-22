import React, { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import BottomNav, { NAV_HEIGHT } from '../../components/BottomNav';
import PickerSheet from '../../components/PickerSheet';
import { formatDate, isToday, recentDates, validateSetoran } from '../../store';
import { c, PAD } from '../../theme';

// 06 — Catat setoran · 06b — validasi nominal
const BLUE = '#3B82F6';

function Select({ label, value, onPress }) {
  return (
    <>
      <Text style={s.label}>{label}</Text>
      <Pressable style={s.input} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
        <Text style={s.value} numberOfLines={1}>{value}</Text>
        <Text style={s.caret}>▾</Text>
      </Pressable>
    </>
  );
}

export default function SetoranScreen({ groups, groupId, user, onChangeGroup, onNavigate, onSave, online = true }) {
  const inset = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;
  const group = groups.find((g) => g.id === groupId) || groups[0];

  const defaultPerson = (g) => (g.people.find((p) => p.username === user?.username) || g.people[0]).username;
  const [username, setUsername] = useState(defaultPerson(group));
  const [amountText, setAmountText] = useState('');
  const [date, setDate] = useState(() => new Date());
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
  const [sheet, setSheet] = useState(null); // 'group' | 'person' | 'date' | null
  const [kb, setKb] = useState(false);

  // Ganti grup → anggota penyetor kembali ke default grup tsb.
  useEffect(() => { setUsername(defaultPerson(group)); }, [group.id]);
  useEffect(() => {
    const a = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKb(true));
    const b = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKb(false));
    return () => { a.remove(); b.remove(); };
  }, []);

  const person = group.people.find((p) => p.username === username) || group.people[0];

  const submit = () => {
    const amount = parseInt(amountText || '0', 10);
    const err = validateSetoran(amount);
    if (err) { setError(err); return; }
    Keyboard.dismiss();
    onSave({ groupId: group.id, username: person.username, amount, date, note: note.trim() });
  };

  return (
    <View style={s.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: inset + 28, paddingHorizontal: PAD, paddingBottom: NAV_HEIGHT + 32 }}>
          <Text style={s.h1}>Catat setoran</Text>
          <Text style={s.sub}>Tambah urunan ke catatan grup.</Text>

          <Pressable style={s.pill} onPress={() => setSheet('group')} accessibilityRole="button">
            <Text style={s.pillTxt} numberOfLines={1}>Grup aktif: {group.name}</Text>
            <Text style={s.pillSwap}>Ganti ▾</Text>
          </Pressable>

          <Select label="Anggota penyetor" value={person.name} onPress={() => setSheet('person')} />

          <Text style={s.label}>Nominal (Rp)</Text>
          <TextInput
            style={[s.input, s.text, !!error && s.inputErr]}
            value={amountText}
            onChangeText={(v) => { setAmountText(v.replace(/\D/g, '').replace(/^0+(?=\d)/, '')); if (error) setError(null); }}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={c.hint}
            selectionColor={c.green}
            maxLength={12}
            accessibilityLabel="Nominal setoran"
          />
          {!!error && <Text style={s.err}>⚠ {error}</Text>}

          <Select label="Tanggal" value={formatDate(date)} onPress={() => setSheet('date')} />

          <Text style={s.label}>Keterangan (opsional)</Text>
          <TextInput
            style={[s.input, s.text]}
            value={note}
            onChangeText={setNote}
            placeholder="Contoh: Urunan bulanan kos"
            placeholderTextColor={c.hint}
            selectionColor={c.green}
            maxLength={80}
          />

          <View style={[s.info, !online && { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
            <Text style={[s.infoTitle, !online && { color: c.amber }]}>
              {online ? 'ℹ Input bisa disimpan saat offline.' : 'ℹ Kamu sedang offline. Setoran disimpan lokal.'}
            </Text>
            <Text style={s.infoSub}>{online ? 'Dikirim otomatis saat koneksi internet tersedia.' : 'Masuk antrian dan dikirim otomatis saat online.'}</Text>
          </View>

          <Pressable onPress={submit} accessibilityRole="button"
            style={({ pressed }) => [s.btn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}>
            <Text style={s.btnTxt}>Simpan setoran</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
      {!kb && <BottomNav active="add" onNavigate={onNavigate} />}

      <PickerSheet visible={sheet === 'group'} title="Pilih grup aktif" selected={group.id}
        options={groups.map((g) => ({ key: g.id, label: g.name, sub: `${g.people.length} anggota · Kode ${g.code}` }))}
        onSelect={(k) => { onChangeGroup(k); setSheet(null); }} onClose={() => setSheet(null)} />
      <PickerSheet visible={sheet === 'person'} title="Anggota penyetor" selected={person.username}
        options={group.people.map((p) => ({ key: p.username, label: p.name, sub: '@' + p.username }))}
        onSelect={(k) => { setUsername(k); setSheet(null); }} onClose={() => setSheet(null)} />
      <PickerSheet visible={sheet === 'date'} title="Pilih tanggal" selected={date.toDateString()}
        options={recentDates().map((d) => ({ key: d.toDateString(), label: formatDate(d), sub: isToday(d) ? 'Hari ini' : undefined }))}
        onSelect={(k) => { setDate(recentDates().find((d) => d.toDateString() === k)); setSheet(null); }} onClose={() => setSheet(null)} />
    </View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  h1: { color: c.text, fontSize: 24, fontWeight: '700' },
  sub: { color: c.mute, fontSize: 12, marginTop: 6 },
  pill: { marginTop: 14, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,230,118,0.12)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 },
  pillTxt: { color: c.green, fontSize: 12, fontWeight: '700', flex: 1, marginRight: 8 },
  pillSwap: { color: c.green, fontSize: 12 },
  label: { color: c.mute, fontSize: 12, marginTop: 22, marginBottom: 8 },
  input: { height: 42, borderRadius: 10, backgroundColor: c.card, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  text: { color: c.text, fontSize: 14 },
  inputErr: { borderColor: c.red },
  value: { color: c.text, fontSize: 14, flex: 1 },
  caret: { color: c.mute, fontSize: 14 },
  err: { color: c.red, fontSize: 11, marginTop: 8 },
  info: { marginTop: 30, borderRadius: 12, backgroundColor: '#1E3A5F', paddingHorizontal: 15, paddingVertical: 14 },
  infoTitle: { color: BLUE, fontSize: 12, fontWeight: '700' },
  infoSub: { color: c.mute, fontSize: 11, marginTop: 6 },
  btn: { height: 52, borderRadius: 16, backgroundColor: c.green, alignItems: 'center', justifyContent: 'center', marginTop: 44 },
  btnTxt: { color: '#000', fontSize: 15, fontWeight: '700' },
});
