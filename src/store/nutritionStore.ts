import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { NutritionLog } from '@/src/domain/types/gym';
import { getToday } from '@/src/utils/dates';
import { zustandStorage } from '@/src/services/storage';

interface NutritionData {
  logs: NutritionLog[];
}

interface NutritionState extends NutritionData {
  addLog: (log: NutritionLog) => void;
  updateLog: (date: string, patch: Partial<NutritionLog>) => void;
  getTodayLog: () => NutritionLog | null;
}

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set, get) => ({
      logs: [],

      addLog: (log) =>
        set((s) => ({
          logs: [...s.logs.filter((l) => l.date !== log.date), log],
        })),

      updateLog: (date, patch) =>
        set((s) => ({
          logs: s.logs.map((l) => (l.date === date ? { ...l, ...patch } : l)),
        })),

      getTodayLog: () => {
        const today = getToday();
        return get().logs.find((l) => l.date === today) ?? null;
      },
    }),
    {
      name: 'nutrition-store-v2',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state): NutritionData => ({
        logs: state.logs,
      }),
    }
  )
);
