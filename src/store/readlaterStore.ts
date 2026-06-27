import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ReadLaterItem } from '@/src/domain/types/readlater';
import { zustandStorage } from '@/src/services/storage';

interface ReadLaterData {
  items: ReadLaterItem[];
}

interface ReadLaterState extends ReadLaterData {
  addItem: (item: ReadLaterItem) => void;
  updateItem: (id: string, patch: Partial<ReadLaterItem>) => void;
  removeItem: (id: string) => void;
  toggleRead: (id: string) => void;
  getItemById: (id: string) => ReadLaterItem | undefined;
}

export const useReadLaterStore = create<ReadLaterState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((s) => ({ items: [item, ...s.items] })),

      updateItem: (id, patch) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        })),

      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      toggleRead: (id) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id
              ? {
                  ...i,
                  isRead: !i.isRead,
                  readAt: !i.isRead ? new Date().toISOString() : undefined,
                }
              : i,
          ),
        })),

      // Returns an existing object reference — safe to use directly. Prefer
      // getState().getItemById(id) for one-time reads (e.g. modal init).
      getItemById: (id) => get().items.find((i) => i.id === id),
    }),
    {
      name: 'readlater-v1',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state): ReadLaterData => ({
        items: state.items,
      }),
    },
  ),
);
