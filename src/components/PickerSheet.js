import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import BottomSheet from './BottomSheet';
import { c } from '../theme';

// Sheet pilihan sederhana (grup aktif, anggota penyetor, tanggal).
// options: [{ key, label, sub? }]
export default function PickerSheet({ visible, title, options, selected, onSelect, onClose }) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={s.title}>{title}</Text>
      {options.map((o) => {
        const on = o.key === selected;
        return (
          <Pressable key={o.key} style={[s.row, on && s.rowOn]} onPress={() => onSelect(o.key)} accessibilityRole="button">
            <View style={{ flex: 1 }}>
              <Text style={[s.label, on && { color: c.green }]}>{o.label}</Text>
              {!!o.sub && <Text style={s.sub}>{o.sub}</Text>}
            </View>
            {on && <Text style={s.check}>✓</Text>}
          </Pressable>
        );
      })}
    </BottomSheet>
  );
}
const s = StyleSheet.create({
  title: { color: c.text, fontSize: 18, fontWeight: '700', marginBottom: 14 },
  row: { minHeight: 46, borderRadius: 12, backgroundColor: c.bg, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  rowOn: { borderColor: c.green },
  label: { color: c.text, fontSize: 14 },
  sub: { color: c.mute, fontSize: 11, marginTop: 2 },
  check: { color: c.green, fontSize: 16, fontWeight: '700' },
});
