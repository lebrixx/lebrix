import { supabase } from '@/integrations/supabase/client';
import { getDeviceId, getUsername } from '@/utils/localIdentity';

export interface BrixLeaderboardEntry {
  device_id: string;
  username: string;
  total_brix_produced: number;
  reactor_level: number;
  storage_level: number;
  amplifier_level: number;
  decorations: string | null;
}

export async function fetchBrixLeaderboard(limit = 100): Promise<BrixLeaderboardEntry[]> {
  const { data, error } = await (supabase as any)
    .from('brix_factory_scores')
    .select('device_id, username, total_brix_produced, reactor_level, storage_level, amplifier_level, decorations')
    .order('total_brix_produced', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as BrixLeaderboardEntry[];
}

export interface SubmitPayload {
  totalProduced: number;
  reactorLevel: number;
  storageLevel: number;
  amplifierLevel: number;
  decorations?: string;
}

export async function submitBrixScore(p: SubmitPayload): Promise<{ success: boolean; total?: number; error?: string }> {
  const username = getUsername();
  if (!username) return { success: false, error: 'no_username' };
  const device_id = getDeviceId();
  try {
    const { data, error } = await supabase.functions.invoke('submit-brix-factory', {
      body: {
        device_id,
        username,
        total_brix_produced: Math.floor(p.totalProduced),
        reactor_level: p.reactorLevel,
        storage_level: p.storageLevel,
        amplifier_level: p.amplifierLevel,
        decorations: p.decorations ?? '',
      },
    });
    if (error) return { success: false, error: error.message };
    return { success: true, total: (data as any)?.total };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'network' };
  }
}
