import React, { useEffect, useMemo, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import BottomNav, { NAV_HEIGHT } from '../../components/BottomNav';
import { personInitials, redistributeDiff, splitDiff, splitEqual, validateKoreksi } from '../../store';
import { c, PAD, rupiah } from '../../theme';

// 09d — Koreksi transaksi. Pengeluaran: nama, total, metode pembagian. Setoran: nominal. Keduanya wajib beralasan.
const digits = (v) => v.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
const num = (v) => parseInt(v || '0', 10) || 0;
const str = (v) => (v ? String(v) : '');

export default function KoreksiScreen({ group, tx, online = true, onNavigate, onSave, onCancel }) {
  const inset = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;
  const out = tx.kind === 'out'; // group & tx dijamin ada (dicek di App.js)
  const [title, setTitle] = useState(tx.title);
  const [amountText, setAmountText] = useState(str(tx.amount));
  const [mode, setMode] = useState(tx.mode || 'equal');
  const [custom, setCustom] = useState(() => Object.fromEntries(Object.entries(tx.shares || {}).map(([k, v]) => [k, str(v)])));
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null); // { field, msg }
  const [kb, setKb] = useState(false);

  useEffect(() => {
    const a = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKb(true));
    const b = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKb(false));
    return () => { a.remove(); b.remove(); };
  }, []);
  const amount = num(amountText);
  const members = group.people.filter((p) => tx.shares?.[p.username] !== undefined); // peserta pembagian asli
  const chosen = members.map((p) => p.username);
  const shares = useMemo(() => {
    if (!out) return {};
    if (mode === 'equal') return splitEqual(amount, chosen);
    return Object.fromEntries(chosen.map((u) => [u, num(custom[u])]));
  }, [out, mode, amount, chosen.join(','), custom]);
  const diff = out && mode === 'custom' ? splitDiff(amount, shares) : 0;
  const clearErr = (f) => { if (error && error.field === f) setError(null); };

  const switchMode = (m) => {
    if (m === mode) return;
    if (m === 'custom') setCustom(Object.fromEntries(Object.entries(splitEqual(amount, chosen)).map(([k, v]) => [k, str(v)])));
    setMode(m);
    setError(null);
  };
  const autoFix = () => {
    const fixed = redistributeDiff(amount, shares);
    setCustom(Object.fromEntries(Object.entries(fixed).map(([k, v]) => [k, str(v)])));
    setError(null);
  };
  const submit = () => {
    if (!online) { setError({ field: 'offline', msg: 'Kamu sedang offline. Koreksi hanya dapat dilakukan saat online.' }); return; }
    const err = validateKoreksi({ group, tx, title, amount, reason });
    if (err) { setError(err); return; }
    if (out && mode === 'custom' && diff !== 0) {
      setError({ field: 'people', msg: 'Jumlah nominal per anggota harus sama dengan total.' });
      return;
    }
    Keyboard.dismiss();
    onSave({ title, amount, mode, shares, reason });
  };

  const Err = ({ f }) => (error?.field === f ? <Text style={s.err}>⚠ {error.msg}</Text> : null);

  return (
    <View style={s.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: inset + 28, paddingHorizontal: PAD, paddingBottom: NAV_HEIGHT + 32 }}>
          <Text style={s.h1}>Koreksi Transaksi</Text>
          <Text style={s.sub}>Perbaiki data setoran atau pengeluaran yang salah.</Text>

          {out && (
            <>
              <Text style={s.label}>Nama pengeluaran</Text>
              <TextInput style={[s.input, error?.field === 'title' && s.inputErr]} value={title}
                onChangeText={(v) => { setTitle(v); clearErr('title'); }} maxLength={60}
                placeholderTextColor={c.hint} selectionColor={c.green} accessibilityLabel="Nama pengeluaran" />
              <Err f="title" />
            </>
          )}

          <Text style={s.label}>{out ? 'Total (Rp)' : 'Nominal setoran (Rp)'}</Text>
          <TextInput style={[s.input, error?.field === 'amount' && s.inputErr]} value={amountText}
            onChangeText={(v) => { setAmountText(digits(v)); clearErr('amount'); }} keyboardType="number-pad" maxLength={12}
            placeholder="0" placeholderTextColor={c.hint} selectionColor={c.green} accessibilityLabel="Nominal transaksi" />
          <Err f="amount" />

          {out && (
            <>
              <Text style={s.label}>Metode pembagian</Text>
              <View style={s.segRow}>
                {[['equal', 'Bagi rata'], ['custom', 'Nominal sendiri']].map(([k, t]) => (
                  <Pressable key={k} onPress={() => switchMode(k)} accessibilityRole="button" accessibilityState={{ selected: mode === k }}
                    style={[s.seg, mode === k && s.segOn]}>
                    <Text style={[s.segTxt, mode === k && { color: '#000' }]}>{t}</Text>
                  </Pressable>
                ))}
              </View>

              {mode === 'custom' ? (
                <>
                  {members.map((p) => (
                    <View key={p.username} style={s.row}>
                      <View style={[s.av, { backgroundColor: p.color }]}><Text style={s.avTxt}>{personInitials(p.name)}</Text></View>
                      <Text style={s.name} numberOfLines={1}>{p.name.split(' ')[0]}</Text>
                      <TextInput style={[s.mini, diff !== 0 && amount > 0 && s.miniWarn]} value={custom[p.username] ?? ''}
                        onChangeText={(v) => { setCustom((m) => ({ ...m, [p.username]: digits(v) })); clearErr('people'); }}
                        keyboardType="number-pad" maxLength={12} placeholder="0" placeholderTextColor={c.hint}
                        selectionColor={c.green} textAlign="right" accessibilityLabel={`Nominal ${p.name}`} />
                    </View>
                  ))}
                  {amount > 0 && (
                    <View style={[s.box, diff === 0 ? s.okBox : s.warnBox]}>
                      <Text style={[s.boxTitle, { color: diff === 0 ? c.green : c.amber }]}>
                        {diff === 0 ? '✓ Pembagian pas dengan total' : `⚠ Selisih ${rupiah(diff)} — ${diff > 0 ? 'masih kurang dibagi' : 'kelebihan dibagi'}`}
                      </Text>
                      {diff !== 0 && (
                        <Pressable onPress={autoFix} hitSlop={8} accessibilityRole="button">
                          <Text style={s.fix}>Sesuaikan otomatis</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                  <Err f="people" />
                </>
              ) : (
                <Text style={s.hint}>
                  {chosen.length && amount ? `${rupiah(Math.floor(amount / chosen.length))} per orang · ${chosen.length} anggota` : 'Isi total untuk melihat pembagian'}
                </Text>
              )}
            </>
          )}

          <Text style={s.label}>Alasan koreksi</Text>
          <TextInput style={[s.input, error?.field === 'reason' && s.inputErr]} value={reason}
            onChangeText={(v) => { setReason(v); clearErr('reason'); }} maxLength={80}
            placeholder={out ? 'Contoh: salah catat nominal' : 'Contoh: salah ketik nominal setoran'}
            placeholderTextColor={c.hint} selectionColor={c.green} accessibilityLabel="Alasan koreksi" />
          <Err f="reason" />

          <View style={s.info}>
            <Text style={s.infoTitle}>ℹ Koreksi hanya dapat dilakukan saat online.</Text>
            <Text style={s.infoSub}>Perubahan dicatat di riwayat beserta pelaku & waktu.</Text>
          </View>

          <Err f="offline" />
          <Pressable onPress={submit} accessibilityRole="button"
            style={({ pressed }) => [s.btn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}>
            <Text style={s.btnTxt}>Simpan Perubahan</Text>
          </Pressable>
          <Pressable onPress={onCancel} accessibilityRole="button" style={s.cancel}>
            <Text style={s.cancelTxt}>Batal</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
      {!kb && <BottomNav active="groups" onNavigate={onNavigate} />}
    </View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  h1: { color: c.text, fontSize: 24, fontWeight: '700' },
  sub: { color: c.mute, fontSize: 12, marginTop: 6 },
  label: { color: c.mute, fontSize: 12, marginTop: 20, marginBottom: 8 },
  input: { height: 42, borderRadius: 10, backgroundColor: c.card, paddingHorizontal: 15, color: c.text, fontSize: 14, borderWidth: 1.5, borderColor: 'transparent' },
  inputErr: { borderColor: c.red },
  err: { color: c.red, fontSize: 11, marginTop: 8 },
  segRow: { flexDirection: 'row', gap: 9 },
  seg: { flex: 1, height: 38, borderRadius: 12, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: c.green },
  segTxt: { color: c.mute, fontSize: 13, fontWeight: '700' },
  hint: { color: c.mute, fontSize: 11, marginTop: 10 },
  row: { minHeight: 48, borderRadius: 12, backgroundColor: c.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginTop: 8, gap: 10 },
  av: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avTxt: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  name: { flex: 1, color: c.text, fontSize: 14, fontWeight: '700' },
  mini: { width: 110, height: 34, borderRadius: 8, backgroundColor: c.bg, color: c.text, fontSize: 13, fontWeight: '700', paddingHorizontal: 10, borderWidth: 1.5, borderColor: 'transparent' },
  miniWarn: { borderColor: c.amber },
  box: { marginTop: 10, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12 },
  okBox: { backgroundColor: 'rgba(0,230,118,0.12)' },
  warnBox: { backgroundColor: 'rgba(245,158,11,0.15)' },
  boxTitle: { fontSize: 12, fontWeight: '700' },
  fix: { color: c.amber, fontSize: 12, fontWeight: '700', marginTop: 8, textDecorationLine: 'underline' },
  info: { marginTop: 28, borderRadius: 12, backgroundColor: '#1E3A5F', paddingHorizontal: 15, paddingVertical: 14 },
  infoTitle: { color: '#3B82F6', fontSize: 12, fontWeight: '700' },
  infoSub: { color: c.mute, fontSize: 11, marginTop: 6 },
  btn: { height: 52, borderRadius: 16, backgroundColor: c.green, alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  btnTxt: { color: '#000', fontSize: 15, fontWeight: '700' },
  cancel: { height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  cancelTxt: { color: c.mute, fontSize: 15, fontWeight: '700' },
});
