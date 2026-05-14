import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ScreenTemplate } from '@/src/components/templates/ScreenTemplate';
import { GymSessionChecklist } from '@/src/components/organisms/gym/GymSessionChecklist';
import { ProteinSleepRow } from '@/src/components/organisms/gym/ProteinSleepRow';
import { WeeklyGrid } from '@/src/components/organisms/gym/WeeklyGrid';
import { SectionHeader } from '@/src/components/molecules/SectionHeader';
import { Badge } from '@/src/components/atoms/Badge';
import { SparkLine } from '@/src/components/atoms/SparkLine';
import { useGym } from '@/src/hooks/useGym';
import { colors } from '@/src/theme/colors';
import { formatWeight, pplLabel } from '@/src/utils/formatters';
import { formatDisplayDate, getToday } from '@/src/utils/dates';

export function GymScreen() {
  const gym = useGym();

  const weightDelta =
    gym.weightTrend.length >= 2
      ? (gym.weightTrend[gym.weightTrend.length - 1] - gym.weightTrend[0]).toFixed(1)
      : null;

  return (
    <ScreenTemplate>
      <View style={styles.headerPad}>
        <Text style={styles.heading}>Gym & Nutrition</Text>
      </View>

      {gym.todaySession ? (
        <GymSessionChecklist
          session={gym.todaySession}
          dateLabel={
            gym.selectedDate === getToday()
              ? "TODAY'S SESSION"
              : formatDisplayDate(gym.selectedDate).toUpperCase()
          }
          onToggle={gym.toggleExercise}
        />
      ) : (
        <View style={styles.card}>
          <Text style={styles.noSession}>
            {gym.selectedPplDay === 'rest'
              ? 'Rest day - no workout scheduled.'
              : 'No workout logged for this day yet.'}
          </Text>
        </View>
      )}

      <ProteinSleepRow nutrition={gym.todayNutrition} sleep={gym.sleepLog} />

      <WeeklyGrid
        days={gym.weekGrid.map((day) => ({
          ...day,
          isSelected: day.day === gym.selectedDate,
        }))}
        onSelectDay={gym.setSelectedDate}
      />

      <SectionHeader title="Body Weight" />
      <View style={styles.card}>
        <View style={styles.weightRow}>
          <View>
            <Text style={styles.weightLabel}>BODY WEIGHT</Text>
            <Text style={styles.weightValue}>
              {gym.latestWeight ? formatWeight(gym.latestWeight.weightKg) : '--'}
            </Text>
            {weightDelta !== null && (
              <Text
                style={[
                  styles.weightDelta,
                  { color: parseFloat(weightDelta) >= 0 ? colors.success : colors.danger },
                ]}
              >
                {parseFloat(weightDelta) >= 0 ? '+' : ''}
                {weightDelta} this week
              </Text>
            )}
          </View>
          {gym.weightTrend.length >= 2 && (
            <SparkLine data={gym.weightTrend} width={100} height={30} />
          )}
        </View>
      </View>

      {gym.recentSessions.length > 0 && (
        <>
          <SectionHeader title="Previous Workouts" />
          {gym.recentSessions.map((session) => (
            <View key={session.id} style={styles.historyCard}>
              <View style={styles.historyRow}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyType}>{pplLabel(session.type)}</Text>
                  <Text style={styles.historyDate}>{formatHistoryDate(session.date)}</Text>
                  {session.exercises.length > 0 && (
                    <Text style={styles.historyExercises} numberOfLines={1}>
                      {session.exercises.map((exercise) => exercise.name).join(' - ')}
                    </Text>
                  )}
                </View>
                <Badge
                  label={session.completed ? 'Done' : 'Incomplete'}
                  preset={session.completed ? 'success' : 'muted'}
                />
              </View>
            </View>
          ))}
        </>
      )}

      <TouchableOpacity
        style={styles.logBtn}
        onPress={() => router.push('/modals/log-workout')}
        activeOpacity={0.8}
      >
        <Text style={styles.logBtnText}>+ Log Stats</Text>
      </TouchableOpacity>
    </ScreenTemplate>
  );
}

function formatHistoryDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}

const styles = StyleSheet.create({
  headerPad: {
    paddingTop: 8,
    marginBottom: 4,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  noSession: {
    fontSize: 14,
    color: colors.textMuted,
  },
  weightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weightLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  weightValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  weightDelta: {
    fontSize: 12,
    marginTop: 2,
  },
  historyCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyLeft: {
    flex: 1,
    marginRight: 10,
  },
  historyType: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  historyDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  historyExercises: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  logBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  logBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
