import { supabase } from '@/integrations/supabase/client';
import { getDeviceId, getUsername } from '@/utils/localIdentity';
import { getEquippedDecorationId, getEquippedUsernameColor } from '@/utils/seasonPass';

const SUPABASE_URL = "https://zkhrtvgnzcufplzhophz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpraHJ0dmduemN1ZnBsemhvcGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NjU1NjgsImV4cCI6MjA3NDE0MTU2OH0.3mYkFLKEqJFllX8487LdqnkEFXUw5Y4cZnzlZyfJ-a4";

export interface PrecisionEntry {
  id: string;
  username: string;
  target: number;
  result: number;
  gap: number;
  challenge_date: string;
  decorations: string | null;
}

// ─── Cache ───
const CACHE_TTL = 60_000; // 60 seconds
let todayCache: { data: PrecisionEntry[]; ts: number } | null = null;
let yesterdayCache: { data: PrecisionEntry[]; ts: number } | null = null;

export function clearPrecisionCache() {
  todayCache = null;
  yesterdayCache = null;
}

/** Build decorations string from equipped items */
function buildDecorationsString(): string | null {
  const parts: string[] = [];
  const decoId = getEquippedDecorationId();
  if (decoId) parts.push(decoId);
  const color = getEquippedUsernameColor();
  if (color === 'violet') parts.push('purple_name');
  else if (color === 'pulse') parts.push('pulse_name');
  else if (color === 'gold_pulse') parts.push('gold_pulse_name');
  return parts.length > 0 ? parts.join(',') : null;
}

/** Submit precision score to the edge function */
export async function submitPrecisionScore(target: number, result: number, gap: number): Promise<boolean> {
  const username = getUsername();
  if (!username) return false;

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/submit-precision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
      },
      body: JSON.stringify({
        device_id: getDeviceId(),
        username,
        target,
        result,
        gap,
        decorations: buildDecorationsString(),
      }),
    });
    // Invalidate today cache after submission
    todayCache = null;
    return res.ok;
  } catch {
    return false;
  }
}

/** Fetch today's leaderboard (top 1000) — cached 60s */
export async function fetchDailyPrecisionLeaderboard(): Promise<PrecisionEntry[]> {
  if (todayCache && Date.now() - todayCache.ts < CACHE_TTL) {
    return todayCache.data;
  }

  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('daily_precision_scores' as any)
    .select('id, username, target, result, gap, challenge_date, decorations')
    .eq('challenge_date', today)
    .order('gap', { ascending: true })
    .limit(1000);

  if (error || !data) return [];
  const result = data as unknown as PrecisionEntry[];
  todayCache = { data: result, ts: Date.now() };
  return result;
}

/** Fetch yesterday's leaderboard (top 50) — cached 60s */
export async function fetchYesterdayPrecisionLeaderboard(): Promise<PrecisionEntry[]> {
  if (yesterdayCache && Date.now() - yesterdayCache.ts < CACHE_TTL) {
    return yesterdayCache.data;
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('daily_precision_scores' as any)
    .select('id, username, target, result, gap, challenge_date, decorations')
    .eq('challenge_date', yesterday)
    .order('gap', { ascending: true })
    .limit(50);

  if (error || !data) return [];
  const result = data as unknown as PrecisionEntry[];
  yesterdayCache = { data: result, ts: Date.now() };
  return result;
}
