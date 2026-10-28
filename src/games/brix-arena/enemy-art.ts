// Baked views of the supplied GLBs. Rows face E, SE, S, SW, W, NW, N, NE.
export const MELEE_CELL = 128;
export function meleeFrame(seconds: number, id: number, vx: number, vy: number) {
  const moving = Math.hypot(vx, vy) > 0.08;
  const direction = (Math.round(Math.atan2(vy, vx) / (Math.PI / 4)) + 8) % 8;
  const frame = moving ? (Math.floor(seconds * 10) + id) % 8 : 0;
  return { sx: frame * MELEE_CELL, sy: direction * MELEE_CELL, frame, direction };
}

// Drone shooter: blades always spin, body faces its target (tx, ty).
export const SHOOTER_CELL = 128;
export function shooterFrame(seconds: number, id: number, tx: number, ty: number) {
  const direction = (Math.round(Math.atan2(ty, tx) / (Math.PI / 4)) + 8) % 8;
  const frame = (Math.floor(seconds * 12) + id) % 8;
  return { sx: frame * SHOOTER_CELL, sy: direction * SHOOTER_CELL, frame, direction };
}