import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

interface Props {
  visible: boolean;
  onClose(): void;
  onSave(emoji: string, label: string): void;
}

export function AddHabitSheet({ visible, onClose, onSave }: Props) {
  const [emoji, setEmoji] = useState('');
  const [label, setLabel] = useState('');

  function handleSave() {
    const e = emoji.trim() || '✅';
    const l = label.trim();
    if (l.length < 2) return;
    onSave(e, l);
    setEmoji('');
    setLabel('');
    onClose();
  }

  function handleClose() {
    setEmoji('');
    setLabel('');
    onClose();
  }

  const canSave = label.trim().length >= 2;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.wrapper}
      >
        <View style={styles.sheet}>
          <Text style={styles.title}>Add Habit</Text>

          <Text style={styles.fieldLabel}>Emoji</Text>
          <TextInput
            style={styles.emojiInput}
            value={emoji}
            onChangeText={setEmoji}
            placeholder="🎯"
            placeholderTextColor={colors.textMuted}
            maxLength={2}
            autoFocus
          />

          <Text style={styles.fieldLabel}>Label</Text>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder="e.g. Cold Shower"
            placeholderTextColor={colors.textMuted}
            maxLength={40}
            autoCapitalize="words"
          />

          <TouchableOpacity
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnText}>Add Habit</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  wrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.base,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  emojiInput: {
    backgroundColor: colors.cardElevated,
    borderRadius: 12,
    padding: spacing.base,
    fontSize: 28,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    width: 72,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.cardElevated,
    borderRadius: 12,
    padding: spacing.base,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
