import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProgressBar } from '@/src/components/atoms/ProgressBar';
import { ScreenTemplate } from '@/src/components/templates/ScreenTemplate';
import { ScreenHeader } from '@/src/components/molecules/ScreenHeader';
import { HabitListItem } from '@/src/components/organisms/habits/HabitListItem';
import { AddHabitSheet } from '@/src/components/organisms/habits/AddHabitSheet';
import { HabitsHeatmap } from '@/src/components/organisms/habits/HabitsHeatmap';
import { HabitStatsRow } from '@/src/components/organisms/habits/HabitStatsRow';
import { HabitDayDetailSheet } from '@/src/components/organisms/habits/HabitDayDetailSheet';
import { useHabits } from '@/src/hooks/useHabits';
import { useHabitStats, getHabitDayDetail, type HabitDayDetail } from '@/src/hooks/useHabitStats';
import { useHabitStore } from '@/src/store/habitStore';
import { getToday } from '@/src/utils/dates';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export function HabitsScreen() {
  const { habits, todayDone, todayTotal, toggleHabit, addHabit, removeHabit } = useHabits();
  const stats = useHabitStats();
  const statById = React.useMemo(
    () => Object.fromEntries(stats.perHabit.map((p) => [p.id, p])),
    [stats.perHabit]
  );
  const [showAdd, setShowAdd] = useState(false);
  const [dayDetail, setDayDetail] = useState<HabitDayDetail | null>(null);
  const today = getToday();
  const progress = todayTotal > 0 ? todayDone / todayTotal : 0;

  function openDay(date: string) {
    const { habits: rawHabits, logs } = useHabitStore.getState();
    setDayDetail(getHabitDayDetail(rawHabits, logs, date));
  }

  return (
    <ScreenTemplate>
      <ScreenHeader
        title="Habits"
        right={
          <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.addBtn}>
            <Ionicons name="add" size={22} color={colors.accent} />
          </TouchableOpacity>
        }
      />

      <Animated.View entering={FadeInDown.duration(400)}>
        <LinearGradient
          colors={['#1a1f2e', '#15171f', '#101218']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statBanner}
        >
          <Text style={styles.fieldLabel}>Today</Text>
          <View style={styles.statRow}>
            <View>
              <Text style={styles.statValue}>{todayDone}/{todayTotal}</Text>
              <Text style={styles.statLabel}>habits done</Text>
            </View>
            <View style={styles.heroIcon}>
              <Ionicons name="checkmark-done-outline" size={20} color={colors.success} />
            </View>
          </View>
          <View style={styles.progressWrap}>
            <ProgressBar value={progress} max={1} color={colors.success} height={6} />
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {habits.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="checkmark-circle-outline" size={28} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptyHint}>Tap add to create your first habit.</Text>
          </View>
        ) : (
          <>
            <Animated.View entering={FadeInDown.duration(400).delay(60)}>
              <HabitStatsRow
                completionPct={stats.overall.completionPct}
                perfectDayStreak={stats.overall.perfectDayStreak}
                bestStreak={Math.max(0, ...stats.perHabit.map((p) => p.bestStreak))}
              />
              <HabitsHeatmap
                heatmap={stats.heatmap}
                days={stats.heatmapDays}
                onDayPress={openDay}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(120)} style={styles.listCard}>
              {habits.map((h) => (
                <HabitListItem
                  key={h.id}
                  emoji={h.emoji}
                  label={h.label}
                  streak={h.streak}
                  completedToday={h.completedToday}
                  bestStreak={statById[h.id]?.bestStreak}
                  thisWeek={statById[h.id]?.thisWeek}
                  onToggle={() => toggleHabit(h.id, today)}
                  onDelete={() => removeHabit(h.id)}
                />
              ))}
            </Animated.View>
          </>
        )}
      </ScrollView>

      <AddHabitSheet
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={(emoji, label) => addHabit({ emoji, label })}
      />

      <HabitDayDetailSheet
        visible={dayDetail !== null}
        detail={dayDetail}
        onClose={() => setDayDetail(null)}
      />
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  backBtn: { padding: 4 },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.accent}14`,
    borderWidth: 1,
    borderColor: `${colors.accent}33`,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statBanner: {
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: `${colors.accent}1A`,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.success,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginTop: 2,
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressWrap: {
    marginTop: spacing.md,
  },
  list: {
    paddingBottom: 40,
  },
  listCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
    gap: 8,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyHint: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
