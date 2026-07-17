import { supabase } from '@/integrations/supabase/client';
import { getDeviceId, getUsername } from '@/utils/localIdentity';
import { buildDecorationsString } from '@/utils/decorations';

const SUPABASE_URL = "https://zkhrtvgnzcufplzhophz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpraHJ0dmduemN1ZnBsemhvcGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NjU1NjgsImV4cCI6MjA3NDE0MTU2OH0.3mYkFLKEqJFllX8487LdqnkEFXUw5Y4cZnzlZyfJ-a4";

export interface ReflexGridEntry {
  id: string;
  username: string;
  best_score: number;
  decorations: string | null;
  updated_at: string;
}

const CACHE_TTL = 60_000;
let cache: { data: ReflexGridEntry[]; ts: number } | null = null;

export function clearReflexGridCache() { cache = null; }

export async function submitReflexGridScore(score: number): Promise<boolean> {
  const username = getUsername();
  if (!username || score < 1) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/submit-reflex-grid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
      },
      body: JSON.stringify({
        device_id: getDeviceId(),
        username,
        score: Math.floor(score),
        decorations: buildDecorationsString(),
      }),
    });
    cache = null;
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchReflexGridLeaderboard(limit = 200): Promise<ReflexGridEntry[]> {
  try {
    if (cache && Date.now() - cache.ts < CACHE_TTL) {
      return cache.data.slice(0, limit);
    }
    const { data, error } = await supabase
      .from('reflex_grid_scores' as any)
      .select('id, username, best_score, decorations, updated_at')
      .order('best_score', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    const result = data as unknown as ReflexGridEntry[];
    cache = { data: result, ts: Date.now() };
    return result;
  } catch (e) {
    console.warn('[ReflexGrid] leaderboard fetch failed:', e);
    return [];
  }
}
