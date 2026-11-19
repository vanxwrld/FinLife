import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { c } from '../theme';

// 09e — Konfirmasi hapus transaksi
export default function ConfirmDeleteModal({ visible, onCancel, onConfirm }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={s.overlay}>
        <View style={s.card}>
          <View style={s.icon}><Text style={s.bang}>!</Text></View>
          <Text style={s.title}>Hapus Transaksi Ini?</Text>
          <Text style={s.msg}>
            Transaksi dikeluarkan dari perhitungan saldo, kewajiban anggota dihitung ulang, dan penghapusan tercatat di riwayat.
          </Text>
          <Pressable onPress={onCancel} accessibilityRole="button"
            style={({ pressed }) => [s.btn, s.cancel, pressed && s.pressed]}>
            <Text style={s.btnTxt}>Batal</Text>
          </Pressable>
          <Pressable onPress={onConfirm} accessibilityRole="button"
            style={({ pressed }) => [s.btn, s.del, pressed && s.pressed]}>
            <Text style={s.btnTxt}>Ya, Hapus</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 25 },
  card: { backgroundColor: c.card, borderRadius: 24, padding: 25, paddingTop: 28, alignItems: 'center' },
  icon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(239,68,68,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  bang: { color: c.red, fontSize: 26, fontWeight: '700' },
  title: { color: c.text, fontSize: 19, fontWeight: '700', marginBottom: 8 },
  msg: { color: c.mute, fontSize: 12, lineHeight: 18, textAlign: 'center', marginBottom: 12 },
  btn: { alignSelf: 'stretch', height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 10, marginHorizontal: 25 },
  cancel: { backgroundColor: c.card, borderWidth: 1.5, borderColor: c.line },
  del: { backgroundColor: c.red },
  btnTxt: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
