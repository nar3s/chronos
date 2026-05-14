import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ScreenTemplate } from '@/src/components/templates/ScreenTemplate';
import { IntentionCard } from '@/src/components/organisms/dashboard/IntentionCard';
import { MorningBlockCard } from '@/src/components/organisms/dashboard/MorningBlockCard';
import { TodayFocusCard } from '@/src/components/organisms/dashboard/TodayFocusCard';
import { QuickStatsRow } from '@/src/components/organisms/dashboard/QuickStatsRow';
import { ActivityCalendar } from '@/src/components/organisms/dashboard/ActivityCalendar';
import { PendingLogsBanner } from '@/src/components/organisms/dashboard/PendingLogsBanner';
import { SectionHeader } from '@/src/components/molecules/SectionHeader';
import { useDailySnapshot } from '@/src/hooks/useDailySnapshot';
import { useActivityCalendar } from '@/src/hooks/useActivityCalendar';
import { useAccessibilityStatus } from '@/src/hooks/useAccessibilityStatus';
import { useSettingsStore } from '@/src/store/settingsStore';
import { colors } from '@/src/theme/colors';

const STAGGER_BASE = 80;

export function DashboardScreen() {
  const data = useDailySnapshot();
  const calendar = useActivityCalendar();
  const { isEnabled: isServiceEnabled, openSettings } = useAccessibilityStatus();
  const isBlockerEnabled = useSettingsStore((s) => s.blockerConfig.enabled);

  return (
    <ScreenTemplate>
      <Animated.View
        style={styles.headerPad}
        entering={FadeInDown.duration(400).delay(STAGGER_BASE * 0)}
      >
        <Text style={styles.dateText}>{data.displayDate}</Text>
        <Text style={styles.greeting}>Good morning, Naresh</Text>
      </Animated.View>

      <PendingLogsBanner
        isBlockerEnabled={isBlockerEnabled}
        isStudyDone={data.todayStudyMinutes > 0}
        isGymDone={data.isGymDoneToday}
        isProteinDone={data.todayProteinGrams > 0}
        isServiceEnabled={isServiceEnabled}
        onOpenSettings={openSettings}
      />

      {data.gymStreak >= 3 && (
        <Animated.View
          style={styles.microWin}
          entering={FadeInDown.duration(400).delay(STAGGER_BASE * 1)}
        >
          <Text style={styles.microWinText}>
            🔥 {data.gymStreak}-day gym streak
          </Text>
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.duration(400).delay(STAGGER_BASE * 2)}>
        <MorningBlockCard
          snapshot={data.todaySnapshot}
          streak={data.morningStreak}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(STAGGER_BASE * 3)}>
        <IntentionCard />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(STAGGER_BASE * 4)}>
        <SectionHeader title="Today's Focus" />
        <TodayFocusCard study={data.studyFocus} gym={data.gymFocus} />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(STAGGER_BASE * 5)}>
        <SectionHeader title="Quick Stats" />
        <QuickStatsRow
          nutrition={data.todayNutrition}
          sleep={data.todaySleepLog}
          studyMinutes={data.todayStudyMinutes}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(STAGGER_BASE * 6)}>
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
  headerPad: {
    paddingTop: 8,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '400',
    marginBottom: 2,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  microWin: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  microWinText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
});
