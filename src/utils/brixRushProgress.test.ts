import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getBrixRushChallengeBest, recordBrixRushResult } from './brixRushProgress';
import { getDailyChallengeProgress, getTodaysChallenges, updateDailyChallengeProgress } from './dailyChallenges';

describe('Brix Rush challenge progress', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    });
    vi.useRealTimers();
  });

  it('records the completed Rush score and one game for global challenges', () => {
    localStorage.setItem('luckyStopGame', JSON.stringify({ bestScore_zone_traitresse: 99, coins: 123, totalGamesPlayed: 49 }));
    recordBrixRushResult(56);
    expect(JSON.parse(localStorage.getItem('luckyStopGame') ?? '{}')).toEqual({
      bestScore_zone_traitresse: 99, coins: 123, totalGamesPlayed: 50, bestScore_brix_rush: 56,
    });
  });

  it('never lowers the Rush best score when the next run is worse', () => {
    recordBrixRushResult(56);
    recordBrixRushResult(10);
    expect(getBrixRushChallengeBest(JSON.parse(localStorage.getItem('luckyStopGame') ?? '{}').bestScore_brix_rush)).toBe(56);
  });

  it('recovers the already recorded daily Rush score for global challenges', () => {
    updateDailyChallengeProgress('brix_rush', 56, 15);
    expect(getBrixRushChallengeBest(0)).toBe(56);
  });

  it('advances a matching daily Rush challenge through a completed run', () => {
    vi.useFakeTimers();
    let date = new Date('2026-10-01T12:00:00Z');
    for (let day = 1; day <= 31; day++) {
      date = new Date(`2026-10-${String(day).padStart(2, '0')}T12:00:00Z`);
      vi.setSystemTime(date);
      if (getTodaysChallenges().some(c => c.mode === 'brix_rush')) break;
    }
    const challenge = getTodaysChallenges().find(c => c.mode === 'brix_rush');
    expect(challenge).toBeDefined();
    if (!challenge) throw new Error('No Rush challenge found');
    recordBrixRushResult(56);
    updateDailyChallengeProgress('brix_rush', 56, 15);
    expect(getDailyChallengeProgress().challenges[challenge.id]).toEqual({ progress: 56, completed: true, claimed: false });
    vi.useRealTimers();
  });
});