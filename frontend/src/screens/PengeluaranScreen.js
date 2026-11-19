import React, { useEffect, useMemo, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import BottomNav, { NAV_HEIGHT } from '../components/BottomNav';
import BottomSheet from '../components/BottomSheet';
import PickerSheet from '../components/PickerSheet';
import { formatDate, isToday, personInitials, recentDates, redistributeDiff, splitDiff, splitEqual, validatePengeluaran } from '../store';
import { c, PAD, rupiah } from '../theme';

// 07 — Pengeluaran: bagi rata · 07b — nominal sendiri · 07c — peringatan selisih
const digits = (v) => v.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
const num = (v) => parseInt(v || '0', 10) || 0;

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

export default function PengeluaranScreen({ groups, groupId, user, onChangeGroup, onNavigate, onSave }) {
  const inset = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;
  const group = groups.find((g) => g.id === groupId) || groups[0];
  const allNames = group.people.map((p) => p.username);

  const [title, setTitle] = useState('');
  const [amountText, setAmountText] = useState('');
  const [date, setDate] = useState(() => new Date());
  const [mode, setMode] = useState('equal'); // 'equal' (07) | 'custom' (07b)
  const [sel, setSel] = useState(allNames); // anggota yang ikut dibagi
  const [custom, setCustom] = useState({}); // { username: '120000' } khusus mode custom
  const [error, setError] = useState(null); // { field, msg }
  const [payer, setPayer] = useState(null); // username pembayar (id_pembayar); default = pencatat
  const [sheet, setSheet] = useState(null); // 'group' | 'date' | 'payer' | 'diff' | null
  const [kb, setKb] = useState(false);

  // Ganti grup → pilihan anggota & nominal sendiri di-reset.
  useEffect(() => { setSel(group.people.map((p) => p.username)); setCustom({}); setError(null); setPayer(null); }, [group.id]);
  useEffect(() => {
    const a = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKb(true));
    const b = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKb(false));
    return () => { a.remove(); b.remove(); };
  }, []);

  const payerU = group.people.some((p) => p.username === payer) ? payer : group.people.some((p) => p.username === user?.username) ? user.username : group.people[0].username;
  const payerName = group.people.find((p) => p.username === payerU)?.name || '';
  const amount = num(amountText);
  const chosen = group.people.filter((p) => sel.includes(p.username)).map((p) => p.username); // urutan grup
  const shares = useMemo(() => {
    if (mode === 'equal') return splitEqual(amount, chosen);
    return Object.fromEntries(chosen.map((u) => [u, num(custom[u])]));
  }, [mode, amount, chosen.join(','), custom]);
  const diff = mode === 'custom' ? splitDiff(amount, shares) : 0;
  const clearErr = (f) => { if (error && (!f || error.field === f)) setError(null); };

  const switchMode = (m) => {
    if (m === mode) return;
    if (m === 'custom') setCustom(Object.fromEntries(Object.entries(splitEqual(amount, chosen)).map(([k, v]) => [k, v ? String(v) : ''])));
    setMode(m);
    setError(null);
  };
  const toggle = (u) => {
    clearErr('people');
    if (sel.includes(u)) {
      setSel(sel.filter((x) => x !== u));
      setCustom((m) => { const n = { ...m }; delete n[u]; return n; });
    } else setSel([...sel, u]);
  };

  const submit = () => {
    const err = validatePengeluaran({ title, amount, kas: group.balance, count: chosen.length });
    if (err) { setError(err); return; }
    if (mode === 'custom' && diff !== 0) { Keyboard.dismiss(); setSheet('diff'); return; } // 07c
    Keyboard.dismiss();
    onSave({ groupId: group.id, title: title.trim(), amount, date, shares, mode, payer: payerU });
  };
  const autoFix = () => {
    const fixed = redistributeDiff(amount, shares);
    setCustom(Object.fromEntries(Object.entries(fixed).map(([k, v]) => [k, v ? String(v) : ''])));
    setSheet(null);
  };

  const perHead = chosen.length ? Math.floor(amount / chosen.length) : 0;
  const hasRemainder = chosen.length > 0 && amount % chosen.length !== 0;
  const kurang = diff > 0;

  return (
    <View style={s.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: inset + 28, paddingHorizontal: PAD, paddingBottom: NAV_HEIGHT + 32 }}>
          <Text style={s.h1}>Catat pengeluaran</Text>
          <Text style={s.sub}>Dibayar dari kas grup, lalu dibagi ke anggota.</Text>

          <Pressable style={s.pill} onPress={() => setSheet('group')} accessibilityRole="button">
            <Text style={s.pillTxt} numberOfLines={1}>Grup aktif: {group.name}</Text>
            <Text style={s.pillSwap}>Ganti ▾</Text>
          </Pressable>
          <Text style={s.kas}>Saldo kas: {rupiah(group.balance)}</Text>

          <Text style={s.label}>Nama pengeluaran</Text>
          <TextInput
            style={[s.input, s.text, error?.field === 'title' && s.inputErr]}
            value={title}
            onChangeText={(v) => { setTitle(v); clearErr('title'); }}
            placeholder="Contoh: Makan malam bersama"
            placeholderTextColor={c.hint}
            selectionColor={c.green}
            maxLength={60}
            accessibilityLabel="Nama pengeluaran"
          />
          {error?.field === 'title' && <Text style={s.err}>⚠ {error.msg}</Text>}

          <Text style={s.label}>Total nominal (Rp)</Text>
          <TextInput
            style={[s.input, s.text, error?.field === 'amount' && s.inputErr]}
            value={amountText}
            onChangeText={(v) => { setAmountText(digits(v)); clearErr('amount'); }}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={c.hint}
            selectionColor={c.green}
            maxLength={12}
            accessibilityLabel="Total nominal pengeluaran"
          />
          {error?.field === 'amount' && <Text style={s.err}>⚠ {error.msg}</Text>}

          <Select label="Dibayar oleh" value={payerU === user?.username ? `${payerName} (kamu)` : payerName} onPress={() => setSheet('payer')} />
          <Select label="Tanggal" value={formatDate(date)} onPress={() => setSheet('date')} />

          <Text style={s.label}>Cara pembagian</Text>
          <View style={s.seg}>
            {[['equal', 'Bagi rata'], ['custom', 'Nominal sendiri']].map(([k, t]) => (
              <Pressable key={k} style={[s.segBtn, mode === k && s.segOn]} onPress={() => switchMode(k)} accessibilityRole="button" accessibilityState={{ selected: mode === k }}>
                <Text style={[s.segTxt, mode === k && { color: '#000' }]}>{t}</Text>
              </Pressable>
            ))}
          </View>

          <View style={s.head}>
            <Text style={s.h2}>Dibagi ke anggota</Text>
            <Text style={s.mute}>{chosen.length}/{group.people.length} dipilih</Text>
          </View>
          {group.people.map((p) => {
            const on = sel.includes(p.username);
            return (
              <View key={p.username} style={[s.row, !on && { opacity: 0.5 }]}>
                <Pressable style={s.rowLeft} onPress={() => toggle(p.username)} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={p.name}>
                  <View style={[s.box, on && s.boxOn]}>{on && <Text style={s.tick}>✓</Text>}</View>
                  <View style={[s.av, { backgroundColor: p.color }]}><Text style={s.avTxt}>{personInitials(p.name)}</Text></View>
                  <Text style={s.name} numberOfLines={1}>{p.name.split(' ')[0]}</Text>
                </Pressable>
                {mode === 'equal' || !on ? (
                  <Text style={[s.amt, !on && { color: c.mute }]}>{on ? rupiah(shares[p.username] || 0) : '—'}</Text>
                ) : (
                  <TextInput
                    style={[s.mini, diff !== 0 && amount > 0 && s.miniWarn]}
                    value={custom[p.username] ?? ''}
                    onChangeText={(v) => setCustom((m) => ({ ...m, [p.username]: digits(v) }))}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={c.hint}
                    selectionColor={c.green}
                    maxLength={12}
                    textAlign="right"
                    accessibilityLabel={`Nominal ${p.name}`}
                  />
                )}
              </View>
            );
          })}
          {error?.field === 'people' && <Text style={s.err}>⚠ {error.msg}</Text>}

          {mode === 'equal' ? (
            <View style={s.info}>
              <Text style={s.infoTitle}>
                {chosen.length && amount ? `${rupiah(perHead)} per orang · ${chosen.length} anggota` : 'Isi nominal untuk melihat pembagian'}
              </Text>
              {hasRemainder && <Text style={s.infoSub}>Sisa pembulatan {rupiah(amount - perHead * chosen.length)} dibebankan ke anggota teratas.</Text>}
            </View>
          ) : amount > 0 && (
            <View style={[s.info, diff === 0 ? s.okBox : s.warnBox]}>
              <Text style={[s.infoTitle, { color: diff === 0 ? c.green : c.amber }]}>
                {diff === 0 ? '✓ Pembagian pas dengan total' : `⚠ Selisih ${rupiah(diff)} — ${kurang ? 'masih kurang dibagi' : 'kelebihan dibagi'}`}
              </Text>
              <Text style={s.infoSub}>Terbagi {rupiah(amount - diff)} dari {rupiah(amount)}</Text>
            </View>
          )}

          <Pressable onPress={submit} accessibilityRole="button"
            style={({ pressed }) => [s.btn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}>
            <Text style={s.btnTxt}>Simpan pengeluaran</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
      {!kb && <BottomNav active="groups" onNavigate={onNavigate} />}

      <PickerSheet visible={sheet === 'group'} title="Pilih grup aktif" selected={group.id}
        options={groups.map((g) => ({ key: g.id, label: g.name, sub: `${g.people.length} anggota · Kas ${rupiah(g.balance)}` }))}
        onSelect={(k) => { onChangeGroup(k); setSheet(null); }} onClose={() => setSheet(null)} />
      <PickerSheet visible={sheet === 'date'} title="Pilih tanggal" selected={date.toDateString()}
        options={recentDates().map((d) => ({ key: d.toDateString(), label: formatDate(d), sub: isToday(d) ? 'Hari ini' : undefined }))}
        onSelect={(k) => { setDate(recentDates().find((d) => d.toDateString() === k)); setSheet(null); }} onClose={() => setSheet(null)} />

      <PickerSheet visible={sheet === 'payer'} title="Dibayar oleh" selected={payerU}
        options={group.people.map((p) => ({ key: p.username, label: p.name, sub: p.username === user?.username ? 'Kamu' : `@${p.username}` }))}
        onSelect={(k) => { setPayer(k); setSheet(null); }} onClose={() => setSheet(null)} />

      {/* 07c — peringatan selisih */}
      <BottomSheet visible={sheet === 'diff'} onClose={() => setSheet(null)}>
        <Text style={s.warnTitle}>⚠ Pembagian belum pas</Text>
        <Text style={s.warnSub}>Jumlah nominal per anggota harus sama dengan total pengeluaran sebelum disimpan.</Text>
        <View style={s.sum}>
          <View style={s.sumRow}><Text style={s.sumLbl}>Total pengeluaran</Text><Text style={s.sumVal}>{rupiah(amount)}</Text></View>
          <View style={s.sumRow}><Text style={s.sumLbl}>Total dibagi</Text><Text style={s.sumVal}>{rupiah(amount - diff)}</Text></View>
          <View style={[s.sumRow, { marginBottom: 0 }]}>
            <Text style={[s.sumLbl, { color: c.amber }]}>{kurang ? 'Kurang' : 'Lebih'}</Text>
            <Text style={[s.sumVal, { color: c.amber }]}>{rupiah(diff)}</Text>
          </View>
        </View>
        <Pressable onPress={autoFix} accessibilityRole="button" style={({ pressed }) => [s.btn, { marginTop: 8 }, pressed && { opacity: 0.85 }]}>
          <Text style={s.btnTxt}>Sesuaikan otomatis</Text>
        </Pressable>
        <Pressable onPress={() => setSheet(null)} accessibilityRole="button" style={s.ghost}>
          <Text style={s.ghostTxt}>Perbaiki manual</Text>
        </Pressable>
      </BottomSheet>
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
  kas: { color: c.mute, fontSize: 11, marginTop: 8 },
  label: { color: c.mute, fontSize: 12, marginTop: 22, marginBottom: 8 },
  input: { height: 42, borderRadius: 10, backgroundColor: c.card, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  text: { color: c.text, fontSize: 14 },
  inputErr: { borderColor: c.red },
  value: { color: c.text, fontSize: 14, flex: 1 },
  caret: { color: c.mute, fontSize: 14 },
  err: { color: c.red, fontSize: 11, marginTop: 8 },
  seg: { height: 40, borderRadius: 12, backgroundColor: c.card, flexDirection: 'row', padding: 4, gap: 4 },
  segBtn: { flex: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: c.green },
  segTxt: { color: c.mute, fontSize: 13, fontWeight: '700' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 26, marginBottom: 12 },
  h2: { color: c.text, fontSize: 16, fontWeight: '700' },
  mute: { color: c.mute, fontSize: 12 },
  row: { minHeight: 52, borderRadius: 12, backgroundColor: c.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 8, gap: 10 },
  rowLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52 },
  box: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: c.line, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: c.green, borderColor: c.green },
  tick: { color: '#000', fontSize: 12, fontWeight: '700', marginTop: -1 },
  av: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avTxt: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  name: { color: c.text, fontSize: 14, fontWeight: '700', flex: 1 },
  amt: { color: c.text, fontSize: 13, fontWeight: '700' },
  mini: { width: 110, height: 34, borderRadius: 8, backgroundColor: c.bg, color: c.text, fontSize: 13, fontWeight: '700', paddingHorizontal: 10, borderWidth: 1.5, borderColor: 'transparent' },
  miniWarn: { borderColor: c.amber },
  info: { marginTop: 12, borderRadius: 12, backgroundColor: '#1E3A5F', paddingHorizontal: 15, paddingVertical: 14 },
  okBox: { backgroundColor: 'rgba(0,230,118,0.12)' },
  warnBox: { backgroundColor: 'rgba(245,158,11,0.15)' },
  infoTitle: { color: '#3B82F6', fontSize: 12, fontWeight: '700' },
  infoSub: { color: c.mute, fontSize: 11, marginTop: 6 },
  btn: { height: 52, borderRadius: 16, backgroundColor: c.green, alignItems: 'center', justifyContent: 'center', marginTop: 36 },
  btnTxt: { color: '#000', fontSize: 15, fontWeight: '700' },
  warnTitle: { color: c.amber, fontSize: 18, fontWeight: '700' },
  warnSub: { color: c.mute, fontSize: 12, marginTop: 8, lineHeight: 18 },
  sum: { marginTop: 18, marginBottom: 20, borderRadius: 12, backgroundColor: c.bg, padding: 16 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sumLbl: { color: c.mute, fontSize: 13 },
  sumVal: { color: c.text, fontSize: 13, fontWeight: '700' },
  ghost: { height: 48, borderRadius: 16, borderWidth: 1.5, borderColor: c.line, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  ghostTxt: { color: c.text, fontSize: 14, fontWeight: '700' },
});
