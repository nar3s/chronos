import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useDailySnapshot } from './useDailySnapshot';
import { useSettingsStore } from '@/src/store/settingsStore';
import { useSnapshotStore } from '@/src/store/snapshotStore';
import { useStudyStore } from '@/src/store/studyStore';
import { useGymStore } from '@/src/store/gymStore';
import { useNutritionStore } from '@/src/store/nutritionStore';

type AppBlockerModule = {
  setDailyLogPending: (pending: boolean) => void;
  setBlockedPackages?: (packages: string[]) => void;
};

let nativeModule: AppBlockerModule | null | undefined;
let didWarnMissingNativeModule = false;

function getAppBlockerModule(): AppBlockerModule | null {
  if (nativeModule !== undefined) return nativeModule;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    nativeModule = require('@/modules/my-module').default as AppBlockerModule;
  } catch {
    nativeModule = null;
    if (!didWarnMissingNativeModule) {
      didWarnMissingNativeModule = true;
      console.warn('AppBlocker native module not available.');
    }
  }

  return nativeModule;
}

function areBlockerStoresHydrated(): boolean {
  return (
    useSettingsStore.persist.hasHydrated() &&
    useSnapshotStore.persist.hasHydrated() &&
    useStudyStore.persist.hasHydrated() &&
    useGymStore.persist.hasHydrated() &&
    useNutritionStore.persist.hasHydrated()
  );
}

export function useAppBlocker() {
  const snapshot = useDailySnapshot();
  const blockerConfig = useSettingsStore((s) => s.blockerConfig);
  const scheduleConfig = useSettingsStore((s) => s.scheduleConfig);
  const [timeCheckKey, setTimeCheckKey] = useState(() => Date.now());
  const [storesHydrated, setStoresHydrated] = useState(areBlockerStoresHydrated);

  useEffect(() => {
    if (storesHydrated) return;

    const markReadyIfHydrated = () => {
      if (areBlockerStoresHydrated()) {
        setStoresHydrated(true);
      }
    };

    const unsubscribers = [
      useSettingsStore.persist.onFinishHydration(markReadyIfHydrated),
      useSnapshotStore.persist.onFinishHydration(markReadyIfHydrated),
      useStudyStore.persist.onFinishHydration(markReadyIfHydrated),
      useGymStore.persist.onFinishHydration(markReadyIfHydrated),
      useNutritionStore.persist.onFinishHydration(markReadyIfHydrated),
    ];

    markReadyIfHydrated();

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [storesHydrated]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const refreshTimeCheck = () => setTimeCheckKey(Date.now());
    const interval = setInterval(refreshTimeCheck, 60 * 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshTimeCheck();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    if (!storesHydrated) return;

    // Rule: study/gym/protein each either logged or explicitly skipped today.
    const isStudyDone = snapshot.isStudyDoneOrSkipped;
    const isGymDone = snapshot.isGymDoneToday;
    const isProteinDone = snapshot.isProteinDoneOrSkipped;

    const isPending = !(isStudyDone && isGymDone && isProteinDone);

    const blockerActiveFromHour = scheduleConfig?.blockerActiveFromHour ?? 21;
    const now = new Date();
    const isAfter9PM = now.getHours() >= blockerActiveFromHour;

    const MyModule = getAppBlockerModule();
    if (!MyModule) return;

    if (blockerConfig?.enabled && isAfter9PM && isPending) {
      MyModule.setDailyLogPending(true);
    } else {
      MyModule.setDailyLogPending(false);
    }

    // Also sync the list of blocked packages to native
    if (MyModule.setBlockedPackages && blockerConfig?.blockedPackages) {
      MyModule.setBlockedPackages(blockerConfig.blockedPackages);
    }
  }, [
    blockerConfig,
    scheduleConfig,
    snapshot.isStudyDoneOrSkipped,
    snapshot.isGymDoneToday,
    snapshot.isProteinDoneOrSkipped,
    storesHydrated,
    timeCheckKey,
  ]);

  return null;
}
