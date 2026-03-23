import { supabase } from '@/integrations/supabase/client';

export interface GlobalPlayerScore {
  username: string;
  total_score: number;
  modes_played: number;
  decorations: string | null;
}

const CACHE_TTL = 180_000; // 3 minutes
let cachedData: { data: GlobalPlayerScore[]; ts: number } | null = null;
let monthlyCachedData: { data: GlobalPlayerScore[]; ts: number } | null = null;

export function clearGlobalCache() {
  cachedData = null;
  monthlyCachedData = null;
}

const VALID_MODES = ['classic', 'arc_changeant', 'survie_60s', 'zone_mobile', 'zone_traitresse', 'memoire_expert'];

export async function fetchGlobalLeaderboard(limit = 1000): Promise<GlobalPlayerScore[]> {
  if (cachedData && Date.now() - cachedData.ts < CACHE_TTL) {
    return cachedData.data.slice(0, limit);
  }

  try {
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

    cachedData = { data: result, ts: Date.now() };
    return result.slice(0, limit);
  } catch (error) {
    console.error('Error in fetchGlobalLeaderboard:', error);
    return [];
  }
}

function getFirstOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

export async function fetchMonthlyGlobalLeaderboard(limit = 1000): Promise<GlobalPlayerScore[]> {
  if (monthlyCachedData && Date.now() - monthlyCachedData.ts < CACHE_TTL) {
    return monthlyCachedData.data.slice(0, limit);
  }

  try {
    const firstOfMonth = getFirstOfCurrentMonth();

    const { data, error } = await supabase
      .from('scores')
      .select('username, monthly_score, mode, decorations, monthly_updated_at')
      .in('mode', VALID_MODES)
      .gte('monthly_updated_at', firstOfMonth.toISOString())
      .gt('monthly_score', 0)
      .order('monthly_score', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Error fetching monthly global leaderboard:', error);
      return [];
    }

    const playerMap = new Map<string, {
      scores: Map<string, number>;
      decorations: string | null;
      latestAt: string;
    }>();

    for (const entry of (data || [])) {
      const key = entry.username;
      let player = playerMap.get(key);
      if (!player) {
        player = { scores: new Map(), decorations: entry.decorations, latestAt: entry.monthly_updated_at || '' };
        playerMap.set(key, player);
      }

      const existing = player.scores.get(entry.mode) || 0;
      if (entry.monthly_score > existing) {
        player.scores.set(entry.mode, entry.monthly_score);
      }

      if ((entry.monthly_updated_at || '') > player.latestAt) {
        player.decorations = entry.decorations;
        player.latestAt = entry.monthly_updated_at || '';
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

    monthlyCachedData = { data: result, ts: Date.now() };
    return result.slice(0, limit);
  } catch (error) {
    console.error('Error in fetchMonthlyGlobalLeaderboard:', error);
    return [];
  }
}
