import { Platform } from 'react-native';
import type {
  WallpaperTarget,
  NativeScheduleEntry,
} from '@/src/domain/types/wallpaper';

/**
 * Thin wrapper around the native wallpaper methods on MyModule. Components and
 * stores call this service only — never `requireNativeModule` directly — so the
 * app degrades gracefully on web / Expo Go where the native module is absent.
 */
type WallpaperNativeModule = {
  setWallpaperNow: (uri: string, target: WallpaperTarget) => Promise<boolean>;
  importWallpaper: (uri: string) => Promise<string>;
  removeWallpaperFile?: (path: string) => void;
  syncWallpaperSchedules: (json: string) => void;
  hasExactAlarmPermission?: () => boolean;
  openExactAlarmSettings?: () => void;
};

let cached: WallpaperNativeModule | null | undefined;
let warned = false;

function getModule(): WallpaperNativeModule | null {
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    cached = require('@/modules/my-module').default as WallpaperNativeModule;
  } catch {
    cached = null;
    if (!warned) {
      warned = true;
      console.warn('Wallpaper native module not available.');
    }
  }
  return cached;
}

export const wallpaperService = {
  isSupported(): boolean {
    return Platform.OS === 'android' && getModule() !== null;
  },

  async setWallpaperNow(uri: string, target: WallpaperTarget): Promise<boolean> {
    const mod = getModule();
    if (!mod?.setWallpaperNow) return false;
    return mod.setWallpaperNow(uri, target);
  },

  /** Copies the picked image into app storage and returns the durable path. */
  async importWallpaper(uri: string): Promise<string | null> {
    const mod = getModule();
    if (!mod?.importWallpaper) return null;
    return mod.importWallpaper(uri);
  },

  removeWallpaperFile(path: string): void {
    getModule()?.removeWallpaperFile?.(path);
  },

  syncSchedules(entries: NativeScheduleEntry[]): void {
    const mod = getModule();
    if (!mod?.syncWallpaperSchedules) return;
    mod.syncWallpaperSchedules(JSON.stringify(entries));
  },

  hasExactAlarmPermission(): boolean {
    return getModule()?.hasExactAlarmPermission?.() ?? false;
  },

  openExactAlarmSettings(): void {
    getModule()?.openExactAlarmSettings?.();
  },
};
