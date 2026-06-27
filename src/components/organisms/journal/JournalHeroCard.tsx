import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { formatDisplayDate, getToday } from '@/src/utils/dates';
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
  selectedDate: string;
  entry: DiaryEntry | null;
  taskCount: number;
  isBookmarked: boolean;
  onStarPress: () => void;
}

export function JournalHeroCard({
  selectedDate,
  entry,
  taskCount,
  isBookmarked,
  onStarPress,
}: Props) {
  const today = getToday();
  const isToday = selectedDate === today;

  const mood = entry?.mood;
  const writeLabel = entry
    ? isToday
      ? 'Edit entry'
      : 'Edit entry'
    : isToday
      ? 'Write today'
      : 'Write entry';

  const promptLabel = (() => {
    if (entry) return 'Captured';
    if (isToday) return 'How was today?';
    return 'No entry yet';
  })();

  return (
    <LinearGradient
      colors={['#1a1f2e', '#15171f', '#101218']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <Text style={styles.label}>JOURNAL</Text>
        <TouchableOpacity
          style={styles.bookmarkLink}
          onPress={() => router.push('/journal/bookmarks' as any)}
          activeOpacity={0.7}
          hitSlop={6}
        >
          <Text style={styles.bookmarkLinkText}>All bookmarks</Text>
          <Ionicons
            name="chevron-forward"
            size={12}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.date}>{formatDisplayDate(selectedDate)}</Text>
      <Text style={styles.prompt}>{promptLabel}</Text>

      {mood ? (
        <View
          style={[
            styles.moodChip,
            { backgroundColor: `${MOOD_COLORS[mood]}1F`, borderColor: `${MOOD_COLORS[mood]}55` },
          ]}
        >
          <View
            style={[styles.moodDot, { backgroundColor: MOOD_COLORS[mood] }]}
          />
          <Text style={[styles.moodText, { color: MOOD_COLORS[mood] }]}>
            Mood: {MOOD_LABELS[mood]}
          </Text>
        </View>
      ) : null}

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{entry ? 1 : 0}</Text>
          <Text style={styles.statLabel}>ENTRY</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{taskCount}</Text>
          <Text style={styles.statLabel}>TASKS</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.writeBtn}
          onPress={() =>
            router.push(`/modals/log-diary?date=${selectedDate}` as any)
          }
          activeOpacity={0.85}
        >
          <Ionicons
            name={entry ? 'create-outline' : 'add'}
            size={15}
            color="#fff"
          />
          <Text style={styles.writeBtnText}>{writeLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.starBtn, isBookmarked && styles.starBtnActive]}
          onPress={onStarPress}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isBookmarked ? 'star' : 'star-outline'}
            size={18}
            color={isBookmarked ? colors.warning : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: `${colors.accent}1A`,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  bookmarkLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  bookmarkLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  date: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.4,
    lineHeight: 26,
  },
  prompt: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: spacing.md,
  },
  moodChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  moodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moodText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 9,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    lineHeight: 21,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  writeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
  },
  writeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  starBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  starBtnActive: {
    borderColor: `${colors.warning}55`,
    backgroundColor: `${colors.warning}1A`,
  },
});
