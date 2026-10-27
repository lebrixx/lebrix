/** Position updates are capped at one third of the original 66 ms cadence. */
export const POSITION_INTERVAL_MS = 198;

export function positionUpdateDue(now: number, lastSentAt: number): boolean {
  return now - lastSentAt >= POSITION_INTERVAL_MS;
}