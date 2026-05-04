// Secure API for score submission via Edge Function
import { getLocalIdentity, setUsername, generateDefaultUsername } from './localIdentity';
import { generateDeviceFingerprint } from './deviceFingerprint';
import { supabase } from '@/integrations/supabase/client';
import { buildDecorationsString } from './decorations';
import { trackSent, trackSkipped } from './edgeFunctionMetrics';
import { clearGlobalCache } from './globalScoresApi';

// Track if username was recently changed (reset after first successful submission)
let usernameRecentlyChanged = false;

export function markUsernameChanged(): void {
  usernameRecentlyChanged = true;
}


// Constantes de configuration
const SUPABASE_URL = "https://zkhrtvgnzcufplzhophz.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpraHJ0dmduemN1ZnBsemhvcGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NjU1NjgsImV4cCI6MjA3NDE0MTU2OH0.3mYkFLKEqJFllX8487LdqnkEFXUw5Y4cZnzlZyfJ-a4";
const FETCH_LIMIT = 200; // Reduced from 1000 to limit egress

// ─── Client-side cache for leaderboard queries ───
const CACHE_TTL = 180_000; // 3 minutes
const CACHE_TTL_PREV_WEEK = 3_600_000; // 1 hour (previous week data never changes)
interface CacheEntry<T> { data: T; ts: number; ttl?: number; }
const queryCache = new Map<string, CacheEntry<Score[]>>();

