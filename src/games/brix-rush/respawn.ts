export const RESPAWN_DELAY_MS = 1200;

export function respawnDue(now: number, diedAt: number) {
  return now - diedAt > RESPAWN_DELAY_MS;
}

export function resetToStart(player: { col: number; fromCol: number; row: number; fromRow: number; dead: boolean; best: number }, startRow: number) {
  player.col = player.fromCol = 0;
  player.row = player.fromRow = startRow;
  player.dead = false;
}