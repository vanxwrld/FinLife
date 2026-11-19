import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { c } from '../theme';

export default function Button({ title, onPress, style }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [s.btn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }, style]}>
      <Text style={s.txt}>{title}</Text>
    </Pressable>
  );
}
const s = StyleSheet.create({
  btn: { height: 52, borderRadius: 16, backgroundColor: c.green, alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  txt: { color: '#000', fontSize: 16, fontWeight: '700' },
});
