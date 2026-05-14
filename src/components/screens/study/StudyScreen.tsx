import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ScreenTemplate } from '@/src/components/templates/ScreenTemplate';
import { DailyStudyBanner } from '@/src/components/organisms/study/DailyStudyBanner';
import { FocusTimerCard } from '@/src/components/organisms/study/FocusTimerCard';
import { StudyStreakCard } from '@/src/components/organisms/study/StudyStreakCard';
import { ExamCountdownBanner } from '@/src/components/organisms/study/ExamCountdownBanner';
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
import { useStudyPlanCalendar } from '@/src/hooks/useStudyPlanCalendar';
import { colors } from '@/src/theme/colors';

export function StudyScreen() {
  const study = useStudy();
  const plan = useStudyPlanStore();
  const todayPlan = plan.getTodayPlan();
  const upcoming = plan.getUpcoming(7);
  const overdue = plan.getOverduePlan();
  const planCalendar = useStudyPlanCalendar();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  return (
    <ScreenTemplate>
      <View style={styles.headerPad}>
        <Text style={styles.heading}>Study Tracker</Text>
      </View>

      <DailyStudyBanner
        totalMinutes={study.todayMinutes}
        sessionCount={study.todaySessionCount}
      />

      <FocusTimerCard />

      <StudyStreakCard streak={study.studyStreak} />

      {study.checkpoint && study.daysUntilExam !== null && (
        <ExamCountdownBanner
          checkpoint={study.checkpoint}
          daysLeft={study.daysUntilExam}
        />
      )}

      {/* Plan: today checklist → upcoming → month calendar */}
      <TodayPlanCard
        items={todayPlan}
        onToggle={plan.toggleComplete}
        onDelete={plan.removeItem}
      />

      <TodaySessionsList
        sessions={study.todaySessions}
        onDelete={study.removeSession}
      />

      <OverduePlanList items={overdue} />

      <UpcomingPlanList
        items={upcoming}
      />

      <SectionHeader title="Plan Calendar" />
      <StudyPlanCalendar
        days={planCalendar.days}
        stats={planCalendar.stats}
        monthLabel={planCalendar.monthLabel}
        onPrev={planCalendar.goPrev}
        onNext={planCalendar.goNext}
        onDayPress={setSelectedDay}
      />

      <SectionHeader title="This Week" />
      <WeeklySummaryCard
        totalMinutes={study.weeklyStats.totalMinutes}
        sessionCount={study.weeklyStats.sessionCount}
        daysActive={study.weeklyStats.daysActive}
      />

      <SectionHeader title="4-Week Heatmap" />
      <StudyHeatmap heatmap={study.heatmap} />

      {study.topicsWithProgress.length > 0 && (
        <>
          <SectionHeader title="Topic Progress" />
          <TopicProgressList topics={study.topicsWithProgress} />
        </>
      )}

      <RecentStudyHistory
        sessions={study.recentSessions}
        onDelete={study.removeSession}
      />

      <View style={styles.btnRow}>
        <TouchableOpacity
          style={styles.logBtn}
          onPress={() => router.push('/modals/log-session')}
          activeOpacity={0.8}
        >
          <Text style={styles.logBtnText}>+ Log Session</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.planBtn}
          onPress={() => router.push('/modals/add-study-plan')}
          activeOpacity={0.8}
        >
          <Text style={styles.planBtnText}>📋 Plan</Text>
        </TouchableOpacity>
      </View>

      <StudyPlanDayModal date={selectedDay} onClose={() => setSelectedDay(null)} />
    </ScreenTemplate>
  );
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
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  logBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  planBtn: {
    backgroundColor: colors.cardElevated,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  planBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
