import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet } from 'react-native';
import { c, PAD } from '../theme';

// Pembungkus layar: padding atas aman, scroll, dan menghindari keyboard.
export default function Screen({ children, top = 40, contentStyle }) {
  const inset = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;
  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.content, { paddingTop: inset + top }, contentStyle]}>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: c.bg },
  content: { flexGrow: 1, paddingHorizontal: PAD, paddingBottom: 32 },
});
