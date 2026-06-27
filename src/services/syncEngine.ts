import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStudyStore } from '@/src/store/studyStore';
import { useStudyPlanStore } from '@/src/store/studyPlanStore';
import { useGymStore } from '@/src/store/gymStore';
import { useNutritionStore } from '@/src/store/nutritionStore';
import { useSnapshotStore } from '@/src/store/snapshotStore';
import { useHabitStore } from '@/src/store/habitStore';
import { useBookmarkStore } from '@/src/store/bookmarkStore';
import { useDiaryStore } from '@/src/store/diaryStore';
import { useMemoryStore } from '@/src/store/memoryStore';
import { useSettingsStore } from '@/src/store/settingsStore';
import { useSyncStore, SyncDomain } from '@/src/store/syncStore';
import { pushBlob, pullBlob, SyncNotConfiguredError } from './syncClient';
import { isConfigured } from './syncConfig';

interface DomainBinding {
  domain: SyncDomain;
  storageKey: string;
  // Zustand store with persist middleware. Typed loosely because each store
  // has a different state shape — we treat the persisted slice as opaque JSON.
  store: {
    getState: () => any;
    persist: {
      rehydrate: () => Promise<void> | void;
      hasHydrated: () => boolean;
      onFinishHydration: (cb: () => void) => () => void;
    };
    subscribe: (listener: (state: any, prev: any) => void) => () => void;
  };
}

const BINDINGS: DomainBinding[] = [
  { domain: 'study_sessions', storageKey: 'study-store-v2', store: useStudyStore as any },
  { domain: 'study_plans', storageKey: 'study-plan-v1', store: useStudyPlanStore as any },
  { domain: 'gym_sessions', storageKey: 'gym-store-v2', store: useGymStore as any },
  { domain: 'nutrition_logs', storageKey: 'nutrition-store-v2', store: useNutritionStore as any },
  { domain: 'snapshots', storageKey: 'snapshot-store-v2', store: useSnapshotStore as any },
  { domain: 'habits', storageKey: 'habit-v1', store: useHabitStore as any },
  { domain: 'bookmarks', storageKey: 'bookmarks-v1', store: useBookmarkStore as any },
  { domain: 'diary_entries', storageKey: 'diary-v1', store: useDiaryStore as any },
  { domain: 'memories', storageKey: 'memory-v1', store: useMemoryStore as any },
  { domain: 'settings', storageKey: 'settings-v1', store: useSettingsStore as any },
];

// Per-domain guard so a pull-driven setState doesn't re-mark the store dirty.
const applyingPull: Partial<Record<SyncDomain, boolean>> = {};

let subscribed = false;

export function bindings(): readonly DomainBinding[] {
  return BINDINGS;
}

/**
 * Subscribe to every Zustand store after hydration and mark its domain dirty
 * on user/app changes. Hydration itself should not create pending sync work.
 */
export function registerStoreSubscriptions(): void {
  if (subscribed) return;
  subscribed = true;

  for (const binding of BINDINGS) {
    const subscribeAfterHydration = () => {
      binding.store.subscribe((_state, _prev) => {
        if (applyingPull[binding.domain]) return;
        useSyncStore.getState().markDirty(binding.domain);
      });
    };

    if (binding.store.persist.hasHydrated()) {
      subscribeAfterHydration();
      continue;
    }

    binding.store.persist.onFinishHydration(subscribeAfterHydration);
  }
}

async function readPersistedBlob(storageKey: string): Promise<unknown | null> {
  const raw = await AsyncStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.state ?? null;
  } catch {
    return null;
  }
}

async function writePersistedBlob(storageKey: string, state: unknown): Promise<void> {
  const raw = await AsyncStorage.getItem(storageKey);
  let wrapper: any = { state, version: 0 };
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      wrapper = { ...parsed, state };
    } catch {
      // fall through to default wrapper
    }
  }
  await AsyncStorage.setItem(storageKey, JSON.stringify(wrapper));
}

function isPushAccepted(
  result: Awaited<ReturnType<typeof pushBlob>>,
): boolean {
  return result.accepted.includes('blob') && result.rejected.length === 0;
}

async function pushDomain(binding: DomainBinding): Promise<boolean> {
  const payload = await readPersistedBlob(binding.storageKey);
  if (payload === null) return false;
  const result = await pushBlob(binding.domain, payload, Date.now());
  if (!isPushAccepted(result)) {
    const rejection = result.rejected.find((item) => item.id === 'blob');
    throw new Error(rejection?.reason ?? 'server rejected blob');
  }
  useSyncStore.getState().clearDirty(binding.domain);
  return true;
}

