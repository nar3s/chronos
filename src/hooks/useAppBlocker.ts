import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useDailySnapshot } from './useDailySnapshot';
import { useSettingsStore } from '@/src/store/settingsStore';

export function useAppBlocker() {
  const snapshot = useDailySnapshot();
  const blockerConfig = useSettingsStore((s) => s.blockerConfig);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    // Determine if daily logs are pending
    // Rule: Study > 0 AND gym satisfied AND protein > 0
    const isStudyDone = snapshot.todayStudyMinutes > 0;
    const isGymDone = snapshot.isGymDoneToday;
    const isProteinDone = snapshot.todayProteinGrams > 0;

    const isPending = !(isStudyDone && isGymDone && isProteinDone);

    // Only apply the block if enabled, after 9 PM (21:00), to force the habit at night
    const now = new Date();
    const isAfter9PM = now.getHours() >= 21;

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const MyModule = require('@/modules/my-module').default;

      if (blockerConfig?.enabled && isAfter9PM && isPending) {
        MyModule.setDailyLogPending(true);
      } else {
        MyModule.setDailyLogPending(false);
      }

      // Also sync the list of blocked packages to native
      if (MyModule.setBlockedPackages && blockerConfig?.blockedPackages) {
        MyModule.setBlockedPackages(blockerConfig.blockedPackages);
      }
    } catch (err) {
      // Native module might not be ready on web or Expo Go
      console.warn("AppBlocker native module not available.");
    }
  }, [
    blockerConfig,
    snapshot.todayStudyMinutes,
    snapshot.isGymDoneToday,
    snapshot.todayProteinGrams,
  ]);

  return null;
}
