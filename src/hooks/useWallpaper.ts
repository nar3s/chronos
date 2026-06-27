import { useEffect, useState, useCallback } from 'react';
import { AppState, Platform } from 'react-native';
import { useWallpaperStore } from '@/src/store/wallpaperStore';
import { wallpaperService } from '@/src/services/wallpaper';
import type { WallpaperSchedule } from '@/src/domain/types/wallpaper';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function describeSchedule(s: WallpaperSchedule): string {
  const window = s.endTime ? `${s.time}–${s.endTime}` : s.time;
  if (s.repeat === 'daily') return `Every day ${s.endTime ? window : `at ${s.time}`}`;
  if (s.repeat === 'once') return `Once ${s.endTime ? window : `at ${s.time}`}`;
  if (s.weekdays.length === 0) return s.endTime ? window : `At ${s.time}`;
  const days = [...s.weekdays].sort((a, b) => a - b).map((d) => DAY_NAMES[d]).join(', ');
  return `${days} ${s.endTime ? window : `at ${s.time}`}`;
}

export function useWallpaper() {
  const items = useWallpaperStore((s) => s.items);
  const schedules = useWallpaperStore((s) => s.schedules);
  const activeWallpaperId = useWallpaperStore((s) => s.activeWallpaperId);
  const defaultWallpaperId = useWallpaperStore((s) => s.defaultWallpaperId);

  const importImage = useWallpaperStore((s) => s.importImage);
  const removeItem = useWallpaperStore((s) => s.removeItem);
  const applyNow = useWallpaperStore((s) => s.applyNow);
  const addSchedule = useWallpaperStore((s) => s.addSchedule);
  const updateSchedule = useWallpaperStore((s) => s.updateSchedule);
  const removeSchedule = useWallpaperStore((s) => s.removeSchedule);
  const toggleSchedule = useWallpaperStore((s) => s.toggleSchedule);
  const setDefaultWallpaper = useWallpaperStore((s) => s.setDefaultWallpaper);

  const sortedItems = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const enabledSchedules = schedules.filter((s) => s.enabled);
  const nextSchedule = [...enabledSchedules].sort((a, b) => a.time.localeCompare(b.time))[0] ?? null;
  const activeItem = items.find((i) => i.id === activeWallpaperId) ?? null;
  const defaultItem = items.find((i) => i.id === defaultWallpaperId) ?? null;

  return {
    items: sortedItems,
    schedules: [...schedules].sort((a, b) => a.time.localeCompare(b.time)),
    activeItem,
    defaultItem,
    defaultWallpaperId,
    nextSchedule,
    importImage,
    removeItem,
    applyNow,
    addSchedule,
    updateSchedule,
    removeSchedule,
    toggleSchedule,
    setDefaultWallpaper,
  };
}

/**
 * Tracks whether the OS grants exact-alarm permission (required on Android 12+
 * for to-the-minute scheduled wallpaper changes). Mirrors the accessibility
 * banner UX used by the distraction blocker.
 */
export function useExactAlarmStatus() {
  const [granted, setGranted] = useState(true);
  const resyncNative = useWallpaperStore((s) => s.resyncNative);

  const refresh = useCallback(() => {
    if (Platform.OS !== 'android' || !wallpaperService.isSupported()) {
      setGranted(true);
      return;
    }
    setGranted(wallpaperService.hasExactAlarmPermission());
  }, []);

  useEffect(() => {
    refresh();
    // Re-arm native alarms from the persisted schedule on app start.
    resyncNative();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh, resyncNative]);

  return {
    granted,
    refresh,
    openSettings: () => wallpaperService.openExactAlarmSettings(),
  };
}
