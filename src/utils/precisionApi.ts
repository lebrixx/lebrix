import { supabase } from '@/integrations/supabase/client';
import { getDeviceId, getUsername } from '@/utils/localIdentity';

const SUPABASE_URL = "https://zkhrtvgnzcufplzhophz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpraHJ0dmduemN1ZnBsemhvcGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NjU1NjgsImV4cCI6MjA3NDE0MTU2OH0.3mYkFLKEqJFllX8487LdqnkEFXUw5Y4cZnzlZyfJ-a4";

export interface PrecisionEntry {
  id: string;
  username: string;
  target: number;
  result: number;
  gap: number;
  challenge_date: string;
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
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Fetch today's leaderboard */
export async function fetchDailyPrecisionLeaderboard(): Promise<PrecisionEntry[]> {
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('daily_precision_scores' as any)
    .select('id, username, target, result, gap, challenge_date')
    .eq('challenge_date', today)
    .order('gap', { ascending: true })
    .limit(50);

  if (error || !data) return [];
  return data as unknown as PrecisionEntry[];
}
