import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { DiaryEntry, DoneTask } from '@/src/domain/types/diary';
import { zustandStorage } from '@/src/services/storage';

interface DiaryData {
  entries: DiaryEntry[];
  tasks: DoneTask[];
}

interface DiaryState extends DiaryData {
  upsertEntry: (entry: DiaryEntry) => void;
  removeEntry: (id: string) => void;
  addTask: (task: DoneTask) => void;
  updateTask: (id: string, patch: Partial<DoneTask>) => void;
  removeTask: (id: string) => void;
  getEntryByDate: (date: string) => DiaryEntry | undefined;
  getTasksByDate: (date: string) => DoneTask[];
  getDatesWithContent: () => Set<string>;
}

export const useDiaryStore = create<DiaryState>()(
  persist(
    (set, get) => ({
      entries: [],
      tasks: [],

      upsertEntry: (entry) =>
        set((s) => ({
          entries: s.entries.some((e) => e.date === entry.date)
            ? s.entries.map((e) => (e.date === entry.date ? entry : e))
            : [...s.entries, entry],
        })),

      removeEntry: (id) =>
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),

      addTask: (task) =>
        set((s) => ({ tasks: [...s.tasks, task] })),

      updateTask: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      removeTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      getEntryByDate: (date) => get().entries.find((e) => e.date === date),

      getTasksByDate: (date) => get().tasks.filter((t) => t.date === date),

      getDatesWithContent: () => {
        const s = get();
        const dates = new Set<string>();
        s.entries.forEach((e) => dates.add(e.date));
        s.tasks.forEach((t) => dates.add(t.date));
        return dates;
      },
    }),
    {
      name: 'diary-v1',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state): DiaryData => ({
        entries: state.entries,
        tasks: state.tasks,
      }),
    }
  )
);
