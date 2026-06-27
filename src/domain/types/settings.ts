export interface StudyTopic {
  id: string;
  label: string;
  color: string;
  active: boolean;
}

export interface WorkoutType {
  id: string;
  label: string;
  color: string;
  isRestDay: boolean;
}

export type ReminderIcon =
  | 'sunny-outline'
  | 'moon-outline'
  | 'alarm-outline'
  | 'alert-circle-outline'
  | 'barbell-outline'
  | 'book-outline'
  | 'restaurant-outline'
  | 'water-outline'
  | 'flame-outline'
  | 'walk-outline'
  | 'time-outline'
  | 'checkmark-circle-outline'
  | 'notifications-outline'
  | 'bed-outline';

export const REMINDER_ICONS: ReminderIcon[] = [
  'sunny-outline',
  'moon-outline',
  'alarm-outline',
  'alert-circle-outline',
  'barbell-outline',
  'book-outline',
  'restaurant-outline',
  'water-outline',
  'flame-outline',
  'walk-outline',
  'time-outline',
  'checkmark-circle-outline',
  'notifications-outline',
  'bed-outline',
];

export const REMINDER_TINTS: string[] = [
  '#3B82F6', // blue
  '#22C55E', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#06B6D4', // cyan
  '#EC4899', // pink
  '#10B981', // emerald
];

export interface CustomReminder {
  id: string;
  title: string;
  body: string;
  time: string; // "HH:mm" 24h
  enabled: boolean;
  icon: ReminderIcon;
  tint: string;
  /** Optional special behavior. 'studyLogged' = pre-schedules 30 days, auto-skips dates where study was logged. */
  dismissIf?: 'studyLogged';
}

export interface ReminderConfig {
  enabled: boolean;
  time: string;
}

export interface ScheduleConfig {
  reminders: CustomReminder[];
  blockerActiveFromHour: number; // 0..23
}

export const DEFAULT_REMINDERS: CustomReminder[] = [
  {
    id: 'morning-block',
    title: 'Morning block',
    body: 'Time to start. Open your books.',
    time: '05:10',
    enabled: true,
    icon: 'sunny-outline',
    tint: '#3B82F6',
  },
  {
    id: 'morning-missed',
    title: 'Morning block missed?',
    body: 'No study logged yet. Get it in before the day slips.',
    time: '07:30',
    enabled: true,
    icon: 'alert-circle-outline',
    tint: '#F59E0B',
    dismissIf: 'studyLogged',
  },
  {
    id: 'protein-check',
    title: 'Protein check-in',
    body: "Halfway through the day - how's the protein target?",
    time: '14:00',
    enabled: true,
    icon: 'restaurant-outline',
    tint: '#F59E0B',
  },
  {
    id: 'gym-reminder',
    title: 'Gym reminder',
    body: 'Have you trained today?',
    time: '20:45',
    enabled: true,
    icon: 'barbell-outline',
    tint: '#22C55E',
  },
];

export const DEFAULT_SCHEDULE_CONFIG: ScheduleConfig = {
  reminders: DEFAULT_REMINDERS,
  blockerActiveFromHour: 21,
};

export function parseHHmm(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':').map((p) => parseInt(p, 10));
  return {
    hour: Number.isFinite(h) ? Math.max(0, Math.min(23, h)) : 0,
    minute: Number.isFinite(m) ? Math.max(0, Math.min(59, m)) : 0,
  };
}

export function formatHHmm(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * Migrates the old fixed-4-slot ScheduleConfig shape to the new reminders[] shape.
 * Used by the settingsStore persist migration to preserve user customizations.
 */
export function migrateLegacyScheduleConfig(legacy: any): ScheduleConfig {
  if (
    legacy &&
    typeof legacy === 'object' &&
    Array.isArray(legacy.reminders)
  ) {
    return legacy as ScheduleConfig;
  }

  const reminders: CustomReminder[] = [...DEFAULT_REMINDERS];
  const overrides: Array<[string, any]> = [
    ['morning-block', legacy?.morningBlock],
    ['morning-missed', legacy?.morningBlockMissed],
    ['protein-check', legacy?.proteinCheck],
    ['gym-reminder', legacy?.gymReminder],
  ];

  for (const [id, slot] of overrides) {
    if (!slot || typeof slot !== 'object') continue;
    const idx = reminders.findIndex((r) => r.id === id);
    if (idx === -1) continue;
    reminders[idx] = {
      ...reminders[idx],
      enabled: typeof slot.enabled === 'boolean' ? slot.enabled : reminders[idx].enabled,
      time: typeof slot.time === 'string' ? slot.time : reminders[idx].time,
    };
  }

  return {
    reminders,
    blockerActiveFromHour:
      typeof legacy?.blockerActiveFromHour === 'number'
        ? legacy.blockerActiveFromHour
        : DEFAULT_SCHEDULE_CONFIG.blockerActiveFromHour,
  };
}
