import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { c } from '../theme';

// Bottom sheet modal (desain 04c / 04d): overlay gelap + panel membulat + handle
export default function BottomSheet({ visible, onClose, children }) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={s.overlay} onPress={onClose} accessibilityLabel="Tutup" />
        <View style={s.sheet}>
          <View style={s.handle} />
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const s = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  overlay: { flex: 1 },
  sheet: { backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 25, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 34 : 24, maxHeight: '85%' },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: c.line, marginBottom: 20 },
});
