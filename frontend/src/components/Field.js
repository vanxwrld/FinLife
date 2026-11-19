import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { c } from '../theme';

export default function Field({ label, error, secure, style, inputRef, ...rest }) {
  const [focus, setFocus] = useState(false);
  const [hide, setHide] = useState(true);
  return (
    <View style={[s.wrap, style]}>
      <Text style={s.label}>{label}</Text>
      <View>
        <TextInput
          ref={inputRef}
          placeholderTextColor={c.hint}
          selectionColor={c.green}
          secureTextEntry={secure && hide}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={[s.input, focus && s.focus, !!error && s.err, secure && { paddingRight: 46 }]}
          {...rest}
        />
        {secure && (
          <Pressable
            style={s.eye}
            hitSlop={8}
            onPress={() => setHide((h) => !h)}
            accessibilityLabel={hide ? 'Tampilkan kata sandi' : 'Sembunyikan kata sandi'}>
            <Ionicons name={hide ? 'eye-outline' : 'eye-off-outline'} size={20} color={c.mute} />
          </Pressable>
        )}
      </View>
      {!!error && <Text style={s.msg}>{error}</Text>}
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { marginTop: 18 },
  label: { color: c.text, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    height: 48, borderRadius: 12, backgroundColor: c.card, paddingHorizontal: 14,
    color: c.text, fontSize: 14, borderWidth: 1, borderColor: 'transparent',
  },
  focus: { borderColor: c.green },
  err: { borderColor: c.red },
  eye: { position: 'absolute', right: 0, top: 0, width: 46, height: 48, alignItems: 'center', justifyContent: 'center' },
  msg: { color: c.red, fontSize: 12, marginTop: 6 },
});
