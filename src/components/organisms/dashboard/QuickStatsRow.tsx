import { StatCard } from "@/src/components/molecules/StatCard";
import type { NutritionLog, SleepLog } from "@/src/domain/types/gym";
import { useHabitStore } from "@/src/store/habitStore";
import { colors } from "@/src/theme/colors";
import { getToday } from "@/src/utils/dates";
import { formatProtein, minutesToHHMM } from "@/src/utils/formatters";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

const CELL_HEIGHT = 88;

interface Props {
  nutrition: NutritionLog | null;
  sleep: SleepLog | null;
  studyMinutes: number;
}

export function QuickStatsRow({ nutrition, sleep, studyMinutes }: Props) {
  const habits = useHabitStore((s) => s.habits);
  const allLogs = useHabitStore((s) => s.logs);
  const today = getToday();
  const done = allLogs.filter((l) => l.date === today).length;
  const total = habits.length;

  const proteinValue = nutrition ? formatProtein(nutrition.proteinGrams) : "--";
  const proteinUnit = nutrition ? `of ${nutrition.targetGrams}g` : "";

  const sleepValue = sleep ? minutesToHHMM(sleep.durationMinutes) : "--";
  const sleepUnit = sleep
    ? `${formatBed(sleep.bedtime)} → ${formatWake(sleep.wakeTime)}`
    : "";

  const studyValue = minutesToHHMM(studyMinutes);

  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <View style={styles.cell}>
          <StatCard
            label="STUDY"
            value={studyValue}
            unit="today"
            valueColor={colors.accent}
            style={styles.card}
          />
        </View>
        <TouchableOpacity
          style={styles.cell}
          onPress={() => router.push("/more/habits" as any)}
          activeOpacity={0.75}
        >
          <StatCard
            label="HABITS"
            value={total > 0 ? `${done}/${total}` : "--"}
            unit="today"
            valueColor={
              total > 0 && done === total ? colors.success : colors.textPrimary
            }
            style={styles.card}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <View style={styles.cell}>
          <StatCard
            label="PROTEIN"
            value={proteinValue}
            unit={proteinUnit}
            valueColor={colors.warning}
            style={styles.card}
          />
        </View>
        <View style={styles.cell}>
          <StatCard
            label="SLEEP"
            value={sleepValue}
            unit={sleepUnit}
            style={styles.card}
          />
        </View>
      </View>
    </View>
  );
}

function formatBed(t: string): string {
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

function formatWake(t: string): string {
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m}`;
}

const styles = StyleSheet.create({
  grid: {
    gap: 10,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    height: CELL_HEIGHT,
  },
  cell: {
    flex: 1,
  },
  card: {
    flex: 1,
  },
});
