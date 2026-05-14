import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PlannedStudyItem } from '@/src/domain/types/studyPlan';
import { getToday, getWeekDates } from '@/src/utils/dates';
import { zustandStorage } from '@/src/services/storage';

interface PlanData {
  items: PlannedStudyItem[];
}

interface StudyPlanState extends PlanData {
  addItem: (item: PlannedStudyItem) => void;
  bulkAdd: (items: PlannedStudyItem[]) => void;
  removeItem: (id: string) => void;
  toggleComplete: (id: string) => void;
  clearMonth: (yearMonth: string) => void;

  getTodayPlan: () => PlannedStudyItem[];
  getWeekPlan: () => PlannedStudyItem[];
  getMonthPlan: (yearMonth: string) => PlannedStudyItem[];
  getUpcoming: (limit?: number) => PlannedStudyItem[];
  getOverduePlan: () => PlannedStudyItem[];
}

export const useStudyPlanStore = create<StudyPlanState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((s) => ({ items: [...s.items, item] })),

      bulkAdd: (newItems) =>
        set((s) => {
          const map = new Map(s.items.map((i) => [`${i.date}|${i.topic}|${i.subtopic.toLowerCase()}`, i]));
          for (const item of newItems) {
            const key = `${item.date}|${item.topic}|${item.subtopic.toLowerCase()}`;
            const existing = map.get(key);
            if (existing) {
              map.set(key, { ...existing, plannedMinutes: item.plannedMinutes });
            } else {
              map.set(key, item);
            }
          }
          return { items: Array.from(map.values()) };
        }),

      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      toggleComplete: (id) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, completed: !i.completed } : i
          ),
        })),

      clearMonth: (yearMonth) =>
        set((s) => ({
          items: s.items.filter((i) => !i.date.startsWith(yearMonth)),
        })),

      getTodayPlan: () => {
        const today = getToday();
        return get().items.filter((i) => i.date === today);
      },

      getWeekPlan: () => {
        const weekDates = new Set(getWeekDates());
        return get()
          .items.filter((i) => weekDates.has(i.date))
          .sort((a, b) => a.date.localeCompare(b.date));
      },

      getMonthPlan: (yearMonth) =>
        get()
          .items.filter((i) => i.date.startsWith(yearMonth))
          .sort((a, b) => a.date.localeCompare(b.date)),

      getUpcoming: (limit = 7) => {
        const today = getToday();
        return get()
          .items.filter((i) => i.date > today && !i.completed)
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(0, limit);
      },

      getOverduePlan: () => {
        const today = getToday();
        return get()
          .items.filter((i) => i.date < today && !i.completed)
          .sort((a, b) => a.date.localeCompare(b.date));
      },
    }),
    {
      name: 'study-plan-v1',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state): PlanData => ({
        items: state.items,
      }),
    }
  )
);
