import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenTemplate } from '@/src/components/templates/ScreenTemplate';
import { StudyHeroCard } from '@/src/components/organisms/study/StudyHeroCard';
import { FocusTimerCard } from '@/src/components/organisms/study/FocusTimerCard';
import { TodayPlanCard } from '@/src/components/organisms/study/TodayPlanCard';
import { TodaySessionsList } from '@/src/components/organisms/study/TodaySessionsList';
import { UpcomingPlanList } from '@/src/components/organisms/study/UpcomingPlanList';
import { OverduePlanList } from '@/src/components/organisms/study/OverduePlanList';
import { StudyPlanCalendar } from '@/src/components/organisms/study/StudyPlanCalendar';
import { WeeklySummaryCard } from '@/src/components/organisms/study/WeeklySummaryCard';
import { StudyHeatmap } from '@/src/components/organisms/study/StudyHeatmap';
import { TopicProgressList } from '@/src/components/organisms/study/TopicProgressList';
import { RecentStudyHistory } from '@/src/components/organisms/study/RecentStudyHistory';
import { StudyPlanDayModal } from '@/src/components/organisms/study/StudyPlanDayModal';
import { SectionHeader } from '@/src/components/molecules/SectionHeader';
import { useStudy } from '@/src/hooks/useStudy';
import { useStudyPlanStore } from '@/src/store/studyPlanStore';
import { useSnapshotStore } from '@/src/store/snapshotStore';
import { useStudyStore } from '@/src/store/studyStore';
import { useStudyPlanCalendar } from '@/src/hooks/useStudyPlanCalendar';
import { colors } from '@/src/theme/colors';
import { getToday } from '@/src/utils/dates';

export function StudyScreen() {
  const study = useStudy();
  const plan = useStudyPlanStore();
  const studySessions = useStudyStore((s) => s.sessions);
  const todaySnapshot = useSnapshotStore((s) =>
    s.snapshots.find((snapshot) => snapshot.date === getToday())
  );
  const updateSnapshot = useSnapshotStore((s) => s.updateSnapshot);
  const todayPlan = plan.getTodayPlan();
  const upcoming = plan.getUpcoming(7);
  const overdue = plan.getOverduePlan();
  const planCalendar = useStudyPlanCalendar();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  return (
    <ScreenTemplate>
      <Animated.View entering={FadeInDown.duration(400).delay(STAGGER * 0)}>
        <StudyHeroCard
          todayMinutes={study.todayMinutes}
          sessionCount={study.todaySessionCount}
          streak={study.studyStreak}
          checkpoint={study.checkpoint}
          daysUntilExam={study.daysUntilExam}
          isSkipped={!!todaySnapshot?.studySkipped}
          onToggleSkip={() =>
            updateSnapshot(getToday(), {
              studySkipped: !todaySnapshot?.studySkipped,
            })
          }
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(STAGGER * 1)}>
        <FocusTimerCard />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(STAGGER * 2)}>
        <TodayPlanCard
          items={todayPlan}
          onToggle={plan.toggleComplete}
          onDelete={plan.removeItem}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(STAGGER * 3)}>
        <TodaySessionsList
          sessions={study.todaySessions}
          onDelete={study.removeSession}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(STAGGER * 4)}>
        <OverduePlanList items={overdue} />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(STAGGER * 5)}>
        <UpcomingPlanList items={upcoming} />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(STAGGER * 6)}>
        <SectionHeader title="Plan Calendar" />
        <StudyPlanCalendar
          days={planCalendar.days}
          stats={planCalendar.stats}
          monthLabel={planCalendar.monthLabel}
          onPrev={planCalendar.goPrev}
          onNext={planCalendar.goNext}
          onDayPress={setSelectedDay}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(STAGGER * 7)}>
        <SectionHeader title="This Week" />
        <WeeklySummaryCard
          totalMinutes={study.weeklyStats.totalMinutes}
          sessionCount={study.weeklyStats.sessionCount}
          daysActive={study.weeklyStats.daysActive}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(STAGGER * 8)}>
        <SectionHeader title="4-Week Heatmap" />
        <StudyHeatmap heatmap={study.heatmap} />
      </Animated.View>

      {study.topicsWithProgress.length > 0 && (
        <Animated.View entering={FadeInDown.duration(400).delay(STAGGER * 9)}>
          <SectionHeader title="Topic Progress" />
          <TopicProgressList topics={study.topicsWithProgress} />
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.duration(400).delay(STAGGER * 10)}>
        <RecentStudyHistory
          sessions={study.recentSessions}
          onDelete={study.removeSession}
        />
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(400).delay(STAGGER * 11)}
        style={styles.btnRow}
      >
        <TouchableOpacity
          style={styles.logBtn}
          onPress={() => router.push('/modals/log-session')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.logBtnText}>Log session</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.planBtn}
          onPress={() => router.push('/modals/add-study-plan')}
          activeOpacity={0.8}
        >
          <Ionicons name="list-outline" size={16} color={colors.textPrimary} />
          <Text style={styles.planBtnText}>Plan</Text>
        </TouchableOpacity>
      </Animated.View>

      <StudyPlanDayModal
        date={selectedDay}
        planItems={plan.items}
        sessions={studySessions}
        onClose={() => setSelectedDay(null)}
      />
    </ScreenTemplate>
  );
}

const STAGGER = 70;

const styles = StyleSheet.create({
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  logBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
  },
  logBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  planBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.cardElevated,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
