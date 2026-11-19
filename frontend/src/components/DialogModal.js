import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { c } from '../theme';

// Dialog di tengah layar (desain 10b Pop-up undangan & 10c Kirim pengingat):
// ikon bulat + judul + teks + tombol utama (hijau) + tombol kedua (outline).
export default function DialogModal({ visible, icon, tone = c.green, title, lines = [], primary, secondary, onClose }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.overlay}>
        <View style={s.card}>
          <View style={[s.icon, { backgroundColor: tone + '33' }]}><Text style={[s.glyph, { color: tone }]}>{icon}</Text></View>
          <Text style={s.title}>{title}</Text>
          {lines.map((l) => <Text key={l} style={s.msg}>{l}</Text>)}
          <Pressable onPress={primary.onPress} accessibilityRole="button" style={({ pressed }) => [s.btn, s.primary, pressed && s.pressed]}>
            <Text style={s.primaryTxt}>{primary.label}</Text>
          </Pressable>
          <Pressable onPress={secondary.onPress} accessibilityRole="button" style={({ pressed }) => [s.btn, s.secondary, pressed && s.pressed]}>
            <Text style={s.secondaryTxt}>{secondary.label}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 25 },
  card: { backgroundColor: c.card, borderRadius: 24, padding: 25, paddingTop: 28, alignItems: 'center' },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  glyph: { fontSize: 26, fontWeight: '700' },
  title: { color: c.text, fontSize: 19, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  msg: { color: c.mute, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  btn: { alignSelf: 'stretch', height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginHorizontal: 25 },
  primary: { backgroundColor: c.green, marginTop: 22 },
  primaryTxt: { color: '#000', fontSize: 14, fontWeight: '700' },
  secondary: { backgroundColor: c.card, borderWidth: 1.5, borderColor: c.line, marginTop: 10 },
  secondaryTxt: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
