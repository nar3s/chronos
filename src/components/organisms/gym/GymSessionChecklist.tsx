import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExerciseCheckRow } from '@/src/components/molecules/ExerciseCheckRow';
import { Badge } from '@/src/components/atoms/Badge';
import { ProgressBar } from '@/src/components/atoms/ProgressBar';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import type { WorkoutSession } from '@/src/domain/types/gym';
import { pplLabel } from '@/src/utils/formatters';

interface Props {
  session: WorkoutSession;
  dateLabel?: string;
  lastWeightsByExercise?: Record<string, number>;
  onToggle: (sessionId: string, exerciseName: string) => void;
}

export function GymSessionChecklist({
  session,
  dateLabel,
  lastWeightsByExercise = {},
  onToggle,
}: Props) {
  const doneCount = session.exercises.filter((e) => e.done).length;
  const total = session.exercises.length;
  const allDone = doneCount === total && total > 0;
  const progress = total > 0 ? doneCount / total : 0;

  return (
    <View
      style={[
        styles.card,
        allDone
          ? styles.cardComplete
          : doneCount > 0
            ? styles.cardActive
            : undefined,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <View
            style={[
              styles.iconChip,
              { backgroundColor: `${allDone ? colors.success : colors.accent}18` },
            ]}
          >
            <Ionicons
              name={allDone ? 'checkmark-done-outline' : 'barbell-outline'}
              size={17}
              color={allDone ? colors.success : colors.accent}
            />
          </View>
          <View>
          <Text style={styles.label}>{dateLabel ?? "TODAY'S SESSION"}</Text>
          <Text style={styles.title}>{pplLabel(session.type)}</Text>
          </View>
        </View>
        <Badge
          label={allDone ? 'Complete' : doneCount > 0 ? 'In Progress' : 'Upcoming'}
          preset={allDone ? 'success' : doneCount > 0 ? 'warning' : 'muted'}
        />
      </View>
      <ProgressBar
        value={progress}
        max={1}
        color={allDone ? colors.success : colors.accent}
        height={5}
      />
      <Text style={styles.progressMeta}>
        {doneCount} / {total} exercises complete
      </Text>
      {session.exercises.map((ex, i) => (
        <ExerciseCheckRow
          key={ex.name}
          name={ex.name}
          sets={ex.sets}
          reps={ex.reps}
          weightKg={ex.weightKg}
          lastWeightKg={lastWeightsByExercise[ex.name]}
          done={ex.done}
          onToggle={() => onToggle(session.id, ex.name)}
          isFirst={i === 0}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardActive: {
    borderColor: `${colors.accent}55`,
  },
  cardComplete: {
    borderColor: `${colors.success}66`,
    backgroundColor: `${colors.success}0D`,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titleGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconChip: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
    letterSpacing: -0.2,
  },
  progressMeta: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    marginTop: 6,
    marginBottom: spacing.xs,
  },
});
