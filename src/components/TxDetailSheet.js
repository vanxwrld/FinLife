import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import BottomSheet from './BottomSheet';
import { dateTimeLabel, firstName, formatDate, personName, splitLabel } from '../store';
import { c, rupiah } from '../theme';

// 09c — Detail transaksi (pencatat): rincian + tombol Ubah Data / Hapus.
// 09f — Detail transaksi (read-only): isi sama, tetapi terkunci untuk selain pencatat/admin → banner + tombol Tutup.
export default function TxDetailSheet({ visible, tx, group, readOnly, onClose, onEdit, onDelete }) {
  if (!tx || !group) return null;
  const out = tx.kind === 'out';
  const col = out ? c.red : c.green;
  const rows = [
    ['Dicatat oleh', personName(group, tx.by)],
    [out ? 'Dibayar oleh' : 'Disetor oleh', personName(group, tx.payer)],
    ['Tanggal', formatDate(new Date(tx.at))],
    ...(out ? [['Metode pembagian', splitLabel(tx)]] : []),
  ];
  const parts = out ? group.people.filter((p) => tx.shares?.[p.username] > 0) : [];

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={s.kicker}>Rincian Transaksi</Text>
      <Text style={s.title} numberOfLines={2}>{tx.title}</Text>
      <Text style={[s.amt, { color: col }]}>{(out ? '-' : '+') + rupiah(tx.amount)}</Text>

      {rows.map(([k, v]) => (
        <View key={k} style={s.row}>
          <Text style={s.k}>{k}</Text>
          <Text style={s.v} numberOfLines={1}>{v}</Text>
        </View>
      ))}

      {parts.length > 0 && (
        <>
          <Text style={s.h2}>Pembagian biaya</Text>
          {parts.map((p) => (
            <View key={p.username} style={s.part}>
              <Text style={s.partName} numberOfLines={1}>{p.name}</Text>
              <Text style={s.partAmt}>{rupiah(tx.shares[p.username])}</Text>
            </View>
          ))}
        </>
      )}

      {!!tx.edited && (
        <View style={s.edited}>
          <Text style={s.editedTxt}>Diedit oleh {firstName(personName(group, tx.edited.by))} · {dateTimeLabel(tx.edited.at)}</Text>
        </View>
      )}

      {readOnly ? (
        <>
          <View style={s.locked}>
            <Text style={s.lockedTxt}>
              <Text style={{ fontWeight: '700' }}>Terkunci: hanya pencatat ({firstName(personName(group, tx.by))}) atau admin</Text>
              {' '}grup yang dapat mengoreksi transaksi ini.
            </Text>
          </View>
          <Pressable onPress={onClose} accessibilityRole="button"
            style={({ pressed }) => [s.btn, s.btnLine, s.btnFull, pressed && s.pressed]}>
            <Text style={s.btnTxt}>Tutup</Text>
          </Pressable>
        </>
      ) : (
        <>
          <View style={s.btns}>
            <Pressable onPress={onEdit} accessibilityRole="button" accessibilityLabel="Ubah data transaksi"
              style={({ pressed }) => [s.btn, s.btnLine, pressed && s.pressed]}>
              <Text style={s.btnTxt}>Ubah Data</Text>
            </Pressable>
            <Pressable onPress={onDelete} accessibilityRole="button" accessibilityLabel="Hapus transaksi"
              style={({ pressed }) => [s.btn, s.btnDel, pressed && s.pressed]}>
              <Text style={s.btnTxt}>Hapus</Text>
            </Pressable>
          </View>
          <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" style={s.close}>
            <Text style={s.closeTxt}>Tutup</Text>
          </Pressable>
        </>
      )}
    </BottomSheet>
  );
}
const s = StyleSheet.create({
  kicker: { color: c.mute, fontSize: 12, textAlign: 'center' },
  title: { color: c.text, fontSize: 20, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  amt: { fontSize: 26, fontWeight: '700', textAlign: 'center', marginTop: 8, marginBottom: 18 },
  row: { height: 32, borderRadius: 10, backgroundColor: c.bg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, marginBottom: 6, gap: 12 },
  k: { color: c.mute, fontSize: 12 },
  v: { color: c.text, fontSize: 12, fontWeight: '700', flexShrink: 1 },
  h2: { color: c.mute, fontSize: 12, fontWeight: '700', marginTop: 14, marginBottom: 8 },
  part: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, height: 22, gap: 12 },
  partName: { color: c.text, fontSize: 12, flex: 1 },
  partAmt: { color: c.text, fontSize: 12, fontWeight: '700' },
  edited: { height: 26, borderRadius: 10, backgroundColor: c.amber + '26', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  editedTxt: { color: c.amber, fontSize: 11, fontWeight: '700' },
  locked: { borderRadius: 10, backgroundColor: c.line, paddingHorizontal: 15, paddingVertical: 10, marginTop: 14 },
  lockedTxt: { color: c.mute, fontSize: 11, lineHeight: 18 },
  btnFull: { flex: 0, alignSelf: 'stretch', marginTop: 14 },
  btns: { flexDirection: 'row', gap: 9, marginTop: 14 },
  btn: { flex: 1, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnLine: { backgroundColor: c.card, borderWidth: 1.5, borderColor: c.line },
  btnDel: { backgroundColor: c.red },
  btnTxt: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  close: { height: 34, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  closeTxt: { color: c.mute, fontSize: 14, fontWeight: '700' },
});
