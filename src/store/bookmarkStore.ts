import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/src/services/storage';
import { Bookmark, RecurrenceType } from '@/src/domain/types/bookmark';

interface BookmarkState {
  bookmarks: Bookmark[];
  addBookmark: (bookmark: Bookmark) => void;
  updateBookmark: (id: string, patch: Partial<Bookmark>) => void;
  removeBookmark: (id: string) => void;
  getBookmarkById: (id: string) => Bookmark | undefined;
  getBookmarksByDate: (date: string) => Bookmark[];
}

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      addBookmark: (bookmark) => set((state) => ({
        bookmarks: [...state.bookmarks, bookmark]
      })),
      updateBookmark: (id, patch) => set((state) => ({
        bookmarks: state.bookmarks.map(b => b.id === id ? { ...b, ...patch } : b)
      })),
      removeBookmark: (id) => set((state) => ({
        bookmarks: state.bookmarks.filter(b => b.id !== id)
      })),
      getBookmarkById: (id) => get().bookmarks.find(b => b.id === id),
      getBookmarksByDate: (date) => get().bookmarks.filter(b => {
        if (!b.recurrence || b.recurrence === 'none') return b.date === date;
        if (date < b.date) return false;
        
        const dTarget = new Date(date + 'T00:00:00');
        const dBase = new Date(b.date + 'T00:00:00');
        
        if (b.recurrence === 'daily') return true;
        if (b.recurrence === 'weekly') return dTarget.getDay() === dBase.getDay();
        if (b.recurrence === 'monthly') return dTarget.getDate() === dBase.getDate();
        if (b.recurrence === 'yearly') return dTarget.getMonth() === dBase.getMonth() && dTarget.getDate() === dBase.getDate();
        
        return false;
      }),
    }),
    {
      name: 'bookmarks-v1',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
