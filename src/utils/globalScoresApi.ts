import { supabase } from '@/integrations/supabase/client';

export interface GlobalPlayerScore {
  username: string;
  total_score: number;
  modes_played: number;
  decorations: string | null;
}

const CACHE_TTL = 60_000;
let cachedData: { data: GlobalPlayerScore[]; ts: number } | null = null;

export function clearGlobalCache() {
  cachedData = null;
}

const VALID_MODES = ['classic', 'arc_changeant', 'survie_60s', 'zone_mobile', 'zone_traitresse', 'memoire_expert'];

export async function fetchGlobalLeaderboard(limit = 1000): Promise<GlobalPlayerScore[]> {
  if (cachedData && Date.now() - cachedData.ts < CACHE_TTL) {
    return cachedData.data.slice(0, limit);
  }

  try {
    // Fetch all best scores across all modes
    const { data, error } = await supabase
      .from('scores')
      .select('username, best_score, mode, decorations, created_at')
      .in('mode', VALID_MODES)
      .order('best_score', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Error fetching global leaderboard:', error);
      return [];
    }

    // Aggregate: sum best_score per username (deduplicate per mode, keep max per mode)
    const playerMap = new Map<string, {
      scores: Map<string, number>;
      decorations: string | null;
      latestAt: string;
    }>();

    for (const entry of (data || [])) {
      const key = entry.username;
      let player = playerMap.get(key);
      if (!player) {
        player = { scores: new Map(), decorations: entry.decorations, latestAt: entry.created_at || '' };
        playerMap.set(key, player);
      }

      const existing = player.scores.get(entry.mode) || 0;
      if (entry.best_score > existing) {
        player.scores.set(entry.mode, entry.best_score);
      }

      // Keep latest decorations
      if ((entry.created_at || '') > player.latestAt) {
        player.decorations = entry.decorations;
        player.latestAt = entry.created_at || '';
      }
    }

    const result: GlobalPlayerScore[] = Array.from(playerMap.entries()).map(([username, player]) => {
      let total = 0;
      player.scores.forEach(s => total += s);
      return {
        username,
        total_score: total,
        modes_played: player.scores.size,
        decorations: player.decorations,
      };
    });

    result.sort((a, b) => b.total_score - a.total_score);

    // Cache full aggregated leaderboard so different limits don't conflict (100 vs 1000)
    cachedData = { data: result, ts: Date.now() };
    return result.slice(0, limit);
  } catch (error) {
    console.error('Error in fetchGlobalLeaderboard:', error);
    return [];
  }
}
