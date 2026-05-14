import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useDiaryStore } from '@/src/store/diaryStore';
import { ConfirmationSheet } from '@/src/components/molecules/ConfirmationSheet';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import type { MoodType } from '@/src/domain/types/diary';

const MOOD_COLORS: Record<MoodType, string> = {
  great: colors.success,
  good: colors.accent,
  okay: colors.warning,
  rough: colors.danger,
};

const MOOD_LABELS: Record<MoodType, string> = {
  great: 'Great',
  good: 'Good',
  okay: 'Okay',
  rough: 'Rough',
};

interface Props {
  date: string;
}

function getHighlights(entry: any): string[] {
  if (entry?.highlights?.length) return entry.highlights;
  if (entry?.text) return [entry.text];
  return [];
}

export function DayEntryCard({ date }: Props) {
  const entry = useDiaryStore((s) => s.entries.find((e) => e.date === date));
  const removeEntry = useDiaryStore((s) => s.removeEntry);
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const highlights = getHighlights(entry);
  const takeaway: string = (entry as any)?.takeaway ?? '';
  const hasContent = !!entry && (highlights.length > 0 || takeaway || entry.mood);

  if (!hasContent) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No diary entry for this day</Text>
      </View>
    );
  }

  function handleEdit() {
    setOpen(false);
    router.push(`/modals/log-diary?date=${date}` as any);
  }

  function handleDelete() {
    setShowDeleteConfirm(true);
  }

  function handleConfirmDelete() {
    removeEntry(entry!.id);
    setShowDeleteConfirm(false);
    setOpen(false);
  }

  return (
    <>
      <TouchableOpacity style={styles.card} onPress={() => setOpen(true)} activeOpacity={0.75}>
        <View style={styles.cardHeader}>
          {entry!.mood ? (
            <View
              style={[styles.moodChip, { backgroundColor: MOOD_COLORS[entry!.mood] + '22' }]}
            >
              <View style={[styles.moodDot, { backgroundColor: MOOD_COLORS[entry!.mood] }]} />
              <Text style={[styles.moodLabel, { color: MOOD_COLORS[entry!.mood] }]}>
                {MOOD_LABELS[entry!.mood]}
              </Text>
            </View>
          ) : (
            <View />
          )}
          <Text style={styles.chevron}>›</Text>
        </View>

        {highlights.length > 0 && (
          <Text style={styles.preview} numberOfLines={2}>
            {highlights[0]}
          </Text>
        )}

        {takeaway ? (
          <Text style={styles.takeawayPreview} numberOfLines={1}>
            Takeaway: {takeaway}
          </Text>
        ) : null}
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.dialog} onPress={() => {}}>
            <View style={styles.dialogHeader}>
              {entry!.mood ? (
                <View
                  style={[
                    styles.dialogMoodChip,
                    { backgroundColor: MOOD_COLORS[entry!.mood] + '22' },
                  ]}
                >
                  <View
                    style={[styles.moodDot, { backgroundColor: MOOD_COLORS[entry!.mood] }]}
                  />
                  <Text style={[styles.moodLabel, { color: MOOD_COLORS[entry!.mood] }]}>
                    {MOOD_LABELS[entry!.mood]}
                  </Text>
                </View>
              ) : (
                <View />
              )}
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={10}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {highlights.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>What happened</Text>
                {highlights.map((h, i) => (
                  <View key={i} style={styles.highlightRow}>
                    <View style={styles.bullet} />
                    <Text style={styles.highlightText}>{h}</Text>
                  </View>
                ))}
              </View>
            )}

            {takeaway ? (
              <View style={styles.takeawayBox}>
                <Text style={styles.takeawayLabel}>Key Takeaway</Text>
                <Text style={styles.takeawayText}>{takeaway}</Text>
              </View>
            ) : null}

            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={handleEdit}
                activeOpacity={0.8}
              >
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={handleDelete}
                activeOpacity={0.8}
              >
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <ConfirmationSheet
        visible={showDeleteConfirm}
        title="Delete Entry?"
        message="Remove this diary entry permanently."
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  empty: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.base,
    marginBottom: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.base,
    marginBottom: 12,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  dialogMoodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  moodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 20,
    color: colors.textMuted,
  },
  preview: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 21,
  },
  takeawayPreview: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },

  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  dialog: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
    width: '100%',
    gap: spacing.md,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    fontSize: 16,
    color: colors.textMuted,
  },
  section: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: 7,
    flexShrink: 0,
  },
  highlightText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  takeawayBox: {
    backgroundColor: colors.cardElevated,
    borderRadius: 8,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    gap: 4,
  },
  takeawayLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  takeawayText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 21,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  editBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.accent + '18',
    borderWidth: 1,
    borderColor: colors.accent + '44',
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.danger + '18',
    borderWidth: 1,
    borderColor: colors.danger + '44',
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.danger,
  },
});
