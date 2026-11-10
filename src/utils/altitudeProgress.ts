/** Persist Altitude results under the existing survie_60s identity before the shared callback. */
export function recordAltitudeResult(score: number): void {
  try {
    const saved = JSON.parse(localStorage.getItem('luckyStopGame') || '{}');
    saved.bestScore_survie_60s = Math.max(Number(saved.bestScore_survie_60s) || 0, score);
    saved.totalGamesPlayed = (Number(saved.totalGamesPlayed) || 0) + 1;
    localStorage.setItem('luckyStopGame', JSON.stringify(saved));
  } catch { /* never interrupt the game */ }
}
