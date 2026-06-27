import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { useShareIntent } from 'expo-share-intent';
import { useReadLaterStore } from '@/src/store/readlaterStore';
import { enrichReadLaterMeta } from '@/src/services/linkMeta';
import { getToday } from '@/src/utils/dates';
import type { ReadLaterType } from '@/src/domain/types/readlater';

function extractUrl(raw: string): string {
  const match = raw.match(/https?:\/\/[^\s]+/i);
  return (match ? match[0] : raw).trim();
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

function detectType(url: string): ReadLaterType {
  const h = url.toLowerCase();
  if (h.includes('youtube.com') || h.includes('youtu.be')) return 'video';
  if (h.includes('x.com') || h.includes('twitter.com')) return 'x';
  return 'article';
}

/**
 * Catches links shared into the app from other apps (YouTube, Chrome, X, ...)
 * via the OS share sheet and drops them straight into the Read Later store.
 * Fully offline — no third-party service. Requires a native dev/standalone
 * build (the share target is registered at build time; Expo Go won't show it).
 */
export function useShareCapture(): void {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
  const addItem = useReadLaterStore((s) => s.addItem);
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hasShareIntent) {
      handledRef.current = null;
      return;
    }

    const raw = (shareIntent.webUrl ?? shareIntent.text ?? '').trim();
    if (!raw) {
      resetShareIntent();
      return;
    }

    // Guard against the effect firing twice for the same shared payload.
    if (handledRef.current === raw) return;
    handledRef.current = raw;

    const url = normalizeUrl(extractUrl(raw));
    const title = shareIntent.meta?.title?.trim() || hostOf(url);
    const id = Date.now().toString();

    addItem({
      id,
      url,
      title,
      type: detectType(url),
      date: getToday(),
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    // Background best-effort title/description fetch (no third-party service).
    void enrichReadLaterMeta(id, url);

    resetShareIntent();
    router.push('/more/read-later' as any);
  }, [hasShareIntent, shareIntent, addItem, resetShareIntent]);
}
