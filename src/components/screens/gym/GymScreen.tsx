import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenTemplate } from '@/src/components/templates/ScreenTemplate';
import { GymHeroCard } from '@/src/components/organisms/gym/GymHeroCard';
import { GymSessionChecklist } from '@/src/components/organisms/gym/GymSessionChecklist';
import { ProteinSleepRow } from '@/src/components/organisms/gym/ProteinSleepRow';
import { WeeklyGrid } from '@/src/components/organisms/gym/WeeklyGrid';
import { SectionHeader } from '@/src/components/molecules/SectionHeader';
import { Badge } from '@/src/components/atoms/Badge';
import { useGym } from '@/src/hooks/useGym';
import { useSnapshotStore } from '@/src/store/snapshotStore';
import { colors } from '@/src/theme/colors';
import { pplLabel } from '@/src/utils/formatters';
import { formatDisplayDate, getToday } from '@/src/utils/dates';
import { spacing } from '@/src/theme/spacing';

export function GymScreen() {
  const gym = useGym();
  const isToday = gym.selectedDate === getToday();
  const todaySnapshot = useSnapshotStore((s) =>
    s.snapshots.find((snapshot) => snapshot.date === getToday())
  );
  const updateSnapshot = useSnapshotStore((s) => s.updateSnapshot);

  return (
    <ScreenTemplate>
      <Animated.View entering={FadeInDown.duration(400).delay(STAGGER * 0)}>
        <GymHeroCard
          pplDay={gym.selectedPplDay}
          session={gym.todaySession ?? null}
          streak={gym.gymStreak}
          latestWeight={gym.latestWeight}
          weightTrend={gym.weightTrend}
          isToday={isToday}
          isSkipped={!!todaySnapshot?.gymSkipped}
          onToggleSkip={() =>
            updateSnapshot(getToday(), { gymSkipped: !todaySnapshot?.gymSkipped })
          }
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(STAGGER * 1)}>
      {gym.todaySession ? (
        <GymSessionChecklist
          session={gym.todaySession}
          dateLabel={
            isToday
              ? "TODAY'S SESSION"
              : formatDisplayDate(gym.selectedDate).toUpperCase()
          }
          lastWeightsByExercise={gym.lastWeightsByExercise}
          onToggle={gym.toggleExercise}
        />
      ) : (
        <View>
          <SectionHeader
            title={isToday ? "Today's Session" : formatDisplayDate(gym.selectedDate)}
          />
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name={gym.selectedPplDay === 'rest' ? 'moon-outline' : 'barbell-outline'}
                size={18}
                color={colors.textSecondary}
              />
            </View>
            <View style={styles.emptyBody}>
              <Text style={styles.emptyTitle}>
                {gym.selectedPplDay === 'rest' ? 'Recovery day' : 'No workout logged'}
              </Text>
              <Text style={styles.emptyText}>
                {gym.selectedPplDay === 'rest'
                  ? 'Active recovery day. Keep protein and sleep on track.'
                  : 'Open the log modal to add details for this day.'}
              </Text>
            </View>
            {gym.selectedPplDay === 'rest' && isToday ? (
              <TouchableOpacity
                style={styles.restLink}
                onPress={() => router.push('/modals/log-workout')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={14}
                  color={colors.accent}
                />
                <Text style={styles.restLinkText}>Log cardio</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      )}
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(STAGGER * 2)}>
        <ProteinSleepRow nutrition={gym.todayNutrition} sleep={gym.sleepLog} />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(STAGGER * 3)}>
        <WeeklyGrid
          days={gym.weekGrid.map((day) => ({
            ...day,
            isSelected: day.day === gym.selectedDate,
          }))}
          onSelectDay={gym.setSelectedDate}
        />
      </Animated.View>

      {gym.recentSessions.length > 0 && (
        <Animated.View entering={FadeInDown.duration(400).delay(STAGGER * 4)}>
          <SectionHeader title="Recent Workouts" />
          {gym.recentSessions.map((session) => (
            <View key={session.id} style={styles.historyCard}>
              <View style={styles.historyRow}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyType}>{pplLabel(session.type)}</Text>
                  <Text style={styles.historyDate}>
                    {formatHistoryDate(session.date)}
                  </Text>
                  {session.exercises.length > 0 && (
                    <Text style={styles.historyExercises} numberOfLines={1}>
                      {session.exercises.map((e) => e.name).join(' - ')}
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
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.duration(400).delay(STAGGER * 5)}>
        <TouchableOpacity
          style={styles.logBtn}
          onPress={() => router.push('/modals/log-workout')}
          activeOpacity={0.85}
        >
          <Ionicons name="create-outline" size={16} color="#fff" />
          <Text style={styles.logBtnText}>Log details</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScreenTemplate>
  );
}

const STAGGER = 70;

function formatHistoryDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}

const styles = StyleSheet.create({
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  emptyIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyBody: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
  restLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: `${colors.accent}1A`,
  },
  restLinkText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
  },
  historyCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.base,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
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
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  historyDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  historyExercises: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
  },
  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  logBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
