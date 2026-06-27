import { NativeModule, requireNativeModule } from 'expo';

import { MyModuleEvents } from './MyModule.types';

declare class MyModule extends NativeModule<MyModuleEvents> {
  setDailyLogPending(isPending: boolean): void;
  setBlockedPackages(packages: string[]): void;
  getBlockedPackages(): string[];
  isAccessibilityServiceEnabled(): boolean;
  openAccessibilitySettings(): boolean;
  hasUsageStatsPermission(): boolean;
  openUsageStatsSettings(): boolean;

  // Wallpaper
  setWallpaperNow(uri: string, target: string): Promise<boolean>;
  importWallpaper(uri: string): Promise<string>;
  removeWallpaperFile(path: string): void;
  syncWallpaperSchedules(json: string): void;
  hasExactAlarmPermission(): boolean;
  openExactAlarmSettings(): boolean;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<MyModule>('MyModule');
