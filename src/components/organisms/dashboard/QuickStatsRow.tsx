import { StatCard } from '@/src/components/molecules/StatCard';
import {
  SLEEP_TARGET_MIN,
  STUDY_DAILY_TARGET_MIN,
} from '@/src/domain/constants/dashboard';
import type { NutritionLog, SleepLog } from '@/src/domain/types/gym';
import { colors } from '@/src/theme/colors';
import {
  formatBedtime,
  formatProtein,
  minutesToHHMM,
} from '@/src/utils/formatters';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const CELL_HEIGHT = 130;

interface Props {
  nutrition: NutritionLog | null;
  sleep: SleepLog | null;
  studyMinutes: number;
  studyYesterdayMinutes: number;
  habitsDoneToday: number;
  habitsDoneYesterday: number;
  totalHabits: number;
  proteinYesterdayGrams: number;
  sleepYesterdayMinutes: number;
}

type Delta = { direction: 'up' | 'down' | 'flat'; label: string };

function minutesDelta(today: number, yesterday: number, unit = 'm'): Delta | undefined {
  if (yesterday === 0 && today === 0) return undefined;
  const diff = today - yesterday;
  if (diff === 0) return { direction: 'flat', label: 'same as yesterday' };
  const abs = Math.abs(diff);
  const label =
    unit === 'm' && abs >= 60
      ? `${minutesToHHMM(abs)} vs yesterday`
      : `${abs}${unit} vs yesterday`;
  return { direction: diff > 0 ? 'up' : 'down', label };
}

export function QuickStatsRow({
  nutrition,
  sleep,
  studyMinutes,
  studyYesterdayMinutes,
  habitsDoneToday,
  habitsDoneYesterday,
  totalHabits,
  proteinYesterdayGrams,
  sleepYesterdayMinutes,
}: Props) {
  const proteinToday = nutrition?.proteinGrams ?? 0;

  const sleepToday = sleep?.durationMinutes ?? 0;

  const proteinValue = nutrition ? formatProtein(nutrition.proteinGrams) : '--';
  const proteinUnit = nutrition ? `of ${nutrition.targetGrams}g` : '';

  const sleepValue = sleep ? minutesToHHMM(sleep.durationMinutes) : '--';
  const sleepUnit = sleep
    ? `${formatBedtime(sleep.bedtime)} / ${formatBedtime(sleep.wakeTime)}`
    : '';

  const studyValue = minutesToHHMM(studyMinutes);

  const studyProgress = studyMinutes / STUDY_DAILY_TARGET_MIN;
  const habitsProgress = totalHabits > 0 ? habitsDoneToday / totalHabits : undefined;
  const proteinProgress =
    nutrition && nutrition.targetGrams > 0
      ? nutrition.proteinGrams / nutrition.targetGrams
      : undefined;
  const sleepProgress = sleep ? sleep.durationMinutes / SLEEP_TARGET_MIN : undefined;

  const studyDelta = minutesDelta(studyMinutes, studyYesterdayMinutes);
  const proteinDelta =
    nutrition || proteinYesterdayGrams > 0
      ? (() => {
          const diff = proteinToday - proteinYesterdayGrams;
          if (diff === 0 && proteinToday === 0) return undefined;
          if (diff === 0) return { direction: 'flat' as const, label: 'same as yesterday' };
          return {
            direction: diff > 0 ? ('up' as const) : ('down' as const),
            label: `${Math.abs(Math.round(diff))}g vs yesterday`,
          };
        })()
      : undefined;
  const sleepDelta = minutesDelta(sleepToday, sleepYesterdayMinutes);
  const habitsDelta =
    totalHabits > 0 && (habitsDoneToday > 0 || habitsDoneYesterday > 0)
      ? (() => {
          const diff = habitsDoneToday - habitsDoneYesterday;
          if (diff === 0) return { direction: 'flat' as const, label: 'same as yesterday' };
          return {
            direction: diff > 0 ? ('up' as const) : ('down' as const),
            label: `${Math.abs(diff)} vs yesterday`,
          };
        })()
      : undefined;

  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <View style={styles.cell}>
          <StatCard
            label="STUDY"
            value={studyValue}
            unit="today"
            valueColor={colors.accent}
            progress={studyProgress}
            delta={studyDelta}
            onPress={() => router.push('/(tabs)/study' as any)}
            style={styles.card}
          />
        </View>
        <View style={styles.cell}>
          <StatCard
            label="HABITS"
            value={totalHabits > 0 ? `${habitsDoneToday}/${totalHabits}` : '--'}
            unit="today"
            valueColor={
              totalHabits > 0 && habitsDoneToday === totalHabits
                ? colors.success
                : colors.textPrimary
            }
            progress={habitsProgress}
            progressColor={
              totalHabits > 0 && habitsDoneToday === totalHabits
                ? colors.success
                : colors.accent
            }
            delta={habitsDelta}
            onPress={() => router.push('/more/habits' as any)}
            style={styles.card}
          />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.cell}>
          <StatCard
            label="PROTEIN"
            value={proteinValue}
            unit={proteinUnit}
            valueColor={colors.warning}
            progress={proteinProgress}
            delta={proteinDelta}
            emptyActionLabel="Log protein"
            onPress={() => router.push('/modals/log-workout' as any)}
            style={styles.card}
          />
        </View>
        <View style={styles.cell}>
          <StatCard
            label="SLEEP"
            value={sleepValue}
            unit={sleepUnit}
            progress={sleepProgress}
            delta={sleepDelta}
            emptyActionLabel="Log sleep"
            onPress={() => router.push('/modals/log-workout' as any)}
            style={styles.card}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    minHeight: CELL_HEIGHT,
  },
  cell: {
    flex: 1,
  },
  card: {
    flex: 1,
  },
});
