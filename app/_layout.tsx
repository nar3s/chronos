import 'react-native-reanimated';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { setupNotifications } from '@/src/services/notifications';
import { useAppBlocker } from '@/src/hooks/useAppBlocker';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useAppBlocker();

  useEffect(() => {
    SplashScreen.hideAsync();
    setupNotifications().catch(() => {});
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'Settings',
            headerStyle: { backgroundColor: '#1A1A1A' },
            headerTintColor: '#F5F5F5',
            headerTitleStyle: { fontWeight: '600' },
          }}
        />
        <Stack.Screen
          name="modals/log-session"
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'Log Study Session',
            headerStyle: { backgroundColor: '#1A1A1A' },
            headerTintColor: '#F5F5F5',
            headerTitleStyle: { fontWeight: '600' },
          }}
        />
        <Stack.Screen
          name="modals/log-workout"
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'Log Stats',
            headerStyle: { backgroundColor: '#1A1A1A' },
            headerTintColor: '#F5F5F5',
            headerTitleStyle: { fontWeight: '600' },
          }}
        />
        <Stack.Screen
          name="modals/log-diary"
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'Journal',
            headerStyle: { backgroundColor: '#1A1A1A' },
            headerTintColor: '#F5F5F5',
            headerTitleStyle: { fontWeight: '600' },
          }}
        />
        <Stack.Screen
          name="modals/add-bookmark"
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'Add Bookmark',
            headerStyle: { backgroundColor: '#1A1A1A' },
            headerTintColor: '#F5F5F5',
            headerTitleStyle: { fontWeight: '600' },
          }}
        />
        <Stack.Screen
          name="journal/bookmarks"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="more/blocker"
          options={{
            headerShown: true,
            headerTitle: 'Distraction Blocker',
            headerStyle: { backgroundColor: '#1A1A1A' },
            headerTintColor: '#F5F5F5',
            headerTitleStyle: { fontWeight: '600' },
          }}
        />
        <Stack.Screen
          name="more/screen-time"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
}
