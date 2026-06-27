import { SectionHeader } from "@/src/components/molecules/SectionHeader";
import { ActivityCalendar } from "@/src/components/organisms/dashboard/ActivityCalendar";
import { QuickStatsRow } from "@/src/components/organisms/dashboard/QuickStatsRow";
import { TodayFocusCard } from "@/src/components/organisms/dashboard/TodayFocusCard";
import { TodayHeroCard } from "@/src/components/organisms/dashboard/TodayHeroCard";
import { ScreenTemplate } from "@/src/components/templates/ScreenTemplate";
import { useActivityCalendar } from "@/src/hooks/useActivityCalendar";
import { useDailySnapshot } from "@/src/hooks/useDailySnapshot";
import { useGymStore } from "@/src/store/gymStore";
import { useHabitStore } from "@/src/store/habitStore";
import { useNutritionStore } from "@/src/store/nutritionStore";
import { useSettingsStore } from "@/src/store/settingsStore";
import { useSnapshotStore } from "@/src/store/snapshotStore";
import { useStudyStore } from "@/src/store/studyStore";
import { colors } from "@/src/theme/colors";
import { spacing } from "@/src/theme/spacing";
import { getDateDaysAgo, getToday } from "@/src/utils/dates";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const STAGGER_BASE = 80;
const SECTION_GRADIENT = ["#1a1f2e", "#15171f", "#101218"] as const;

export function DashboardScreen() {
  const data = useDailySnapshot();
  const calendar = useActivityCalendar();
  const userName = useSettingsStore((s) => s.userName);
  const updateSnapshot = useSnapshotStore((s) => s.updateSnapshot);
  const habits = useHabitStore((s) => s.habits);
  const habitLogs = useHabitStore((s) => s.logs);
  const studySessions = useStudyStore((s) => s.sessions);
  const sleepLogs = useGymStore((s) => s.sleepLogs);
  const nutritionLogs = useNutritionStore((s) => s.logs);

  const today = getToday();
  const yesterday = getDateDaysAgo(1);
  const habitsDoneToday = habitLogs.filter((log) => log.date === today).length;
  const habitsDoneYesterday = habitLogs.filter((log) => log.date === yesterday).length;
  const studyYesterdayMinutes = studySessions
    .filter((session) => session.date === yesterday)
    .reduce((sum, session) => sum + session.durationMinutes, 0);
  const proteinYesterdayGrams =
    nutritionLogs.find((log) => log.date === yesterday)?.proteinGrams ?? 0;
  const sleepYesterdayMinutes =
    sleepLogs.find((log) => log.date === yesterday)?.durationMinutes ?? 0;

  return (
    <ScreenTemplate>
      <Animated.View
        entering={FadeInDown.duration(400).delay(STAGGER_BASE * 0)}
      >
        <TodayHeroCard
          snapshot={data.todaySnapshot}
          streak={data.morningStreak}
          userName={userName}
          skipData={{
            todayStudyMinutes: data.todayStudyMinutes,
            todayProteinGrams: data.todayProteinGrams,
            isRestDay: data.isRestDay,
            isGymSkippedToday: data.isGymSkippedToday,
            isStudySkippedToday: data.isStudySkippedToday,
            isProteinSkippedToday: data.isProteinSkippedToday,
            todaySessionCompleted: !!data.todaySession?.completed,
          }}
          onUpdateIntention={(intention) =>
            updateSnapshot(today, { intention })
          }
          onToggleSkip={(key, next) => updateSnapshot(today, { [key]: next })}
        />
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(400).delay(STAGGER_BASE * 1)}
      >
        <LinearGradient
          colors={SECTION_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sectionCard}
        >
          <Text style={styles.fieldLabel}>Today's focus</Text>
          <TodayFocusCard study={data.studyFocus} gym={data.gymFocus} />
        </LinearGradient>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(400).delay(STAGGER_BASE * 2)}
      >
        <LinearGradient
          colors={SECTION_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sectionCard}
        >
          <Text style={styles.fieldLabel}>Quick stats</Text>
          <QuickStatsRow
            nutrition={data.todayNutrition}
            sleep={data.todaySleepLog}
            studyMinutes={data.todayStudyMinutes}
            studyYesterdayMinutes={studyYesterdayMinutes}
            habitsDoneToday={habitsDoneToday}
            habitsDoneYesterday={habitsDoneYesterday}
            totalHabits={habits.length}
            proteinYesterdayGrams={proteinYesterdayGrams}
            sleepYesterdayMinutes={sleepYesterdayMinutes}
          />
        </LinearGradient>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(400).delay(STAGGER_BASE * 3)}
      >
        <SectionHeader title="Activity" />
        <ActivityCalendar
          days={calendar.days}
          startOffset={calendar.startOffset}
          monthLabel={calendar.monthLabel}
          isCurrentMonth={calendar.isCurrentMonth}
          selectedDate={calendar.selectedDate}
          daySummary={calendar.daySummary}
          onPrev={calendar.goPrev}
          onNext={calendar.goNext}
          onSelectDate={calendar.setSelectedDate}
        />
      </Animated.View>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: `${colors.accent}1A`,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
});