async function pullDomain(binding: DomainBinding): Promise<boolean> {
  const since = useSyncStore.getState().lastPulledAt[binding.domain] ?? 0;
  const { blob, serverTime } = await pullBlob(binding.domain, since);
  if (blob && blob.deletedAt == null) {
    applyingPull[binding.domain] = true;
    try {
      await writePersistedBlob(binding.storageKey, blob.payload);
      await binding.store.persist.rehydrate();
    } finally {
      applyingPull[binding.domain] = false;
    }
  }
  useSyncStore.getState().setLastPulledAt(binding.domain, serverTime);
  return Boolean(blob && blob.deletedAt == null);
}

function allHydrated(): boolean {
  return (
    useSyncStore.persist.hasHydrated() &&
    BINDINGS.every((b) => b.store.persist.hasHydrated())
  );
}

export async function waitForHydration(): Promise<void> {
  if (allHydrated()) return;
  await new Promise<void>((resolve) => {
    const unsubs: Array<() => void> = [];
    const check = () => {
      if (allHydrated()) {
        unsubs.forEach((u) => u());
        resolve();
      }
    };
    for (const b of BINDINGS) {
      if (!b.store.persist.hasHydrated()) {
        unsubs.push(b.store.persist.onFinishHydration(check));
      }
    }
    if (!useSyncStore.persist.hasHydrated()) {
      unsubs.push(useSyncStore.persist.onFinishHydration(check));
    }
    check();
  });
}

/**
 * Sync every domain. Dirty domains push before pulling so pending local edits
 * are not overwritten by a remote blob. Clean first-time domains pull first,
 * then seed the server only when no remote blob exists.
 *
 * A single domain's failure (auth error, network blip, validation reject) must
 * not abort the rest — it would leave the other 9 stores un-synced for the
 * whole interval. Per-domain errors are collected and surfaced as one message.
 */
export async function syncAll(): Promise<void> {
  if (!isConfigured()) return;
  const sync = useSyncStore.getState();
  if (sync.isSyncing) return;
  sync.setIsSyncing(true);
  sync.setLastError(null);
  const errors: string[] = [];
  try {
    await waitForHydration();
    for (const binding of BINDINGS) {
      const isDirty = useSyncStore.getState().dirty.includes(binding.domain);
      try {
        if (isDirty) {
          await pushDomain(binding);
          await pullDomain(binding);
          continue;
        }

        const hasSyncedDomain = Boolean(useSyncStore.getState().lastPulledAt[binding.domain]);
        const hadRemoteBlob = await pullDomain(binding);
        if (!hadRemoteBlob && !hasSyncedDomain) {
          await pushDomain(binding);
        }
      } catch (err) {
        if (err instanceof SyncNotConfiguredError) throw err;
        errors.push(`${binding.domain}: ${(err as Error).message}`);
      }
    }
    sync.setLastSyncAt(Date.now());
    if (errors.length > 0) {
      sync.setLastError(errors.join('; '));
    }
  } catch (err) {
    sync.setLastError((err as Error).message);
  } finally {
    sync.setIsSyncing(false);
  }
}

/**
 * Push only — skip the pull leg. Used by the debounced mutation trigger so
 * the 15s "user is typing" debounce doesn't also drag down every other domain.
 */
export async function pushDirty(): Promise<void> {
  if (!isConfigured()) return;
  const sync = useSyncStore.getState();
  if (sync.isSyncing) return;
  const dirty = [...sync.dirty];
  if (dirty.length === 0) return;
  sync.setIsSyncing(true);
  sync.setLastError(null);
  const errors: string[] = [];
  try {
    await waitForHydration();
    for (const domain of dirty) {
      const binding = BINDINGS.find((b) => b.domain === domain);
      if (!binding) continue;
      try {
        await pushDomain(binding);
      } catch (err) {
        errors.push(`${binding.domain}: ${(err as Error).message}`);
      }
    }
    sync.setLastSyncAt(Date.now());
    if (errors.length > 0) {
      sync.setLastError(errors.join('; '));
    }
  } catch (err) {
    sync.setLastError((err as Error).message);
  } finally {
    sync.setIsSyncing(false);
  }
}
