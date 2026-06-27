import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/src/services/storage';

export type SyncDomain =
  | 'study_sessions'
  | 'study_plans'
  | 'gym_sessions'
  | 'nutrition_logs'
  | 'snapshots'
  | 'habits'
  | 'bookmarks'
  | 'diary_entries'
  | 'memories'
  | 'settings';

interface SyncPersisted {
  lastPulledAt: Partial<Record<SyncDomain, number>>;
  lastSyncAt: number | null;
  dirty: SyncDomain[];
}

interface SyncState extends SyncPersisted {
  isSyncing: boolean;
  lastError: string | null;

  markDirty: (domain: SyncDomain) => void;
  clearDirty: (domain: SyncDomain) => void;
  setLastPulledAt: (domain: SyncDomain, ts: number) => void;
  setIsSyncing: (value: boolean) => void;
  setLastError: (err: string | null) => void;
  setLastSyncAt: (ts: number) => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      lastPulledAt: {},
      lastSyncAt: null,
      isSyncing: false,
      lastError: null,
      dirty: [],

      markDirty: (domain) =>
        set((s) => (s.dirty.includes(domain) ? s : { dirty: [...s.dirty, domain] })),

      clearDirty: (domain) =>
        set((s) => ({ dirty: s.dirty.filter((d) => d !== domain) })),

      setLastPulledAt: (domain, ts) =>
        set((s) => ({ lastPulledAt: { ...s.lastPulledAt, [domain]: ts } })),

      setIsSyncing: (value) => set({ isSyncing: value }),
      setLastError: (err) => set({ lastError: err }),
      setLastSyncAt: (ts) => set({ lastSyncAt: ts }),
    }),
    {
      name: 'sync-store-v1',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state): SyncPersisted => ({
        lastPulledAt: state.lastPulledAt,
        lastSyncAt: state.lastSyncAt,
        dirty: state.dirty,
      }),
    },
  ),
);
