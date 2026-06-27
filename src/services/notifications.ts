import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useSettingsStore } from '@/src/store/settingsStore';
import { CustomReminder, parseHHmm } from '@/src/domain/types/settings';
import type { RecurrenceType } from '@/src/domain/types/bookmark';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const DISMISS_IF_SCHEDULE_DAYS = 30;

// Notification identifiers used by previous app builds. Cancelled explicitly
// because Android's AlarmManager can retain these across an app update even
// when getAllScheduledNotificationsAsync() no longer lists them.
const LEGACY_SYSTEM_IDS = [
  'system-morning',
  'system-morning-missed',
  'system-protein',
  'system-gym',
];

let setupInFlight: Promise<void> | null = null;

function localDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function reminderSystemId(reminderId: string): string {
  return `system-reminder-${reminderId}`;
}

function reminderInstanceId(reminderId: string, date: string): string {
  return `system-reminder-${reminderId}-${date}`;
}

function bookmarkNotificationId(bookmarkId: string): string {
  return `bookmark-${bookmarkId}`;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const { status: newStatus } = await Notifications.requestPermissionsAsync();
  return newStatus === 'granted';
}

export async function cancelBookmarkNotification(bookmarkId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(
    bookmarkNotificationId(bookmarkId),
  );
}

export async function scheduleBookmarkNotification(params: {
  bookmarkId: string;
  title: string;
  body: string;
  reminderDate: Date;
  recurrence: RecurrenceType;
}): Promise<string> {
  let trigger: Notifications.NotificationTriggerInput;

  if (params.recurrence === 'none') {
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: params.reminderDate,
    };
  } else {
    const calTrigger: Record<string, number | boolean> = { repeats: true };
    if (params.recurrence === 'daily') {
      calTrigger.hour = params.reminderDate.getHours();
      calTrigger.minute = params.reminderDate.getMinutes();
    } else if (params.recurrence === 'weekly') {
      calTrigger.weekday = params.reminderDate.getDay() + 1;
      calTrigger.hour = params.reminderDate.getHours();
      calTrigger.minute = params.reminderDate.getMinutes();
    } else if (params.recurrence === 'monthly') {
      calTrigger.day = params.reminderDate.getDate();
      calTrigger.hour = params.reminderDate.getHours();
      calTrigger.minute = params.reminderDate.getMinutes();
    } else if (params.recurrence === 'yearly') {
      calTrigger.month = params.reminderDate.getMonth() + 1;
      calTrigger.day = params.reminderDate.getDate();
      calTrigger.hour = params.reminderDate.getHours();
      calTrigger.minute = params.reminderDate.getMinutes();
    }

    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      ...calTrigger,
    };
  }

  return Notifications.scheduleNotificationAsync({
    identifier: bookmarkNotificationId(params.bookmarkId),
    content: {
      title: params.title,
      body: params.body,
      data: { screen: 'journal' },
    },
    trigger,
  });
}

function readLaterNotificationId(itemId: string): string {
  return `readlater-${itemId}`;
}

export async function cancelReadLaterNotification(itemId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(
    readLaterNotificationId(itemId),
  );
}

// Read-later reminders are one-time only (no recurrence). The identifier prefix
// `readlater-` keeps them clear of the `system-*` ids that runSetup() resets on
// launch, so a scheduled reminder survives app restarts just like bookmarks.
export async function scheduleReadLaterNotification(params: {
  itemId: string;
  title: string;
  body: string;
  reminderDate: Date;
}): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    identifier: readLaterNotificationId(params.itemId),
    content: {
      title: params.title,
      body: params.body,
      data: { screen: 'readlater' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: params.reminderDate,
    },
  });
}

async function scheduleDaily(reminder: CustomReminder): Promise<void> {
  const { hour, minute } = parseHHmm(reminder.time);
  await Notifications.scheduleNotificationAsync({
    identifier: reminderSystemId(reminder.id),
    content: {
      title: reminder.title,
      body: reminder.body,
      data: { reminderId: reminder.id },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
}

async function scheduleDismissibleSeries(
  reminder: CustomReminder,
  studiedDates: Set<string>,
): Promise<void> {
  const { hour, minute } = parseHHmm(reminder.time);
  const now = new Date();
  for (let offset = 0; offset < DISMISS_IF_SCHEDULE_DAYS; offset++) {
    const fireDate = new Date(now);
    fireDate.setDate(now.getDate() + offset);
    fireDate.setHours(hour, minute, 0, 0);

    const idDate = localDateStr(fireDate);
    if (fireDate <= now || studiedDates.has(idDate)) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: reminderInstanceId(reminder.id, idDate),
      content: {
        title: reminder.title,
        body: reminder.body,
        data: { reminderId: reminder.id },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireDate },
    });
  }
}

interface SetupNotificationsOptions {
  studiedDates?: string[];
}

export async function setupNotifications(options: SetupNotificationsOptions = {}): Promise<void> {
  if (setupInFlight) return setupInFlight;
  setupInFlight = runSetup(options).finally(() => {
    setupInFlight = null;
  });
  return setupInFlight;
}

async function runSetup(options: SetupNotificationsOptions): Promise<void> {
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

  // Explicitly cancel legacy IDs first — Android may not surface alarms
  // scheduled by a previous app build via getAllScheduledNotificationsAsync.
  for (const id of LEGACY_SYSTEM_IDS) {
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  }

  // Then cancel everything currently tracked that we own (system-*), leaving
  // user bookmarks (bookmark-*) intact.
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.identifier.startsWith('system-')) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }

  const { scheduleConfig } = useSettingsStore.getState();
  const studiedDates = new Set(options.studiedDates ?? []);

  for (const reminder of scheduleConfig.reminders) {
    if (!reminder.enabled) continue;
    if (reminder.dismissIf === 'studyLogged') {
      await scheduleDismissibleSeries(reminder, studiedDates);
    } else {
      await scheduleDaily(reminder);
    }
  }
}

export async function cancelTodayMorningMissedAlert(): Promise<void> {
  // Legacy helper retained for compatibility. Cancels any dismissible-series instance for today.
  const today = localDateStr(new Date());
  const { scheduleConfig } = useSettingsStore.getState();
  for (const reminder of scheduleConfig.reminders) {
    if (reminder.dismissIf === 'studyLogged') {
      await Notifications.cancelScheduledNotificationAsync(
        reminderInstanceId(reminder.id, today),
      );
    }
  }
}

export async function rescheduleSystemNotifications(studiedDates?: string[]): Promise<void> {
  await setupNotifications({ studiedDates });
}
