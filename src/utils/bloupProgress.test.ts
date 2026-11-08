import { beforeEach, expect, it, vi } from 'vitest';
import { recordBloupResult } from './bloupProgress';
import { ALL_DAILY_CHALLENGES, updateDailyChallengeProgress, getDailyChallengeProgress } from './dailyChallenges';
import { RANKED_MODES } from '@/constants/modes';

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => values.set(k, v) });
});

it('keeps Bloup scores separate from Ball Balance and preserves the games high-water mark', () => {
  localStorage.setItem('luckyStopGame', JSON.stringify({ bestScore_arc_changeant: 900, totalGamesPlayed: 51 }));
  recordBloupResult(12);
  recordBloupResult(4);
  const saved = JSON.parse(localStorage.getItem('luckyStopGame') || '{}');
  expect(saved.bestScore_bloup).toBe(12);
  expect(saved.bestScore_arc_changeant).toBe(900);
  expect(saved.totalGamesPlayed).toBe(53);
});

it('offers daily challenges only in the six current modes including Bloup', () => {
  expect(ALL_DAILY_CHALLENGES.filter(c => c.mode === 'bloup').length).toBe(4);
  expect(ALL_DAILY_CHALLENGES.every(c => (RANKED_MODES as readonly string[]).includes(c.mode))).toBe(true);
});

it('records actual Bloup run progress for challenges without changing Ball Balance', () => {
  updateDailyChallengeProgress('bloup', 12, 30);
  expect(getDailyChallengeProgress().bestScorePerMode.bloup).toBe(12);
  expect(getDailyChallengeProgress().bestScorePerMode.arc_changeant).toBeUndefined();
});