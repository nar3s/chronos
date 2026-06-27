import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useSyncStore } from '@/src/store/syncStore';
import { loadConfig, isConfigured } from '@/src/services/syncConfig';
import { registerStoreSubscriptions, syncAll, pushDirty } from '@/src/services/syncEngine';

const FOREGROUND_INTERVAL_MS = 5 * 60 * 1000;
const PUSH_DEBOUNCE_MS = 15_000;

export function useSync(): void {
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    registerStoreSubscriptions();

    const runFullSync = () => {
      if (!isConfigured()) return;
      syncAll().catch(() => {});
    };

    (async () => {
      await loadConfig();
      if (cancelled) return;
      runFullSync();
    })();

    intervalRef.current = setInterval(runFullSync, FOREGROUND_INTERVAL_MS);

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') runFullSync();
    });

    const unsubDirty = useSyncStore.subscribe((state, prev) => {
      if (state.dirty.length === 0) return;
      if (state.dirty === prev.dirty) return;
      if (!isConfigured()) return;
      if (pushTimer.current) clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(() => {
        pushTimer.current = null;
        pushDirty().catch(() => {});
      }, PUSH_DEBOUNCE_MS);
    });

    return () => {
      cancelled = true;
      if (pushTimer.current) clearTimeout(pushTimer.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      appStateSub.remove();
      unsubDirty();
    };
  }, []);
}
