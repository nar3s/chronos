import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CircularProgress } from '@/src/components/atoms/CircularProgress';
import { colors } from '@/src/theme/colors';
import { minutesToHHMM } from '@/src/utils/formatters';
import type { NutritionLog, SleepLog } from '@/src/domain/types/gym';

interface Props {
  nutrition: NutritionLog | null;
  sleep: SleepLog | null;
}

export function ProteinSleepRow({ nutrition, sleep }: Props) {
  const protein = nutrition?.proteinGrams ?? 0;
  const proteinTarget = nutrition?.targetGrams ?? 160;

  const sleepDisplay = sleep ? minutesToHHMM(sleep.durationMinutes) : '--';
  const bedLabel = sleep ? formatTime(sleep.bedtime) : '--';
  const lateBy = sleep ? getOverMinutes(sleep.bedtime, '23:45') : 0;

  return (
    <View style={styles.row}>
      <View style={[styles.card, styles.center]}>
        <Text style={styles.label}>PROTEIN</Text>
        <CircularProgress
          value={protein}
          max={proteinTarget}
          size={80}
          color={colors.warning}
          unit={`of ${proteinTarget}g`}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>SLEEP</Text>
        <Text style={styles.sleepValue}>{sleepDisplay}</Text>
        <Text style={styles.bedtime}>Bed: {bedLabel}</Text>
        {lateBy > 0 ? (
          <Text style={styles.late}>{lateBy} min past target</Text>
        ) : null}
      </View>
    </View>
  );
}

function formatTime(t: string): string {
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function getOverMinutes(bedtime: string, target: string): number {
  const toMins = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h < 5 ? h * 60 + m + 24 * 60 : h * 60 + m;
  };
  const diff = toMins(bedtime) - toMins(target);
  return Math.max(0, diff);
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
  },
  center: {
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  sleepValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  bedtime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  late: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 2,
  },
});
