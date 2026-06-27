import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from '@/src/components/atoms/ProgressBar';
import { minutesToHHMM } from '@/src/utils/formatters';
import { STUDY_DAILY_TARGET_MIN } from '@/src/domain/constants/dashboard';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import type { ExamCheckpoint } from '@/src/domain/types/study';

interface Props {
  todayMinutes: number;
  sessionCount: number;
  streak: number;
  checkpoint: ExamCheckpoint | null;
  daysUntilExam: number | null;
  isSkipped: boolean;
  onToggleSkip: () => void;
}

function formatExamDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function StudyHeroCard({
  todayMinutes,
  sessionCount,
  streak,
  checkpoint,
  daysUntilExam,
  isSkipped,
  onToggleSkip,
}: Props) {
  const hasStudyToday = todayMinutes > 0;
  const canSkip = !hasStudyToday;

  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = 0.7;
    scale.value = withSpring(1, { damping: 9, stiffness: 140, mass: 0.5 });
  }, [streak, scale]);
  const streakAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const progress = Math.min(1, todayMinutes / STUDY_DAILY_TARGET_MIN);
  const sessionLine =
    sessionCount === 0
      ? isSkipped
        ? 'Marked as skipped'
        : 'No sessions logged yet'
      : `${sessionCount} session${sessionCount > 1 ? 's' : ''} today`;

  const streakSubtitle =
    streak === 0 ? 'start today' : streak < 3 ? `day ${streak}` : 'day streak';

  return (
    <LinearGradient
      colors={['#1a1f2e', '#15171f', '#101218']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <Text style={styles.label}>STUDY TRACKER</Text>

      <View style={styles.headRow}>
        <View style={styles.headLeft}>
          <Text style={styles.bigTime}>{minutesToHHMM(todayMinutes)}</Text>
          <Text style={styles.sessionLine}>{sessionLine}</Text>
        </View>
        <View style={styles.streakBox}>
          <Animated.Text style={[styles.streakNum, streakAnim]}>
            {streak}
          </Animated.Text>
          <Text style={styles.streakLabel}>{streakSubtitle}</Text>
        </View>
      </View>

      <View style={styles.progressWrap}>
        <ProgressBar
          value={progress}
          max={1}
          color={isSkipped ? colors.textMuted : colors.accent}
          height={5}
        />
      </View>
      <Text style={styles.progressMeta}>
        {isSkipped
          ? 'Skipped - daily target paused'
          : `${minutesToHHMM(todayMinutes)} / ${minutesToHHMM(STUDY_DAILY_TARGET_MIN)} daily target`}
      </Text>

      {checkpoint && daysUntilExam !== null ? (
        <>
          <View style={styles.divider} />
          <View style={styles.examRow}>
            <View style={styles.examLeft}>
              <Text style={styles.examLabel}>UPCOMING EXAM</Text>
              <Text style={styles.examName}>{checkpoint.name}</Text>
              <Text style={styles.examDate}>{formatExamDate(checkpoint.date)}</Text>
            </View>
            <View style={styles.examRight}>
              <Text style={styles.examDays}>{daysUntilExam}</Text>
              <Text style={styles.examDaysLabel}>DAYS LEFT</Text>
            </View>
          </View>
        </>
      ) : null}

      {canSkip || isSkipped ? (
        <TouchableOpacity
          style={[styles.skipBtn, isSkipped && styles.skipBtnActive]}
          onPress={onToggleSkip}
          activeOpacity={0.75}
        >
          <Ionicons
            name={isSkipped ? 'close-circle' : 'remove-circle-outline'}
            size={15}
            color={isSkipped ? colors.warning : colors.textSecondary}
          />
          <Text
            style={[styles.skipText, isSkipped && styles.skipTextActive]}
          >
            {isSkipped
              ? 'Skipped today - tap to undo'
              : 'Mark today as skipped'}
          </Text>
        </TouchableOpacity>
      ) : null}
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
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headLeft: {
    flex: 1,
  },
  bigTime: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.accent,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1.2,
    lineHeight: 44,
  },
  sessionLine: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  streakBox: {
    alignItems: 'center',
    paddingLeft: spacing.md,
    minWidth: 64,
  },
  streakNum: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.success,
    fontVariant: ['tabular-nums'],
    lineHeight: 38,
  },
  streakLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  progressWrap: {
    marginBottom: 6,
  },
  progressMeta: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.6,
    marginVertical: spacing.base,
  },
  examRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  examLeft: {
    flex: 1,
    paddingRight: spacing.md,
  },
  examLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  examName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  examDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  examRight: {
    alignItems: 'center',
    minWidth: 64,
  },
  examDays: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.accent,
    fontVariant: ['tabular-nums'],
    lineHeight: 34,
  },
  examDaysLabel: {
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 0.4,
    fontWeight: '600',
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.base,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  skipBtnActive: {
    borderColor: `${colors.warning}60`,
    backgroundColor: `${colors.warning}1A`,
  },
  skipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.1,
  },
  skipTextActive: {
    color: colors.warning,
  },
});