function getCached(key: string): Score[] | null {
  const entry = queryCache.get(key);
  if (!entry) return null;
  const ttl = entry.ttl ?? CACHE_TTL;
  if (Date.now() - entry.ts > ttl) {
    queryCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: Score[], ttl?: number) {
  queryCache.set(key, { data, ts: Date.now(), ttl });
}

// Enhanced anti-spam
let lastSubmitTime = 0;
let gameSessionStart = 0;
const SUBMIT_COOLDOWN = 3000; // 3 secondes

// Idempotence & anti-burst guards
let isSubmitting = false;
let hasSubmittedThisGame = false;
let currentSubmissionId: string | null = null;

export interface Score {
  username: string;
  score: number;
  created_at: string;
  weekly_updated_at?: string;
  decorations?: string | null;
}

export interface SubmitScoreParams {
  score: number;
  mode: string;
}

const VALID_MODES = ['classic', 'arc_changeant', 'survie_60s', 'zone_mobile', 'zone_traitresse', 'memoire_expert', 'pong_circulaire'];

function generateSubmissionId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function submitScore({ score, mode }: SubmitScoreParams): Promise<boolean> {
  try {
    // Guard: already submitting
    if (isSubmitting) {
      trackSkipped('submit-score', 'already-submitting');
      return false;
    }

    // Guard: already submitted this game
    if (hasSubmittedThisGame) {
      trackSkipped('submit-score', 'already-submitted-this-game');
      return false;
    }

    // Basic client-side validation
    if (typeof score !== 'number' || score < 2) {
      console.warn('Score invalide:', score);
      return false;
    }

    if (!VALID_MODES.includes(mode)) {
      console.warn('Mode invalide:', mode);
      return false;
    }

    // Skip if score is below local best AND we already submitted this week
    // (weekly/monthly resets require at least one submission to go through)
    const localBestKey = `localBest_${mode}`;
    const localBestData = (() => {
      try {
        const raw = localStorage.getItem(localBestKey);
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    })();
    if (localBestData && score < localBestData.best) {
      // Check if we're still in the same week (allow first submit after weekly reset)
      const checkDate = new Date();
      const day = checkDate.getDay();
      const diff = checkDate.getDate() - day + (day === 0 ? -6 : 1);
      const weekMonday = new Date(checkDate);
      weekMonday.setDate(diff);
      weekMonday.setHours(0, 0, 0, 0);
      const monthStart = new Date(checkDate.getFullYear(), checkDate.getMonth(), 1).getTime();

      if (localBestData.lastSubmitAt > weekMonday.getTime() && localBestData.lastSubmitAt > monthStart) {
        trackSkipped('submit-score', `below-local-best-${localBestData.best}`);
        return false;
      }
    }

    // Enhanced anti-spam
    const now = Date.now();
    if (now - lastSubmitTime < SUBMIT_COOLDOWN) {
      trackSkipped('submit-score', `cooldown-${SUBMIT_COOLDOWN - (now - lastSubmitTime)}ms`);
      return false;
    }

    const identity = getLocalIdentity();
    let { username } = identity;
    const { deviceId } = identity;

    if (!username) {
      throw new Error('USERNAME_REQUIRED');
    }

    isSubmitting = true;

    // Generate enhanced device fingerprint
    const clientFingerprint = generateDeviceFingerprint();
    const decorations = buildDecorationsString();
    const submissionId = currentSubmissionId || generateSubmissionId();

    // Call the secure Edge Function
    const shouldConsolidate = usernameRecentlyChanged;
    trackSent('submit-score');
    const { data, error } = await supabase.functions.invoke('submit-score', {
      body: {
        device_id: deviceId,
        username,
        score,
        mode,
        session_start_time: gameSessionStart || now - 10000,
        client_fingerprint: clientFingerprint,
        decorations,
        submission_id: submissionId,
        username_changed: shouldConsolidate
      }
    });

    // Clear the flag after successful submission with consolidation
    if (shouldConsolidate && !error && data?.success) {
      usernameRecentlyChanged = false;
    }

    if (error) {
      console.error('Edge Function error:', error);
      return false;
    }

    if (!data?.success) {
      console.warn('Score submission failed:', data?.error);
      return false;
    }

    lastSubmitTime = now;
    hasSubmittedThisGame = true;
    // Update local best for skip optimization
    try {
      const prev = (() => { try { const r = localStorage.getItem(`localBest_${mode}`); return r ? JSON.parse(r) : null; } catch { return null; } })();
      const newBest = Math.max(score, prev?.best || 0);
      localStorage.setItem(`localBest_${mode}`, JSON.stringify({ best: newBest, lastSubmitAt: now }));
    } catch { /* ignore storage errors */ }
    // Invalidate leaderboard cache so the player sees their new score
    queryCache.clear();
    clearGlobalCache();
    return true;

  } catch (error) {
    if (error instanceof Error && error.message === 'USERNAME_REQUIRED') {
      throw error;
    }
    console.error('Erreur lors de la soumission du score:', error);
    return false;
  } finally {
    isSubmitting = false;
  }
}

export async function fetchTop(mode: string, limit: number = FETCH_LIMIT): Promise<Score[]> {
  try {
    if (!VALID_MODES.includes(mode)) {
      console.warn('Mode invalide pour fetchTop:', mode);
      return [];
    }

    const cacheKey = `top_${mode}_${limit}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('scores')
      .select('username,best_score,created_at,decorations')
      .eq('mode', mode)
      .order('best_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }

    // Dédupliquer par username : meilleur score + décorations les plus récentes (created_at le plus tardif)
    const seen = new Map<string, Score & { _latest_at: string }>();
    for (const entry of (data || [])) {
      const existing = seen.get(entry.username);
      const entryAt = entry.created_at || '';
      if (!existing) {
        seen.set(entry.username, {
          username: entry.username,
          score: entry.best_score,
          created_at: entry.created_at,
          decorations: entry.decorations,
          _latest_at: entryAt,
        });
      } else {
        if (entry.best_score > existing.score) {
          existing.score = entry.best_score;
          existing.created_at = entry.created_at;
        }
        if (entryAt > existing._latest_at) {
          existing.decorations = entry.decorations;
          existing._latest_at = entryAt;
        }
      }
    }

    const result = Array.from(seen.values())
      .map(({ _latest_at, ...s }) => s)
      .sort((a, b) => b.score - a.score);
    setCache(cacheKey, result);
    return result;

  } catch (error) {
    console.error('Erreur lors de la récupération du classement:', error);
    return [];
  }
}

export async function fetchWeeklyTop(mode: string, limit: number = FETCH_LIMIT): Promise<Score[]> {
  try {
    if (!VALID_MODES.includes(mode)) {
      console.warn('Mode invalide pour fetchWeeklyTop:', mode);
      return [];
    }

    const cacheKey = `weekly_${mode}_${limit}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('scores')
      .select('username,weekly_score,weekly_updated_at,decorations')
      .eq('mode', mode)
      .gte('weekly_updated_at', monday.toISOString())
      .order('weekly_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching weekly leaderboard:', error);
      return [];
    }

    const seen = new Map<string, Score & { _latest_at: string }>();
    for (const entry of (data || [])) {
      const existing = seen.get(entry.username);
      const entryAt = entry.weekly_updated_at || '';
      if (!existing) {
        seen.set(entry.username, {
          username: entry.username,
          score: entry.weekly_score,
          created_at: entry.weekly_updated_at || '',
          decorations: entry.decorations,
          _latest_at: entryAt,
        });
      } else {
        if (entry.weekly_score > existing.score) {
          existing.score = entry.weekly_score;
          existing.created_at = entry.weekly_updated_at || '';
        }
        if (entryAt > existing._latest_at) {
          existing.decorations = entry.decorations;
          existing._latest_at = entryAt;
        }
      }
    }

    const result = Array.from(seen.values())
      .map(({ _latest_at, ...s }) => s)
      .sort((a, b) => b.score - a.score);
    setCache(cacheKey, result);
    return result;

  } catch (error) {
    console.error('Erreur lors de la récupération du classement hebdomadaire:', error);
    return [];
  }
}

export async function fetchPreviousWeekTop(mode: string, limit: number = 50): Promise<Score[]> {
  try {
    if (!VALID_MODES.includes(mode)) {
      console.warn('Mode invalide pour fetchPreviousWeekTop:', mode);
      return [];
    }

    const cacheKey = `prev_${mode}_${limit}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const currentMonday = new Date(now);
    currentMonday.setDate(diff);
    currentMonday.setHours(0, 0, 0, 0);

    const previousMonday = new Date(currentMonday);
    previousMonday.setDate(currentMonday.getDate() - 7);
    
    const previousSunday = new Date(previousMonday);
    previousSunday.setDate(previousMonday.getDate() + 6);
    previousSunday.setHours(23, 59, 59, 999);

    // Source 1: Already archived previous week scores
    const [archivedResult, unarchivedResult] = await Promise.all([
      supabase
        .from('scores')
        .select('username,previous_weekly_score,previous_weekly_updated_at,decorations')
        .eq('mode', mode)
        .gte('previous_weekly_updated_at', previousMonday.toISOString())
        .lte('previous_weekly_updated_at', previousSunday.toISOString())
        .gt('previous_weekly_score', 0)
        .order('previous_weekly_score', { ascending: false })
        .limit(limit),
      // Source 2: Not yet archived — weekly_updated_at is in previous week (player hasn't played this week yet)
      supabase
        .from('scores')
        .select('username,weekly_score,weekly_updated_at,decorations')
        .eq('mode', mode)
        .gte('weekly_updated_at', previousMonday.toISOString())
        .lte('weekly_updated_at', previousSunday.toISOString())
        .gt('weekly_score', 0)
        .order('weekly_score', { ascending: false })
        .limit(limit)
    ]);

    if (archivedResult.error) {
      console.error('Error fetching archived previous week:', archivedResult.error);
    }
    if (unarchivedResult.error) {
      console.error('Error fetching unarchived previous week:', unarchivedResult.error);
    }

    // Merge both sources, deduplicate by username (keep best score)
    const seen = new Map<string, Score>();

    for (const entry of (archivedResult.data || [])) {
      const existing = seen.get(entry.username);
      if (!existing || entry.previous_weekly_score > existing.score) {
        seen.set(entry.username, {
          username: entry.username,
          score: entry.previous_weekly_score,
          created_at: entry.previous_weekly_updated_at || '',
          decorations: entry.decorations,
        });
      }
    }

    for (const entry of (unarchivedResult.data || [])) {
      const existing = seen.get(entry.username);
      if (!existing || entry.weekly_score > existing.score) {
        seen.set(entry.username, {
          username: entry.username,
          score: entry.weekly_score,
          created_at: entry.weekly_updated_at || '',
          decorations: entry.decorations,
        });
      }
    }

    const result = Array.from(seen.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    setCache(cacheKey, result, CACHE_TTL_PREV_WEEK);
    return result;

  } catch (error) {
    console.error('Erreur lors de la récupération du classement de la semaine précédente:', error);
    return [];
  }
}

export function setUsernameForScores(username: string): void {
  setUsername(username);
  markUsernameChanged();
}

// Function to mark the start of a game session for timing validation
export function startGameSession(): void {
  gameSessionStart = Date.now();
  hasSubmittedThisGame = false;
  currentSubmissionId = generateSubmissionId();
}

// Reset submission flag after a revive so the next (higher) final score can be submitted
export function resetSubmissionAfterRevive(): void {
  hasSubmittedThisGame = false;
  currentSubmissionId = generateSubmissionId();
}
