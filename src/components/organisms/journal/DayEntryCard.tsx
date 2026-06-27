import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ConfirmationSheet } from '@/src/components/molecules/ConfirmationSheet';
import { SectionHeader } from '@/src/components/molecules/SectionHeader';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import type { DiaryEntry, MoodType } from '@/src/domain/types/diary';

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
  entry: DiaryEntry | null;
  onDelete: (id: string) => void;
}

function getHighlights(entry: any): string[] {
  if (entry?.highlights?.length) return entry.highlights;
  if (entry?.text) return [entry.text];
  return [];
}

export function DayEntryCard({ date, entry, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const highlights = getHighlights(entry);
  const takeaway: string = (entry as any)?.takeaway ?? '';
  const hasContent = !!entry && (highlights.length > 0 || takeaway || entry.mood);

  if (!hasContent) {
    return (
      <View>
        <SectionHeader title="Entry" />
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="journal-outline" size={18} color={colors.textSecondary} />
          </View>
          <View style={styles.emptyBody}>
            <Text style={styles.emptyTitle}>No diary entry</Text>
            <Text style={styles.emptyText}>
              Capture highlights, mood, or a takeaway for this day.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.emptyAction}
            onPress={() => router.push(`/modals/log-diary?date=${date}` as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color={colors.accent} />
          </TouchableOpacity>
        </View>
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
    onDelete(entry!.id);
    setShowDeleteConfirm(false);
    setOpen(false);
  }

  const mood = entry!.mood;

  return (
    <>
      <SectionHeader title="Entry" />
      <TouchableOpacity
        style={[
          styles.card,
          mood
            ? {
                borderColor: `${MOOD_COLORS[mood]}66`,
              }
            : undefined,
        ]}
        onPress={() => setOpen(true)}
        activeOpacity={0.75}
      >
        {mood ? (
          <View style={[styles.accentRail, { backgroundColor: MOOD_COLORS[mood] }]} />
        ) : null}
        <View style={styles.cardHeader}>
          {mood ? (
            <View
              style={[
                styles.moodChip,
                {
                  backgroundColor: `${MOOD_COLORS[mood]}22`,
                  borderColor: `${MOOD_COLORS[mood]}55`,
                },
              ]}
            >
              <View style={[styles.moodDot, { backgroundColor: MOOD_COLORS[mood] }]} />
              <Text style={[styles.moodLabel, { color: MOOD_COLORS[mood] }]}>
                {MOOD_LABELS[mood]}
              </Text>
            </View>
          ) : (
            <View />
          )}
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </View>

        {highlights.length > 0 ? (
          <View style={styles.previewRow}>
            <Ionicons name="document-text-outline" size={15} color={colors.textSecondary} />
            <Text style={styles.preview} numberOfLines={2}>
              {highlights[0]}
            </Text>
          </View>
        ) : null}

        {takeaway ? (
          <View style={styles.takeawayPreviewRow}>
            <View style={styles.takeawayDot} />
            <Text style={styles.takeawayPreview} numberOfLines={1}>
              Takeaway: {takeaway}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.dialog} onPress={() => {}}>
            <View style={styles.dialogHeader}>
              {mood ? (
                <View
                  style={[
                    styles.dialogMoodChip,
                    {
                      backgroundColor: `${MOOD_COLORS[mood]}22`,
                      borderColor: `${MOOD_COLORS[mood]}55`,
                    },
                  ]}
                >
                  <View style={[styles.moodDot, { backgroundColor: MOOD_COLORS[mood] }]} />
                  <Text style={[styles.moodLabel, { color: MOOD_COLORS[mood] }]}>
                    {MOOD_LABELS[mood]}
                  </Text>
                </View>
              ) : (
                <View />
              )}
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {highlights.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>What happened</Text>
                {highlights.map((h, i) => (
                  <View key={i} style={styles.highlightRow}>
                    <View style={styles.bullet} />
                    <Text style={styles.highlightText}>{h}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {takeaway ? (
              <View style={styles.takeawayBox}>
                <Text style={styles.takeawayLabel}>Key Takeaway</Text>
                <Text style={styles.takeawayText}>{takeaway}</Text>
              </View>
            ) : null}

            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.editBtn} onPress={handleEdit} activeOpacity={0.8}>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  emptyIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyBody: {
    flex: 1,
  },
  emptyAction: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.accent}14`,
    borderWidth: 1,
    borderColor: `${colors.accent}33`,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
  card: {
    position: 'relative',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.md,
    paddingLeft: spacing.md + 5,
    marginBottom: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accentRail: {
    position: 'absolute',
    left: 0,
    top: spacing.md,
    bottom: spacing.md,
    width: 3,
    borderRadius: 99,
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
    borderRadius: 999,
    gap: 6,
    borderWidth: 1,
  },
  dialogMoodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 6,
    borderWidth: 1,
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
  preview: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 21,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  takeawayPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderRadius: 9,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },
  takeawayDot: {
    width: 5,
    height: 5,
    borderRadius: 99,
    backgroundColor: colors.accent,
  },
  takeawayPreview: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
  },
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
    borderWidth: 1,
    borderColor: colors.border,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    borderRadius: 10,
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
    backgroundColor: `${colors.accent}18`,
    borderWidth: 1,
    borderColor: `${colors.accent}44`,
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
    backgroundColor: `${colors.danger}18`,
    borderWidth: 1,
    borderColor: `${colors.danger}44`,
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.danger,
  },
});
