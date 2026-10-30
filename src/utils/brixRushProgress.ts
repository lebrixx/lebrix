import { getDailyChallengeProgress } from './dailyChallenges';

const validScore = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;

/** Recover today's completed runs too, without borrowing old Orbit Dodge records. */
export function getBrixRushChallengeBest(savedBest: unknown): number {
  return Math.max(validScore(savedBest), validScore(getDailyChallengeProgress().bestScorePerMode.brix_rush));
}

export function recordBrixRushResult(score: number): void {
  if (!Number.isFinite(score) || score < 0) return;
  try {
    const data = JSON.parse(localStorage.getItem('luckyStopGame') || '{}');
    data.bestScore_brix_rush = Math.max(getBrixRushChallengeBest(data.bestScore_brix_rush), score);
    data.totalGamesPlayed = validScore(data.totalGamesPlayed) + 1;
    localStorage.setItem('luckyStopGame', JSON.stringify(data));
  } catch { /* Storage failure must not interrupt the original automatic replay. */ }
}