export type WallpaperTarget = 'home' | 'lock' | 'both';

export type ScheduleRepeat = 'once' | 'daily' | 'weekdays';

export interface WallpaperItem {
  id: string;
  name: string;
  /** Path to the app-owned copy of the image (durable, survives gallery changes). */
  localPath: string;
  createdAt: string;
}

export interface WallpaperSchedule {
  id: string;
  wallpaperId: string;
  /** Local time of day in 24h HH:MM. Applies the schedule's wallpaper. */
  time: string;
  /**
   * Optional end of the window in 24h HH:MM. When set, the default wallpaper
   * (`wallpaperStore.defaultWallpaperId`) is applied at this time. If endTime is
   * earlier than `time`, the window wraps past midnight and end fires the next
   * day. If no default wallpaper is set, the end alarm is skipped.
   */
  endTime?: string;
  target: WallpaperTarget;
  repeat: ScheduleRepeat;
  /** For 'weekdays' repeat: 0=Sun … 6=Sat. */
  weekdays: number[];
  enabled: boolean;
  /** YYYY-MM-DD of the last day this schedule fired, to dedupe same-day re-arms. */
  lastAppliedDate?: string;
}

/** Shape pushed down to the native alarm scheduler. */
export interface NativeScheduleEntry {
  id: string;
  localPath: string;
  time: string;
  target: WallpaperTarget;
  repeat: ScheduleRepeat;
  weekdays: number[];
}
