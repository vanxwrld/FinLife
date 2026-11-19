import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { c } from '../theme';

// Bottom nav sesuai desain: Beranda · Grup · Catat · Notifikasi · Profil
const HOME = 'M10 3L3 9v11a1 1 0 001 1h5v-6h4v6h5a1 1 0 001-1V9l-7-6z';
const GROUP = 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z';
const BELL = 'M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0';
const USER = 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z';

export const NAV_HEIGHT = 64 + (Platform.OS === 'ios' ? 20 : 0);

export default function BottomNav({ active, onNavigate }) {
  const col = (k) => (active === k ? c.green : c.mute);
  const Item = ({ k, label, children }) => (
    <Pressable style={s.item} onPress={() => onNavigate(k)} accessibilityRole="button" accessibilityLabel={label}>
      <Svg width={24} height={24} viewBox="0 0 24 24">{children}</Svg>
      <Text style={[s.label, { color: col(k) }]}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={s.bar}>
      <Item k="home" label="Beranda"><Path d={HOME} fill={col('home')} /></Item>
      <Item k="groups" label="Grup"><Path d={GROUP} stroke={col('groups')} strokeWidth={2} fill="none" /></Item>
      <Item k="add" label="Catat">
        <Circle cx={12} cy={12} r={12} fill={c.green} />
        <Path d="M12 7v10M7 12h10" stroke="#000" strokeWidth={2.5} strokeLinecap="round" />
      </Item>
      <Item k="notif" label="Notifikasi"><Path d={BELL} stroke={col('notif')} strokeWidth={2} fill="none" /></Item>
      <Item k="profile" label="Profil"><Path d={USER} fill={col('profile')} /></Item>
    </View>
  );
}
const s = StyleSheet.create({
  bar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: NAV_HEIGHT,
    flexDirection: 'row', backgroundColor: c.card, borderTopWidth: 1, borderTopColor: c.line,
    paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  item: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontSize: 10 },
});
