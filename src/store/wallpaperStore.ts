import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/src/services/storage';
import { wallpaperService } from '@/src/services/wallpaper';
import type {
  WallpaperItem,
  WallpaperSchedule,
  WallpaperTarget,
  ScheduleRepeat,
  NativeScheduleEntry,
} from '@/src/domain/types/wallpaper';

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface WallpaperData {
  items: WallpaperItem[];
  schedules: WallpaperSchedule[];
  activeWallpaperId: string | null;
  /**
   * One library item designated as the "default" wallpaper. Applied at the end
   * of any schedule window that has `endTime` set. Null until the user picks one.
   */
  defaultWallpaperId: string | null;
}

interface NewSchedule {
  wallpaperId: string;
  time: string;
  endTime?: string;
  target: WallpaperTarget;
  repeat: ScheduleRepeat;
  weekdays?: number[];
}

interface WallpaperState extends WallpaperData {
  importImage: (uri: string, name: string) => Promise<WallpaperItem | null>;
  removeItem: (id: string) => void;
  applyNow: (itemId: string, target: WallpaperTarget) => Promise<boolean>;
  addSchedule: (s: NewSchedule) => void;
  updateSchedule: (id: string, patch: Partial<WallpaperSchedule>) => void;
  removeSchedule: (id: string) => void;
  toggleSchedule: (id: string) => void;
  setDefaultWallpaper: (id: string | null) => void;
  resyncNative: () => void;
}

/**
 * Splits each schedule into one or two native alarms. A schedule with `endTime`
 * yields two: `${id}:start` applies the schedule's wallpaper at `time`, and
 * `${id}:end` applies the default wallpaper at `endTime`. The end entry is
 * skipped if no default wallpaper is set (or the default image is missing) —
 * the start alarm still fires, the window just never closes.
 */
function toNativeEntries(
  schedules: WallpaperSchedule[],
  items: WallpaperItem[],
  defaultWallpaperId: string | null
): NativeScheduleEntry[] {
  const pathById = new Map(items.map((i) => [i.id, i.localPath]));
  const defaultPath = defaultWallpaperId ? pathById.get(defaultWallpaperId) ?? null : null;
  const out: NativeScheduleEntry[] = [];

  for (const s of schedules) {
    if (!s.enabled) continue;
    const startPath = pathById.get(s.wallpaperId);
    if (!startPath) continue;

    const base = {
      target: s.target,
      repeat: s.repeat,
      weekdays: s.weekdays,
    };

    out.push({
      ...base,
      id: s.endTime ? `${s.id}:start` : s.id,
      localPath: startPath,
      time: s.time,
    });

    if (s.endTime && defaultPath) {
      out.push({
        ...base,
        id: `${s.id}:end`,
        localPath: defaultPath,
        time: s.endTime,
      });
    }
  }

  return out;
}

export const useWallpaperStore = create<WallpaperState>()(
  persist(
    (set, get) => ({
      items: [],
      schedules: [],
      activeWallpaperId: null,
      defaultWallpaperId: null,

      importImage: async (uri, name) => {
        const localPath = await wallpaperService.importWallpaper(uri);
        if (!localPath) return null;
        const item: WallpaperItem = {
          id: makeId('wp'),
          name: name.trim() || 'Wallpaper',
          localPath,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ items: [...s.items, item] }));
        return item;
      },

      removeItem: (id) => {
        const item = get().items.find((i) => i.id === id);
        if (item) wallpaperService.removeWallpaperFile(item.localPath);
        set((s) => ({
          items: s.items.filter((i) => i.id !== id),
          schedules: s.schedules.filter((sc) => sc.wallpaperId !== id),
          activeWallpaperId: s.activeWallpaperId === id ? null : s.activeWallpaperId,
          defaultWallpaperId: s.defaultWallpaperId === id ? null : s.defaultWallpaperId,
        }));
        get().resyncNative();
      },

      applyNow: async (itemId, target) => {
        const item = get().items.find((i) => i.id === itemId);
        if (!item) return false;
        const ok = await wallpaperService.setWallpaperNow(item.localPath, target);
        if (ok) set({ activeWallpaperId: itemId });
        return ok;
      },

      addSchedule: (s) => {
        const schedule: WallpaperSchedule = {
          id: makeId('wsch'),
          wallpaperId: s.wallpaperId,
          time: s.time,
          endTime: s.endTime,
          target: s.target,
          repeat: s.repeat,
          weekdays: s.weekdays ?? [],
          enabled: true,
        };
        set((st) => ({ schedules: [...st.schedules, schedule] }));
        get().resyncNative();
      },

      updateSchedule: (id, patch) => {
        set((st) => ({
          schedules: st.schedules.map((sc) => (sc.id === id ? { ...sc, ...patch } : sc)),
        }));
        get().resyncNative();
      },

      removeSchedule: (id) => {
        set((st) => ({ schedules: st.schedules.filter((sc) => sc.id !== id) }));
        get().resyncNative();
      },

      toggleSchedule: (id) => {
        set((st) => ({
          schedules: st.schedules.map((sc) =>
            sc.id === id ? { ...sc, enabled: !sc.enabled } : sc
          ),
        }));
        get().resyncNative();
      },

      setDefaultWallpaper: (id) => {
        set({ defaultWallpaperId: id });
        // Any schedule with endTime depends on this — re-arm so the end alarms
        // use the new default (or get dropped if cleared).
        get().resyncNative();
      },

      resyncNative: () => {
        const { schedules, items, defaultWallpaperId } = get();
        wallpaperService.syncSchedules(
          toNativeEntries(schedules, items, defaultWallpaperId)
        );
      },
    }),
    {
      name: 'wallpaper-v1',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (s): WallpaperData => ({
        items: s.items,
        schedules: s.schedules,
        activeWallpaperId: s.activeWallpaperId,
        defaultWallpaperId: s.defaultWallpaperId,
      }),
    }
  )
);
