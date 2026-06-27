import * as SecureStore from 'expo-secure-store';

const KEY_API_URL = 'chronos.sync.apiUrl';
const KEY_TOKEN = 'chronos.sync.token';

export interface SyncConfig {
  apiUrl: string;
  token: string;
}

let cached: SyncConfig | null = null;
let loaded = false;

export async function loadConfig(): Promise<SyncConfig | null> {
  if (loaded) return cached;
  const [apiUrl, token] = await Promise.all([
    SecureStore.getItemAsync(KEY_API_URL),
    SecureStore.getItemAsync(KEY_TOKEN),
  ]);
  loaded = true;
  if (apiUrl && token) {
    cached = { apiUrl: apiUrl.trim().replace(/\/$/, ''), token: token.trim() };
  } else {
    cached = null;
  }
  return cached;
}

export function getConfig(): SyncConfig | null {
  return cached;
}

export async function setConfig(next: SyncConfig): Promise<void> {
  const apiUrl = next.apiUrl.trim().replace(/\/$/, '');
  const token = next.token.trim();
  await Promise.all([
    SecureStore.setItemAsync(KEY_API_URL, apiUrl),
    SecureStore.setItemAsync(KEY_TOKEN, token),
  ]);
  cached = { apiUrl, token };
  loaded = true;
}

export async function clearConfig(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEY_API_URL),
    SecureStore.deleteItemAsync(KEY_TOKEN),
  ]);
  cached = null;
  loaded = true;
}

export function isConfigured(): boolean {
  return cached !== null;
}
