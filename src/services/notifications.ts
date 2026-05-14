import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function setupNotifications(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('Chronos', {
      name: 'Chronos Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  // Only cancel system notifications, leave custom user bookmarks intact.
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.identifier.startsWith('system-')) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }

  const { SchedulableTriggerInputTypes } = Notifications;

  await Notifications.scheduleNotificationAsync({
    identifier: 'system-morning',
    content: {
      title: '⏰ Morning Block',
      body: 'Time to start. 5:10 AM — open your books.',
      data: { screen: 'study' },
    },
    trigger: { type: SchedulableTriggerInputTypes.DAILY, hour: 5, minute: 10 },
  });

  await Notifications.scheduleNotificationAsync({
    identifier: 'system-morning-missed',
    content: {
      title: 'Morning Block Missed?',
      body: 'No study logged yet. Get it in before the day slips.',
      data: { screen: 'study' },
    },
    trigger: { type: SchedulableTriggerInputTypes.DAILY, hour: 7, minute: 30 },
  });

  await Notifications.scheduleNotificationAsync({
    identifier: 'system-protein',
    content: {
      title: '🥩 Protein Check',
      body: "Halfway through the day — how's the protein target?",
      data: { screen: 'gym' },
    },
    trigger: { type: SchedulableTriggerInputTypes.DAILY, hour: 14, minute: 0 },
  });

  await Notifications.scheduleNotificationAsync({
    identifier: 'system-gym',
    content: {
      title: '🏋️ Gym Reminder',
      body: '8:45 PM — have you trained today?',
      data: { screen: 'gym' },
    },
    trigger: { type: SchedulableTriggerInputTypes.DAILY, hour: 20, minute: 45 },
  });
}

export async function cancelMorningMissedAlert(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync('system-morning-missed');
}
