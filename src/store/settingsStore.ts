import {
  CustomReminder,
  DEFAULT_SCHEDULE_CONFIG,
  ScheduleConfig,
  StudyTopic,
  WorkoutType,
  migrateLegacyScheduleConfig,
} from "@/src/domain/types/settings";
import { zustandStorage } from "@/src/services/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type LLMProvider = "gemini" | "openai";

interface Goals {
  weeklyStudyHours: number;
  dailyProteinGrams: number;
  targetWeightKg: number | null;
}

interface BlockerConfig {
  enabled: boolean;
  blockedPackages: string[];
  scheduleStart: string;
  scheduleEnd: string;
  blockMode: 'strict' | 'soft';
}

export type { BlockerConfig };

interface SettingsData {
  userName: string;
  llmProvider: LLMProvider;
  llmApiKey: string;
  goals: Goals;
  topics: StudyTopic[];
  workoutCycle: WorkoutType[];
  accentColor: string;
  blockerConfig: BlockerConfig;
  screenTimeBudgets: Record<string, number>;
  scheduleConfig: ScheduleConfig;
}

interface SettingsState extends SettingsData {
  setUserName: (name: string) => void;
  setLLMProvider: (provider: LLMProvider) => void;
  setLLMApiKey: (key: string) => void;
  setGoals: (goals: Partial<Goals>) => void;
  setTopics: (topics: StudyTopic[]) => void;
  setWorkoutCycle: (cycle: WorkoutType[]) => void;
  setAccentColor: (color: string) => void;
  setBlockerConfig: (config: Partial<BlockerConfig>) => void;
  setScreenTimeBudget: (packageName: string, minutes: number) => void;
  setScheduleConfig: (config: Partial<ScheduleConfig>) => void;
  setReminders: (reminders: CustomReminder[]) => void;
  addReminder: (reminder: CustomReminder) => void;
  updateReminder: (id: string, patch: Partial<CustomReminder>) => void;
  removeReminder: (id: string) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeBlockerConfig(
  persisted: Partial<BlockerConfig> | undefined,
  current: BlockerConfig,
): BlockerConfig {
  return {
    ...current,
    ...(persisted ?? {}),
    enabled:
      typeof persisted?.enabled === 'boolean'
        ? persisted.enabled
        : current.enabled,
    blockedPackages: Array.isArray(persisted?.blockedPackages)
      ? persisted.blockedPackages.filter((item): item is string => typeof item === 'string')
      : current.blockedPackages,
    scheduleStart:
      typeof persisted?.scheduleStart === 'string'
        ? persisted.scheduleStart
        : current.scheduleStart,
    scheduleEnd:
      typeof persisted?.scheduleEnd === 'string'
        ? persisted.scheduleEnd
        : current.scheduleEnd,
    blockMode:
      persisted?.blockMode === 'soft' || persisted?.blockMode === 'strict'
        ? persisted.blockMode
        : current.blockMode,
  };
}

function sanitizeScheduleConfig(value: unknown): ScheduleConfig {
  const migrated = migrateLegacyScheduleConfig(value);
  return {
    reminders: Array.isArray(migrated.reminders)
      ? migrated.reminders.filter((reminder) => isRecord(reminder)) as CustomReminder[]
      : DEFAULT_SCHEDULE_CONFIG.reminders,
    blockerActiveFromHour:
      Number.isFinite(migrated.blockerActiveFromHour)
        ? Math.max(0, Math.min(23, migrated.blockerActiveFromHour))
        : DEFAULT_SCHEDULE_CONFIG.blockerActiveFromHour,
  };
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      userName: "Naresh",
      llmProvider: "gemini",
      llmApiKey: "",
      goals: {
        weeklyStudyHours: 30,
        dailyProteinGrams: 80,
        targetWeightKg: null,
      },
      topics: [
        {
          id: "real-analysis",
          label: "Real Analysis",
          color: "#3B82F6",
          active: true,
        },
        {
          id: "linear-algebra",
          label: "Linear Algebra",
          color: "#8B5CF6",
          active: true,
        },
        { id: "pyqs", label: "PYQs", color: "#22C55E", active: true },
      ],
      workoutCycle: [
        { id: "push1", label: "Push", color: "#EF4444", isRestDay: false },
        { id: "pull1", label: "Pull", color: "#F59E0B", isRestDay: false },
        { id: "legs1", label: "Legs", color: "#3B82F6", isRestDay: false },
        { id: "push2", label: "Push", color: "#EF4444", isRestDay: false },
        { id: "pull2", label: "Pull", color: "#F59E0B", isRestDay: false },
        { id: "legs2", label: "Legs", color: "#3B82F6", isRestDay: false },
        { id: "rest1", label: "Rest", color: "#666666", isRestDay: true },
      ],
      accentColor: "#3B82F6",
      screenTimeBudgets: {},
      blockerConfig: {
        enabled: false,
        blockedPackages: [
          'com.instagram.android',
          'com.google.android.youtube',
          'com.zhiliaoapp.musically',
          'com.twitter.android',
          'com.facebook.katana',
        ],
        scheduleStart: '21:00',
        scheduleEnd: '06:00',
        blockMode: 'strict',
      },
      scheduleConfig: DEFAULT_SCHEDULE_CONFIG,

      setUserName: (name) => set({ userName: name.trim() || 'Friend' }),
      setLLMProvider: (provider) => set({ llmProvider: provider }),
      setLLMApiKey: (key) => set({ llmApiKey: key }),
      setGoals: (partial) =>
        set((s) => ({ goals: { ...s.goals, ...partial } })),
      setTopics: (topics) => set({ topics }),
      setWorkoutCycle: (cycle) => set({ workoutCycle: cycle }),
      setAccentColor: (color) => set({ accentColor: color }),
      setBlockerConfig: (patch) =>
        set((s) => ({ blockerConfig: { ...s.blockerConfig, ...patch } })),
      setScreenTimeBudget: (packageName, minutes) =>
        set((s) => ({
          screenTimeBudgets: { ...s.screenTimeBudgets, [packageName]: minutes },
        })),
      setScheduleConfig: (patch) =>
        set((s) => ({
          scheduleConfig: { ...s.scheduleConfig, ...patch },
        })),
      setReminders: (reminders) =>
        set((s) => ({
          scheduleConfig: { ...s.scheduleConfig, reminders },
        })),
      addReminder: (reminder) =>
        set((s) => ({
          scheduleConfig: {
            ...s.scheduleConfig,
            reminders: [...s.scheduleConfig.reminders, reminder],
          },
        })),
      updateReminder: (id, patch) =>
        set((s) => ({
          scheduleConfig: {
            ...s.scheduleConfig,
            reminders: s.scheduleConfig.reminders.map((r) =>
              r.id === id ? { ...r, ...patch } : r,
            ),
          },
        })),
      removeReminder: (id) =>
        set((s) => ({
          scheduleConfig: {
            ...s.scheduleConfig,
            reminders: s.scheduleConfig.reminders.filter((r) => r.id !== id),
          },
        })),
    }),
    {
      name: "settings-v1",
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state): SettingsData => ({
        userName: state.userName,
        llmProvider: state.llmProvider,
        llmApiKey: state.llmApiKey,
        goals: state.goals,
        topics: state.topics,
        workoutCycle: state.workoutCycle,
        accentColor: state.accentColor,
        blockerConfig: state.blockerConfig,
        screenTimeBudgets: state.screenTimeBudgets,
        scheduleConfig: state.scheduleConfig,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SettingsData>;
        const goals = isRecord(p.goals)
          ? { ...current.goals, ...p.goals }
          : current.goals;

        return {
          ...current,
          ...p,
          userName:
            typeof p.userName === 'string' && p.userName.trim().length > 0
              ? p.userName
              : current.userName,
          llmProvider:
            p.llmProvider === 'openai' || p.llmProvider === 'gemini'
              ? p.llmProvider
              : current.llmProvider,
          llmApiKey:
            typeof p.llmApiKey === 'string' ? p.llmApiKey : current.llmApiKey,
          goals,
          topics: Array.isArray(p.topics) ? p.topics : current.topics,
          workoutCycle: Array.isArray(p.workoutCycle)
            ? p.workoutCycle
            : current.workoutCycle,
          accentColor:
            typeof p.accentColor === 'string'
              ? p.accentColor
              : current.accentColor,
          blockerConfig: sanitizeBlockerConfig(p.blockerConfig, current.blockerConfig),
          screenTimeBudgets: isRecord(p.screenTimeBudgets)
            ? Object.fromEntries(
                Object.entries(p.screenTimeBudgets).filter(
                  ([, minutes]) => typeof minutes === 'number' && Number.isFinite(minutes),
                ),
              )
            : current.screenTimeBudgets,
          scheduleConfig: sanitizeScheduleConfig(p.scheduleConfig),
        };
      },
    },
  ),
);
