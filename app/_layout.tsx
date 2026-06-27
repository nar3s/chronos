import 'react-native-reanimated';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { AppState, Pressable, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { setupNotifications } from '@/src/services/notifications';
import { useAppBlocker } from '@/src/hooks/useAppBlocker';
import { useSync } from '@/src/hooks/useSync';
import { useShareCapture } from '@/src/hooks/useShareCapture';
import { useStudyStore } from '@/src/store/studyStore';
import { useSettingsStore } from '@/src/store/settingsStore';
import { getToday } from '@/src/utils/dates';
import { colors } from '@/src/theme/colors';

SplashScreen.preventAutoHideAsync();

function setupSystemNotifications(): void {
  const studiedDates = [
    ...new Set(useStudyStore.getState().sessions.map((session) => session.date)),
  ];

  setupNotifications({ studiedDates }).catch(() => {});
}

function areNotificationStoresHydrated(): boolean {
  return (
    useStudyStore.persist.hasHydrated() &&
    useSettingsStore.persist.hasHydrated()
  );
}

function CloseButton() {
  return (
    <Pressable
      onPress={() => router.back()}
      hitSlop={10}
      style={({ pressed }) => ({
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: pressed
          ? `${colors.accent}26`
          : `${colors.accent}14`,
        borderWidth: 1,
        borderColor: `${colors.accent}33`,
      })}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: '700',
          color: colors.accent,
          letterSpacing: 0.1,
        }}
      >
        Close
      </Text>
    </Pressable>
  );
}

const modalHeaderOptions = {
  presentation: 'modal' as const,
  headerShown: true,
  headerStyle: { backgroundColor: colors.card },
  headerTintColor: colors.textSecondary,
  headerTitleStyle: {
    fontWeight: '600' as const,
    fontSize: 16,
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  headerShadowVisible: false,
  headerTitleAlign: 'left' as const,
  headerBackVisible: false,
  headerLeft: () => null,
  headerRight: () => <CloseButton />,
};

const pageHeaderOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.textSecondary,
  headerTitleStyle: {
    fontWeight: '600' as const,
    fontSize: 16,
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  headerShadowVisible: false,
  headerTitleAlign: 'left' as const,
};

export default function RootLayout() {
  useAppBlocker();
  useSync();
  useShareCapture();
  const lastNotificationSetupDate = useRef<string | null>(null);

  useEffect(() => {
    const setupIfNeeded = () => {
      if (!areNotificationStoresHydrated()) return;

      const today = getToday();
      if (lastNotificationSetupDate.current === today) return;

      lastNotificationSetupDate.current = today;
      setupSystemNotifications();
    };

    const setupAfterStudyHydration = () => {
      if (areNotificationStoresHydrated()) {
        setupIfNeeded();
        return undefined;
      }

      const unsubscribers = [
        useStudyStore.persist.onFinishHydration(setupIfNeeded),
        useSettingsStore.persist.onFinishHydration(setupIfNeeded),
      ];

      return () => {
        unsubscribers.forEach((unsubscribe) => unsubscribe());
      };
    };

    SplashScreen.hideAsync();
    const unsubscribeHydration = setupAfterStudyHydration();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setupIfNeeded();
      }
    });

    const unsubscribeSchedule = useSettingsStore.subscribe((state, prev) => {
      // Object identity changes on every settingsStore mutation (userName, goals,
      // topics, etc.) because setters spread scheduleConfig. Compare the bits we
      // actually schedule from so unrelated settings edits don't reschedule 30
      // days of system-reminder notifications.
      const sameReminders =
        state.scheduleConfig.reminders === prev.scheduleConfig.reminders;
      const sameBlockerHour =
        state.scheduleConfig.blockerActiveFromHour ===
        prev.scheduleConfig.blockerActiveFromHour;
      if (sameReminders && sameBlockerHour) return;
      lastNotificationSetupDate.current = null;
      setupIfNeeded();
    });

    return () => {
      unsubscribeHydration?.();
      subscription.remove();
      unsubscribeSchedule();
    };
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="settings"
          options={{ ...modalHeaderOptions, headerTitle: 'Settings' }}
        />
        <Stack.Screen
          name="modals/log-session"
          options={{ ...modalHeaderOptions, headerTitle: 'Log study session' }}
        />
        <Stack.Screen
          name="modals/log-workout"
          options={{ ...modalHeaderOptions, headerTitle: 'Log workout' }}
        />
        <Stack.Screen
          name="modals/log-diary"
          options={{ ...modalHeaderOptions, headerTitle: 'Journal entry' }}
        />
        <Stack.Screen
          name="modals/add-bookmark"
          options={{ ...modalHeaderOptions, headerTitle: 'Add bookmark' }}
        />
        <Stack.Screen
          name="journal/bookmarks"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="more/blocker"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="more/screen-time"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="more/schedule"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="more/personalize"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="more/wallpaper"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="modals/add-wallpaper-schedule"
          options={{ ...modalHeaderOptions, headerTitle: 'Wallpaper schedule' }}
        />
        <Stack.Screen
          name="more/read-later"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="modals/add-read-later"
          options={{ ...modalHeaderOptions, headerTitle: 'Read later' }}
        />
      </Stack>
    </>
  );
}
