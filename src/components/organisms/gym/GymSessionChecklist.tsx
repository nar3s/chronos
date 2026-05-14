import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ExerciseCheckRow } from '@/src/components/molecules/ExerciseCheckRow';
import { Badge } from '@/src/components/atoms/Badge';
import { useGymStore } from '@/src/store/gymStore';
import { colors } from '@/src/theme/colors';
import type { WorkoutSession } from '@/src/domain/types/gym';
import { pplLabel } from '@/src/utils/formatters';

interface Props {
  session: WorkoutSession;
  dateLabel?: string;
  onToggle: (sessionId: string, exerciseName: string) => void;
}

export function GymSessionChecklist({ session, dateLabel, onToggle }: Props) {
  const allSessions = useGymStore((s) => s.sessions);

  const doneCount = session.exercises.filter((e) => e.done).length;
  const total = session.exercises.length;
  const allDone = doneCount === total && total > 0;

  // For each exercise, find the most recent past session that has a weight logged
  const pastSessions = allSessions
    .filter((s) => s.date < session.date)
    .sort((a, b) => b.date.localeCompare(a.date));

  function getLastWeight(exerciseName: string): number | undefined {
    for (const s of pastSessions) {
      const ex = s.exercises.find((e) => e.name === exerciseName && e.weightKg);
      if (ex?.weightKg) return ex.weightKg;
    }
    return undefined;
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>{dateLabel ?? "TODAY'S SESSION"}</Text>
          <Text style={styles.title}>{pplLabel(session.type)}</Text>
        </View>
        <Badge
          label={allDone ? 'Complete' : doneCount > 0 ? 'In Progress' : 'Upcoming'}
          preset={allDone ? 'success' : doneCount > 0 ? 'warning' : 'muted'}
        />
      </View>
      {session.exercises.map((ex, i) => (
        <ExerciseCheckRow
          key={ex.name}
          name={ex.name}
          sets={ex.sets}
          reps={ex.reps}
          weightKg={ex.weightKg}
          lastWeightKg={getLastWeight(ex.name)}
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
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 4,
  },
});
