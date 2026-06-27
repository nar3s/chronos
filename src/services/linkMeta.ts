import { useReadLaterStore } from '@/src/store/readlaterStore';
import type { ReadLaterItem } from '@/src/domain/types/readlater';

export interface LinkMeta {
  title?: string;
  description?: string;
}

const FETCH_TIMEOUT_MS = 8000;
const MAX_HTML_BYTES = 600_000;

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&#x0*27;/gi, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstMatch(html: string, patterns: RegExp[]): string | undefined {
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]?.trim()) return decodeEntities(m[1]);
  }
  return undefined;
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function hostOf(url: string): string {
  return normalizeUrl(url)
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split(/[/?#]/)[0];
}

function isYouTube(url: string): boolean {
  const h = url.toLowerCase();
  return h.includes('youtube.com') || h.includes('youtu.be');
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        // Some sites serve bare/blocked HTML to unknown agents; a browser-ish
        // UA improves the odds of getting real og: tags back.
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchYouTubeMeta(url: string): Promise<LinkMeta> {
  // Keyless oEmbed endpoint — no API key, no third-party service.
  const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  const res = await fetchWithTimeout(endpoint);
  if (!res.ok) return {};
  const data: { title?: unknown; author_name?: unknown } = await res.json();
  return {
    title: typeof data.title === 'string' ? data.title.trim() : undefined,
    description:
      typeof data.author_name === 'string' && data.author_name.trim()
        ? `by ${data.author_name.trim()}`
        : undefined,
  };
}

async function fetchHtmlMeta(url: string): Promise<LinkMeta> {
  const res = await fetchWithTimeout(url);
  if (!res.ok) return {};
  const html = (await res.text()).slice(0, MAX_HTML_BYTES);

  const title = firstMatch(html, [
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
    /<title[^>]*>([^<]+)<\/title>/i,
  ]);

  const description = firstMatch(html, [
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
  ]);

  return { title, description };
}

/** Best-effort metadata fetch. Never throws — returns {} on any failure. */
export async function fetchLinkMeta(url: string): Promise<LinkMeta> {
  try {
    return isYouTube(url) ? await fetchYouTubeMeta(url) : await fetchHtmlMeta(url);
  } catch {
    return {};
  }
}

/**
 * Fetch metadata for a saved item and patch it in the background.
 * - Replaces the title only if it's still the bare host placeholder (so a
 *   user-typed or app-shared title is never overwritten).
 * - Fills the description only when one isn't already set.
 * Fire-and-forget; safe to call without awaiting.
 */
export async function enrichReadLaterMeta(itemId: string, url: string): Promise<void> {
  const meta = await fetchLinkMeta(url);
  if (!meta.title && !meta.description) return;

  const store = useReadLaterStore.getState();
  const item = store.getItemById(itemId);
  if (!item) return;

  const patch: Partial<ReadLaterItem> = {};
  if (meta.title && item.title === hostOf(item.url)) patch.title = meta.title;
  if (meta.description && !item.description) patch.description = meta.description;

  if (Object.keys(patch).length > 0) store.updateItem(itemId, patch);
}
