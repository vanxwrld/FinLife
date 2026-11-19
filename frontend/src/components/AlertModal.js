import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { c } from '../theme';

// Alert gagal (desain 02d & 03b)
export default function AlertModal({ visible, title, lines = [], onClose }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.overlay}>
        <View style={s.card}>
          <View style={s.icon}><Text style={s.bang}>!</Text></View>
          <Text style={s.title}>{title}</Text>
          {lines.map((l) => <Text key={l} style={s.msg}>{l}</Text>)}
          <Pressable style={s.ok} onPress={onClose}><Text style={s.okTxt}>OK</Text></Pressable>
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
  msg: { color: c.mute, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  ok: { alignSelf: 'stretch', height: 46, borderRadius: 14, backgroundColor: c.green, alignItems: 'center', justifyContent: 'center', marginTop: 22, marginHorizontal: 25 },
  okTxt: { color: '#000', fontSize: 14, fontWeight: '700' },
});
