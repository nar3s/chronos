import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { DailySnapshot } from '@/src/domain/types/snapshot';
import { getToday, calculateStreak } from '@/src/utils/dates';
import { zustandStorage } from '@/src/services/storage';

interface SnapshotData {
  snapshots: DailySnapshot[];
}

interface SnapshotState extends SnapshotData {
  updateSnapshot: (date: string, patch: Partial<DailySnapshot>) => void;
  getTodaySnapshot: () => DailySnapshot | null;
  getMorningBlockStreak: () => number;
}

export const useSnapshotStore = create<SnapshotState>()(
  persist(
    (set, get) => ({
      snapshots: [],

      updateSnapshot: (date, patch) =>
        set((s) => ({
          snapshots: s.snapshots.some((snap) => snap.date === date)
            ? s.snapshots.map((snap) =>
                snap.date === date ? { ...snap, ...patch } : snap
              )
            : [
                ...s.snapshots,
                {
                  date,
                  morningBlockStarted: false,
                  studyMinutes: 0,
                  gymCompleted: false,
                  gymSkipped: false,
                  proteinGrams: 0,
                  sleepMinutes: 0,
                  ...patch,
                },
              ],
        })),

      getTodaySnapshot: () => {
        const today = getToday();
        return get().snapshots.find((s) => s.date === today) ?? null;
      },

      getMorningBlockStreak: () => {
        const activeDates = get()
          .snapshots.filter((s) => s.morningBlockStarted)
          .map((s) => s.date);
        return calculateStreak(activeDates);
      },
    }),
    {
      name: 'snapshot-store-v2',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state): SnapshotData => ({
        snapshots: state.snapshots,
      }),
    }
  )
);
