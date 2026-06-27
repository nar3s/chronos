import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/src/services/storage';
import { calculateStreak, getToday } from '@/src/utils/dates';
import type { Habit, HabitLog } from '@/src/domain/types/habit';

const DEFAULT_HABITS: Omit<Habit, 'id' | 'createdAt'>[] = [
  { label: 'Cold Shower', emoji: 'checkmark-circle-outline', order: 0 },
  { label: 'Meditate', emoji: 'checkmark-circle-outline', order: 1 },
  { label: 'Read', emoji: 'book-outline', order: 2 },
  { label: 'No junk food', emoji: 'restaurant-outline', order: 3 },
];

function createHabitId(): string {
  return `habit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

interface HabitData {
  habits: Habit[];
  logs: HabitLog[];
  seeded: boolean;
}

interface HabitState extends HabitData {
  addHabit(h: Pick<Habit, 'label' | 'emoji'>): void;
  removeHabit(id: string): void;
  reorderHabits(orderedIds: string[]): void;
  toggleHabit(habitId: string, date: string): void;
  getStreak(habitId: string): number;
  getTodayCompletion(): { done: number; total: number };
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: [],
      logs: [],
      seeded: false,

      addHabit: (h) =>
        set((s) => ({
          habits: [
            ...s.habits,
            {
              id: createHabitId(),
              label: h.label,
              emoji: h.emoji,
              order: s.habits.length,
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      removeHabit: (id) =>
        set((s) => ({
          habits: s.habits.filter((h) => h.id !== id).map((h, i) => ({ ...h, order: i })),
          logs: s.logs.filter((l) => l.habitId !== id),
        })),

      reorderHabits: (orderedIds) =>
        set((s) => ({
          habits: orderedIds
            .map((id, i) => {
              const h = s.habits.find((x) => x.id === id);
              return h ? { ...h, order: i } : null;
            })
            .filter(Boolean) as Habit[],
        })),

      toggleHabit: (habitId, date) =>
        set((s) => {
          const exists = s.logs.some((l) => l.habitId === habitId && l.date === date);
          return {
            logs: exists
              ? s.logs.filter((l) => !(l.habitId === habitId && l.date === date))
              : [...s.logs, { habitId, date, completedAt: new Date().toISOString() }],
          };
        }),

      getStreak: (habitId) => {
        const dates = [
          ...new Set(get().logs.filter((l) => l.habitId === habitId).map((l) => l.date)),
        ];
        return calculateStreak(dates);
      },

      getTodayCompletion: () => {
        const today = getToday();
        const { habits, logs } = get();
        const done = logs.filter((l) => l.date === today).length;
        return { done, total: habits.length };
      },
    }),
    {
      name: 'habit-v1',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (s): HabitData => ({ habits: s.habits, logs: s.logs, seeded: s.seeded }),
      onRehydrateStorage: () => (state) => {
        if (state && !state.seeded && state.habits.length === 0) {
          const now = new Date().toISOString();
          state.habits = DEFAULT_HABITS.map((h, i) => ({
            ...h,
            id: `default-${i}`,
            createdAt: now,
          }));
          state.seeded = true;
        }
      },
    }
  )
);
