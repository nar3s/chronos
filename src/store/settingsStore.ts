import { StudyTopic, WorkoutType } from "@/src/domain/types/settings";
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
  llmProvider: LLMProvider;
  llmApiKey: string;
  goals: Goals;
  topics: StudyTopic[];
  workoutCycle: WorkoutType[];
  accentColor: string;
  blockerConfig: BlockerConfig;
  screenTimeBudgets: Record<string, number>;
}

interface SettingsState extends SettingsData {
  setLLMProvider: (provider: LLMProvider) => void;
  setLLMApiKey: (key: string) => void;
  setGoals: (goals: Partial<Goals>) => void;
  setTopics: (topics: StudyTopic[]) => void;
  setWorkoutCycle: (cycle: WorkoutType[]) => void;
  setAccentColor: (color: string) => void;
  setBlockerConfig: (config: Partial<BlockerConfig>) => void;
  setScreenTimeBudget: (packageName: string, minutes: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
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
    }),
    {
      name: "settings-v1",
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state): SettingsData => ({
        llmProvider: state.llmProvider,
        llmApiKey: state.llmApiKey,
        goals: state.goals,
        topics: state.topics,
        workoutCycle: state.workoutCycle,
        accentColor: state.accentColor,
        blockerConfig: state.blockerConfig,
        screenTimeBudgets: state.screenTimeBudgets,
      }),
    },
  ),
);
