import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenTemplate } from '@/src/components/templates/ScreenTemplate';
import { ScreenHeader } from '@/src/components/molecules/ScreenHeader';
import { CompanionCard } from '@/src/components/organisms/dashboard/CompanionCard';
import { generateInsight, type SessionNote } from '@/src/services/aiCompanion';
import { useGymStore } from '@/src/store/gymStore';
import { useMemoryStore } from '@/src/store/memoryStore';
import { useNutritionStore } from '@/src/store/nutritionStore';
import { useSettingsStore } from '@/src/store/settingsStore';
import { useStudyStore } from '@/src/store/studyStore';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { getToday } from '@/src/utils/dates';

export function InsightsScreen() {
  const study = useStudyStore();
  const gym = useGymStore();
  const nutrition = useNutritionStore();
  const settings = useSettingsStore();
  const memory = useMemoryStore();

  const today = getToday();
  const todayInsight = memory.dailyInsight?.date === today ? memory.dailyInsight.text : null;
  const recentReflections = memory.getRecentReflections(3);

  async function handleGenerateInsight() {
    const weeklyStats = study.getWeeklyStats();
    const sleepLog = gym.getTodaySleepLog();
    const todayNutrition = nutrition.getTodayLog();
    const todaySession = gym.getTodaySession();

    const recentSessionNotes: SessionNote[] = study
      .getRecentSessions(20)
      .filter((session) => session.notes && session.notes.trim().length > 0)
      .slice(0, 5)
      .map((session) => ({
        date: session.date,
        topic: session.topic,
        subtopic: session.subtopic,
        notes: session.notes!,
      }));

    const text = await generateInsight(settings.llmProvider, settings.llmApiKey, {
      studyMinutesToday: study.getTodayMinutes(),
      studyStreak: study.getMorningBlockStreak(),
      weeklyStudyMinutes: weeklyStats.totalMinutes,
      weeklyStudyGoalMinutes: settings.goals.weeklyStudyHours * 60,
      gymCompletedToday: todaySession?.completed ?? false,
      sleepHours: sleepLog
        ? Math.round((sleepLog.durationMinutes / 60) * 10) / 10
        : null,
      proteinGrams: todayNutrition?.proteinGrams ?? null,
      dailyProteinGoal: settings.goals.dailyProteinGrams,
      recentSessionNotes,
      recentReflections,
    });

    memory.setDailyInsight(text);
  }

  return (
    <ScreenTemplate>
      <ScreenHeader title="AI Insights" />

      <CompanionCard
        cleanGlyphs
        hasApiKey={!!settings.llmApiKey.trim()}
        todayInsight={todayInsight}
        recentReflections={recentReflections}
        onGenerateInsight={handleGenerateInsight}
        onAddReflection={memory.addReflection}
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
  headerSpacer: { width: 32 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
