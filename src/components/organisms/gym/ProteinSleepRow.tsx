import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CircularProgress } from '@/src/components/atoms/CircularProgress';
import { SectionHeader } from '@/src/components/molecules/SectionHeader';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
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
    <View>
      <SectionHeader title="Recovery" />
      <View style={styles.row}>
        <View
          style={[
            styles.card,
            styles.center,
            protein >= proteinTarget * 0.8 ? styles.cardProteinGood : styles.cardProteinOpen,
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.label}>PROTEIN</Text>
            <View style={[styles.iconChip, { backgroundColor: `${colors.warning}18` }]}>
              <Ionicons name="restaurant-outline" size={15} color={colors.warning} />
            </View>
          </View>
          <CircularProgress
            value={protein}
            max={proteinTarget}
            size={64}
            color={colors.warning}
            unit={`of ${proteinTarget}g`}
          />
        </View>

        <View style={[styles.card, sleep ? styles.cardSleepLogged : undefined]}>
          <View style={styles.cardHeader}>
            <Text style={styles.label}>SLEEP</Text>
            <View style={[styles.iconChip, { backgroundColor: `${colors.purple}18` }]}>
              <Ionicons name="moon-outline" size={15} color={colors.purple} />
            </View>
          </View>
          <Text style={styles.sleepValue}>{sleepDisplay}</Text>
          <Text style={styles.bedtime}>Bed: {bedLabel}</Text>
          {lateBy > 0 ? (
            <Text style={styles.late}>{lateBy} min past target</Text>
          ) : (
            <Text style={styles.onTarget}>
              {sleep ? 'On target' : 'No sleep logged'}
            </Text>
          )}
        </View>
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
    marginBottom: spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardProteinOpen: {
    borderColor: `${colors.warning}33`,
  },
  cardProteinGood: {
    borderColor: `${colors.success}55`,
  },
  cardSleepLogged: {
    borderColor: `${colors.purple}55`,
  },
  center: {
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cardHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconChip: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  sleepValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  bedtime: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 3,
  },
  late: {
    fontSize: 11,
    color: colors.danger,
    marginTop: 2,
  },
  onTarget: {
    fontSize: 11,
    color: colors.success,
    marginTop: 2,
    fontWeight: '600',
  },
});
