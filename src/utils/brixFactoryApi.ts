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

// Cache le classement plusieurs heures pour limiter drastiquement la charge sur Supabase.
// Brix Factory est un mode idle : les positions ne bougent quasiment pas d'heure en heure.
const LB_CACHE_KEY = 'brix_lb_cache_v1';
const LB_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 heures
let lbMemoryCache: { at: number; data: BrixLeaderboardEntry[] } | null = null;

function readLbDiskCache(): { at: number; data: BrixLeaderboardEntry[] } | null {
  try {
    const raw = localStorage.getItem(LB_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.at !== 'number' || !Array.isArray(parsed.data)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLbDiskCache(data: BrixLeaderboardEntry[]) {
  try {
    localStorage.setItem(LB_CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* ignore quota */
  }
}

export async function fetchBrixLeaderboard(
  limit = 100,
  opts: { force?: boolean } = {},
): Promise<BrixLeaderboardEntry[]> {
  const now = Date.now();
  if (!opts.force) {
    if (lbMemoryCache && now - lbMemoryCache.at < LB_CACHE_TTL_MS) {
      return lbMemoryCache.data;
    }
    const disk = readLbDiskCache();
    if (disk && now - disk.at < LB_CACHE_TTL_MS) {
      lbMemoryCache = disk;
      return disk.data;
    }
  }

  const { data, error } = await (supabase as any)
    .from('brix_factory_scores')
    .select('device_id, username, total_brix_produced, reactor_level, storage_level, amplifier_level, decorations')
    .order('total_brix_produced', { ascending: false })
    .limit(limit);
  if (error) {
    // En cas d'erreur, on retombe sur le cache (même expiré) si dispo
    const disk = readLbDiskCache();
    if (disk) return disk.data;
    throw error;
  }
  const rows = (data ?? []) as BrixLeaderboardEntry[];
  lbMemoryCache = { at: now, data: rows };
  writeLbDiskCache(rows);
  return rows;
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
