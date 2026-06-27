import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SparkLine } from '@/src/components/atoms/SparkLine';
import { ProgressBar } from '@/src/components/atoms/ProgressBar';
import { formatWeight, pplLabel, pplSubtitle } from '@/src/utils/formatters';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import type {
  BodyWeightEntry,
  PPLDay,
  WorkoutSession,
} from '@/src/domain/types/gym';

interface Props {
  pplDay: PPLDay;
  session: WorkoutSession | null;
  streak: number;
  latestWeight: BodyWeightEntry | null;
  weightTrend: number[];
  isToday: boolean;
  isSkipped: boolean;
  onToggleSkip: () => void;
}

export function GymHeroCard({
  pplDay,
  session,
  streak,
  latestWeight,
  weightTrend,
  isToday,
  isSkipped,
  onToggleSkip,
}: Props) {
  const isRest = pplDay === 'rest';
  const skippedToday = isToday && isSkipped;
  const doneCount = session ? session.exercises.filter((e) => e.done).length : 0;
  const total = session ? session.exercises.length : 0;
  const allDone = total > 0 && doneCount === total;
  const progress = total > 0 ? doneCount / total : 0;
  const canSkip = isToday && !isRest && !allDone;

  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = 0.7;
    scale.value = withSpring(1, { damping: 9, stiffness: 140, mass: 0.5 });
  }, [streak, scale]);
  const streakAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const sessionLine = (() => {
    if (isRest) return 'Active recovery - no session today';
    if (skippedToday) return 'Marked as skipped';
    if (!session) return 'No session yet';
    if (allDone) return 'Session complete';
    if (doneCount === 0) return `${total} exercise${total === 1 ? '' : 's'} planned`;
    return `${doneCount} of ${total} done`;
  })();

  const streakSubtitle =
    streak === 0 ? 'start today' : streak < 3 ? `day ${streak}` : 'day streak';

  const weightDelta =
    weightTrend.length >= 2
      ? weightTrend[weightTrend.length - 1] - weightTrend[0]
      : null;

  return (
    <LinearGradient
      colors={['#1a1f2e', '#15171f', '#101218']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <Text style={styles.label}>GYM TRACKER</Text>

      <View style={styles.headRow}>
        <View style={styles.headLeft}>
          <Text style={styles.title}>{pplLabel(pplDay)}</Text>
          <Text style={styles.subtitle}>{pplSubtitle(pplDay)}</Text>
        </View>
        <View style={styles.streakBox}>
          <Animated.Text style={[styles.streakNum, streakAnim]}>
            {streak}
          </Animated.Text>
          <Text style={styles.streakLabel}>{streakSubtitle}</Text>
        </View>
      </View>

      <Text style={styles.sessionLine}>{sessionLine}</Text>

      {!isRest && total > 0 ? (
        <View style={styles.progressWrap}>
          <ProgressBar
            value={progress}
            max={1}
            color={skippedToday ? colors.textMuted : allDone ? colors.success : colors.accent}
            height={5}
          />
        </View>
      ) : null}

      <View style={styles.divider} />

      <View style={styles.weightRow}>
        <View style={styles.weightLeft}>
          <Text style={styles.sectionLabel}>BODY WEIGHT</Text>
          <Text style={styles.weightValue}>
            {latestWeight ? formatWeight(latestWeight.weightKg) : '--'}
          </Text>
          {weightDelta !== null ? (
            <Text
              style={[
                styles.weightDelta,
                {
                  color:
                    weightDelta === 0
                      ? colors.textSecondary
                      : weightDelta > 0
                      ? colors.success
                      : colors.danger,
                },
              ]}
            >
              {weightDelta > 0 ? '+' : ''}
              {weightDelta.toFixed(1)} kg this week
            </Text>
          ) : (
            <Text style={styles.weightDeltaMuted}>
              Log weight to see trend
            </Text>
          )}
        </View>
        {weightTrend.length >= 2 ? (
          <SparkLine
            data={weightTrend}
            width={96}
            height={36}
            color={colors.accent}
          />
        ) : null}
      </View>

      {canSkip || skippedToday ? (
        <TouchableOpacity
          style={[styles.skipBtn, skippedToday && styles.skipBtnActive]}
          onPress={onToggleSkip}
          activeOpacity={0.75}
        >
          <Ionicons
            name={skippedToday ? 'close-circle' : 'remove-circle-outline'}
            size={15}
            color={skippedToday ? colors.warning : colors.textSecondary}
          />
          <Text style={[styles.skipText, skippedToday && styles.skipTextActive]}>
            {skippedToday
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
    marginBottom: spacing.sm,
  },
  headLeft: {
    flex: 1,
    paddingRight: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    letterSpacing: -0.1,
  },
  streakBox: {
    alignItems: 'center',
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
  sessionLine: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  progressWrap: {
    marginBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.6,
    marginVertical: spacing.base,
  },
  weightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weightLeft: {
    flex: 1,
    paddingRight: spacing.md,
  },
  sectionLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  weightValue: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  weightDelta: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  weightDeltaMuted: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
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
