import { getConfig } from './syncConfig';

const REQUEST_TIMEOUT_MS = 20_000;
const BLOB_ROW_ID = 'blob';

export interface BlobRow {
  payload: unknown;
  updatedAt: number;
  deletedAt: number | null;
}

export class SyncNotConfiguredError extends Error {
  constructor() {
    super('Sync is not configured');
    this.name = 'SyncNotConfiguredError';
  }
}

export class SyncHttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'SyncHttpError';
  }
}

function requireConfig() {
  const cfg = getConfig();
  if (!cfg) throw new SyncNotConfiguredError();
  return cfg;
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function callJson<T>(path: string, init: RequestInit, retryOn5xx = true): Promise<T> {
  const cfg = requireConfig();
  const url = `${cfg.apiUrl}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${cfg.token}`,
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };

  let response: Response;
  try {
    response = await fetchWithTimeout(url, { ...init, headers });
  } catch (err) {
    if (retryOn5xx) {
      response = await fetchWithTimeout(url, { ...init, headers });
    } else {
      throw err;
    }
  }

  if (!response.ok) {
    if (response.status >= 500 && retryOn5xx) {
      const retry = await fetchWithTimeout(url, { ...init, headers });
      if (!retry.ok) {
        const body = await retry.text().catch(() => '');
        throw new SyncHttpError(retry.status, body || retry.statusText);
      }
      return (await retry.json()) as T;
    }
    const body = await response.text().catch(() => '');
    throw new SyncHttpError(response.status, body || response.statusText);
  }
  return (await response.json()) as T;
}

export async function pushBlob(
  domain: string,
  payload: unknown,
  updatedAt: number,
  clientId?: string,
): Promise<{ accepted: string[]; rejected: Array<{ id: string; reason: string; serverUpdatedAt: number }> }> {
  return callJson('/v1/sync/push', {
    method: 'POST',
    body: JSON.stringify({
      domain,
      changes: [
        {
          id: BLOB_ROW_ID,
          payload,
          updatedAt,
          ...(clientId ? { clientId } : {}),
        },
      ],
    }),
  });
}

export async function pullBlob(
  domain: string,
  since: number,
): Promise<{ blob: BlobRow | null; serverTime: number }> {
  const result = await callJson<{ changes: Array<BlobRow & { id: string }>; serverTime: number }>(
    `/v1/sync/pull?domain=${encodeURIComponent(domain)}&since=${since}`,
    { method: 'GET' },
  );
  const blobRow = result.changes.find((c) => c.id === BLOB_ROW_ID) ?? null;
  return {
    blob: blobRow
      ? { payload: blobRow.payload, updatedAt: blobRow.updatedAt, deletedAt: blobRow.deletedAt }
      : null,
    serverTime: result.serverTime,
  };
}

export async function ping(): Promise<boolean> {
  try {
    const cfg = requireConfig();
    const res = await fetchWithTimeout(`${cfg.apiUrl}/v1/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}
