/**
 * Daily Precision Challenge — one attempt per day
 * Timer runs fast with 3 decimals, target between 7.000 and 13.000
 */

const DAILY_CHALLENGE_KEY = 'ls_daily_challenge';

interface DailyChallengeState {
  date: string; // YYYY-MM-DD
  played: boolean;
  target: number;
  result?: number;
  gap?: number;
}

/** Deterministic daily seed from date string */
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  // Normalize to 0-1
  const x = Math.sin(hash) * 10000;
  return x - Math.floor(x);
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Get today's target (same for all players on a given day) */
export function getDailyTarget(): number {
  const today = getTodayKey();
  const rand = seededRandom(`lucky-stop-daily-${today}`);
  // Between 7.000 and 13.000 with 3 decimals
  const target = 7 + rand * 6;
  return Math.round(target * 1000) / 1000;
}

/** Check if the player has already played today */
export function hasPlayedToday(): boolean {
  const raw = localStorage.getItem(DAILY_CHALLENGE_KEY);
  if (!raw) return false;
  try {
    const state: DailyChallengeState = JSON.parse(raw);
    return state.date === getTodayKey() && state.played;
  } catch {
    return false;
  }
}

/** Get today's result if played */
export function getTodayResult(): { result: number; gap: number; target: number } | null {
  const raw = localStorage.getItem(DAILY_CHALLENGE_KEY);
  if (!raw) return null;
  try {
    const state: DailyChallengeState = JSON.parse(raw);
    if (state.date === getTodayKey() && state.played && state.result !== undefined && state.gap !== undefined) {
      return { result: state.result, gap: state.gap, target: state.target };
    }
  } catch {}
  return null;
}

/** Record today's result */
export function recordDailyResult(stoppedAt: number): { gap: number; target: number } {
  const target = getDailyTarget();
  const gap = Math.abs(stoppedAt - target);
  const roundedGap = Math.round(gap * 1000) / 1000;

  const state: DailyChallengeState = {
    date: getTodayKey(),
    played: true,
    target,
    result: stoppedAt,
    gap: roundedGap,
  };
  localStorage.setItem(DAILY_CHALLENGE_KEY, JSON.stringify(state));
  return { gap: roundedGap, target };
}

/** Get best ever daily challenge gap */
export function getDailyBestGap(): number | null {
  const raw = localStorage.getItem('ls_daily_challenge_best');
  if (!raw) return null;
  return parseFloat(raw);
}

export function updateDailyBest(gap: number) {
  const current = getDailyBestGap();
  if (current === null || gap < current) {
    localStorage.setItem('ls_daily_challenge_best', String(gap));
  }
}

/** Seconds until midnight (next challenge) */
export function getSecondsUntilNextChallenge(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return Math.floor((tomorrow.getTime() - now.getTime()) / 1000);
}

/** Format seconds to HH:MM:SS */
export function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
