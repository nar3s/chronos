import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSnapshotStore } from '@/src/store/snapshotStore';
import { getToday } from '@/src/utils/dates';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export function IntentionCard() {
  const snapshot = useSnapshotStore();
  const todaySnap = snapshot.getTodaySnapshot();
  const intention = todaySnap?.intention ?? '';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  function openEdit() {
    setDraft(intention);
    setEditing(true);
  }

  function handleSave() {
    snapshot.updateSnapshot(getToday(), { intention: draft.trim() });
    setEditing(false);
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.card, intention ? styles.cardFilled : styles.cardEmpty]}
        onPress={openEdit}
        activeOpacity={0.75}
      >
        {intention ? (
          <>
            <Text style={styles.label}>Today's Intention</Text>
            <Text style={styles.intentionText}>{intention}</Text>
            <Text style={styles.editHint}>tap to edit</Text>
          </>
        ) : (
          <>
            <Text style={styles.emptyTitle}>Set today's intention →</Text>
            <Text style={styles.emptyHint}>What do you want to focus on today?</Text>
          </>
        )}
      </TouchableOpacity>

      <Modal visible={editing} transparent animationType="slide">
        <Pressable style={styles.backdrop} onPress={() => setEditing(false)} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetWrapper}
        >
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Today's Intention</Text>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="What do you want to focus on today?"
              placeholderTextColor={colors.textMuted}
              autoFocus
              multiline
              maxLength={200}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{draft.length}/200</Text>
            <TouchableOpacity
              style={[styles.saveBtn, !draft.trim() && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!draft.trim()}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: spacing.base,
    marginBottom: spacing.sm,
  },
  cardEmpty: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  cardFilled: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: `${colors.accent}40`,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  intentionText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
    lineHeight: 22,
  },
  editHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  emptyHint: {
    fontSize: 12,
    color: colors.textMuted,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheetWrapper: {
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
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.base,
  },
  input: {
    backgroundColor: colors.cardElevated,
    borderRadius: 12,
    padding: spacing.base,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
  },
  charCount: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: spacing.base,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
