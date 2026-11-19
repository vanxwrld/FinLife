import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { c } from '../theme';

export default function Toast({ message, id }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!message) return;
    Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(v, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [id]);
  if (!message) return null;
  return (
    <Animated.View pointerEvents="none" style={[s.box, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
      <Text style={s.txt}>{message}</Text>
    </Animated.View>
  );
}
const s = StyleSheet.create({
  box: { position: 'absolute', left: 25, right: 25, bottom: 100, backgroundColor: c.green, borderRadius: 14, padding: 14 },
  txt: { color: '#000', fontWeight: '700', fontSize: 14, textAlign: 'center' },
});
