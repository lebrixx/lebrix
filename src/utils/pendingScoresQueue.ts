// Offline queue for score submissions.
// Enqueues scores that couldn't reach the edge function (no network / transport error)
// and flushes them later. Idempotence is guaranteed via `submission_id`
// (the edge function tracks processed IDs, duplicates return { success: true, duplicate: true }).

import { supabase } from '@/integrations/supabase/client';
import { clearGlobalCache } from './globalScoresApi';

const STORAGE_KEY = 'pending_scores_v1';
const MAX_ENTRIES = 20;
const RETRY_SPACING_MS = 250; // small gap between retries to avoid burst
const MAX_AGE_MS = 48 * 60 * 60 * 1000; // 48h — beyond that we drop silently

export interface PendingScore {
  submission_id: string;
  device_id: string;
  username: string;
  score: number;
  mode: string;
  session_start_time: number;
  client_fingerprint: string;
  decorations: string;
  username_changed: boolean;
  queued_at: number;
}

function readAll(): PendingScore[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeAll(entries: PendingScore[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch { /* quota — ignore */ }
}

export function enqueuePendingScore(entry: PendingScore): void {
  const all = readAll();
  // Drop stale entries first
  const fresh = all.filter(e => Date.now() - e.queued_at < MAX_AGE_MS);
  // Avoid duplicate submission_id
  if (fresh.some(e => e.submission_id === entry.submission_id)) return;
  fresh.push(entry);
  // Cap size (drop oldest)
  while (fresh.length > MAX_ENTRIES) fresh.shift();
  writeAll(fresh);
}

export function getPendingCount(): number {
  return readAll().length;
}

let isFlushing = false;

export async function flushPendingScores(): Promise<void> {
  if (isFlushing) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

  const all = readAll();
  if (all.length === 0) return;

  isFlushing = true;
  try {
    const remaining: PendingScore[] = [];
    let anySuccess = false;

    let firstIter = true;
    for (const entry of all) {
      // Drop entries older than max age
      if (Date.now() - entry.queued_at >= MAX_AGE_MS) continue;

      // Small gap between retries to avoid hitting server rate limits in a burst
      if (!firstIter) {
        await new Promise(r => setTimeout(r, RETRY_SPACING_MS));
      }
      firstIter = false;

      try {
        const { data, error } = await supabase.functions.invoke('submit-score', {
          body: {
            device_id: entry.device_id,
            username: entry.username,
            score: entry.score,
            mode: entry.mode,
            session_start_time: entry.session_start_time,
            client_fingerprint: entry.client_fingerprint,
            decorations: entry.decorations,
            submission_id: entry.submission_id,
            username_changed: entry.username_changed,
          },
        });

        if (error) {
          // Transport / network error → keep for later
          remaining.push(entry);
          // Stop early — likely offline again
          const idx = all.indexOf(entry);
          if (idx >= 0) remaining.push(...all.slice(idx + 1));
          break;
        }

        // Server responded. Whether success or logical failure (validation),
        // drop the entry — retrying won't change the outcome. Idempotence covers duplicates.
        if (data?.success) anySuccess = true;
      } catch {
        // Thrown = network error; keep and stop
        remaining.push(entry);
        const idx = all.indexOf(entry);
        if (idx >= 0) remaining.push(...all.slice(idx + 1));
        break;
      }
    }

    writeAll(remaining);
    if (anySuccess) {
      try { clearGlobalCache(); } catch { /* ignore */ }
    }
  } finally {
    isFlushing = false;
  }
}

/** Install listeners to auto-flush when connectivity returns. Safe to call multiple times. */
let listenersInstalled = false;
export function installPendingScoresAutoFlush(): void {
  if (listenersInstalled || typeof window === 'undefined') return;
  listenersInstalled = true;
  window.addEventListener('online', () => { flushPendingScores(); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') flushPendingScores();
  });
}
