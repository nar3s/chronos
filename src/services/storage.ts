import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKUP_SUFFIX = ':backup';
const CORRUPT_SUFFIX = ':corrupt';

async function preserveCorruptValue(key: string, raw: string): Promise<void> {
  const backupKey = `${key}${CORRUPT_SUFFIX}:${Date.now()}`;
  try {
    await AsyncStorage.setItem(backupKey, raw);
  } catch {
    // Best-effort only. Read callers should still recover to defaults.
  }
}

async function backupCurrentValue(key: string): Promise<void> {
  try {
    const current = await AsyncStorage.getItem(key);
    if (current !== null) {
      await AsyncStorage.setItem(`${key}${BACKUP_SUFFIX}`, current);
    }
  } catch {
    // A failed backup should not block the primary write.
  }
}

export const storage = {
  async get<T>(key: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      console.warn(`Failed to parse persisted value for "${key}".`);
      await preserveCorruptValue(key, raw);
      return null;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    await backupCurrentValue(key);
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
};

export const zustandStorage = {
  getItem: async (name: string) => {
    const raw = await AsyncStorage.getItem(name);
    if (raw === null) return null;
    try {
      JSON.parse(raw);
      return raw;
    } catch {
      console.warn(`Failed to parse persisted store "${name}".`);
      await preserveCorruptValue(name, raw);
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    await backupCurrentValue(name);
    await AsyncStorage.setItem(name, value);
  },
  removeItem: (name: string) => AsyncStorage.removeItem(name),
};
