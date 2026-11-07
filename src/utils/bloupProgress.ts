/** Persist the new game's results without importing historical Ball Balance records. */
export function recordBloupResult(score: number): void {
  try {
    const saved = JSON.parse(localStorage.getItem('luckyStopGame') || '{}');
    const best = Number(saved.bestScore_bloup) || 0;
    saved.bestScore_bloup = Math.max(best, score);
    saved.totalGamesPlayed = (Number(saved.totalGamesPlayed) || 0) + 1;
    localStorage.setItem('luckyStopGame', JSON.stringify(saved));
  } catch { /* Storage failure must not interrupt the original game. */ }
}