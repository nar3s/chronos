import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/src/services/storage';
import { getToday } from '@/src/utils/dates';

export interface Reflection {
  id: string;
  date: string;
  text: string;
}

export interface DailyInsight {
  date: string;
  text: string;
}

interface MemoryData {
  reflections: Reflection[];
  dailyInsight: DailyInsight | null;
}

interface MemoryState extends MemoryData {
  addReflection: (text: string) => void;
  removeReflection: (id: string) => void;
  setDailyInsight: (text: string) => void;
  clearTodayInsight: () => void;
  getRecentReflections: (limit?: number) => Reflection[];
}

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set, get) => ({
      reflections: [],
      dailyInsight: null,

      addReflection: (text) => {
        const reflection: Reflection = {
          id: Date.now().toString(),
          date: getToday(),
          text: text.trim(),
        };
        set((s) => ({ reflections: [reflection, ...s.reflections].slice(0, 60) }));
      },

      removeReflection: (id) =>
        set((s) => ({ reflections: s.reflections.filter((r) => r.id !== id) })),

      setDailyInsight: (text) =>
        set({ dailyInsight: { date: getToday(), text } }),

      clearTodayInsight: () => set({ dailyInsight: null }),

      getRecentReflections: (limit = 5) =>
        get().reflections.slice(0, limit),
    }),
    {
      name: 'memory-v1',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state): MemoryData => ({
        reflections: state.reflections,
        dailyInsight: state.dailyInsight,
      }),
    }
  )
);
