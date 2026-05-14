import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

let MyModule: any = null;
if (Platform.OS === 'android') {
  try {
    MyModule = require('@/modules/my-module').default;
  } catch (e) {
    console.warn('Failed to load MyModule for useScreenTime:', e);
  }
}

export interface UsageStat {
  packageName: string;
  appName: string;
  timeInForegroundMs: number;
}

export interface ScreenTimeData {
  totalMs: number;
  apps: UsageStat[];
}

const SYSTEM_PACKAGES = [
  'com.android.systemui',
  'com.google.android.apps.nexuslauncher',
  'com.sec.android.app.launcher',
  'com.miui.home',
  'com.oneplus.mms',
  'com.android.launcher',
  'com.android.settings',
  'com.google.android.permissioncontroller'
];

export type ScreenTimeMode = 'daily' | 'monthly';

export function useScreenTime() {
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [data, setData] = useState<ScreenTimeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<ScreenTimeMode>('daily');
  const [targetDate, setTargetDate] = useState<Date>(new Date());

  const checkPermission = useCallback(() => {
    if (!MyModule) {
      setIsLoading(false);
      return;
    }
    const granted = MyModule.hasUsageStatsPermission();
    setIsPermissionGranted(granted);
    return granted;
  }, []);

  const fetchStats = useCallback(() => {
    if (!MyModule) return;
    
    try {
      const rawStats: UsageStat[] = mode === 'daily' 
        ? MyModule.getUsageStatsForDate(targetDate.getTime())
        : MyModule.getMonthlyUsageStats(targetDate.getTime());
      
      // Filter out system apps and apps with < 1 minute usage (60,000 ms)
      const filtered = rawStats.filter(stat => {
        if (stat.timeInForegroundMs < 60000) return false;
        if (SYSTEM_PACKAGES.includes(stat.packageName)) return false;
        return true;
      });

      // Sort by highest time
      filtered.sort((a, b) => b.timeInForegroundMs - a.timeInForegroundMs);

      const totalMs = filtered.reduce((acc, curr) => acc + curr.timeInForegroundMs, 0);

      setData({
        totalMs,
        apps: filtered
      });
    } catch (e) {
      console.warn("Failed to fetch usage stats:", e);
    } finally {
      setIsLoading(false);
    }
  }, [mode, targetDate]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    const granted = checkPermission();
    if (granted) {
      fetchStats();
    } else {
      setIsLoading(false);
      setData(null);
    }
  }, [checkPermission, fetchStats]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openSettings = useCallback(() => {
    if (MyModule) {
      MyModule.openUsageStatsSettings();
    }
  }, []);

  return {
    isSupported: Platform.OS === 'android' && !!MyModule,
    isPermissionGranted,
    isLoading,
    data,
    mode,
    setMode,
    targetDate,
    setTargetDate,
    refresh,
    openSettings
  };
}
