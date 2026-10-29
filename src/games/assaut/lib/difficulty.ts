export type SpawnKind = "drone" | "zig" | "shooter";

export const BOSS_EVERY = 35; // secondes
export const SHOOTER_START = 10;
export const TANK_START = 40; // premier blindé, jamais avant
export const TANK_MIN_GAP = 6;
export const TANK_MAX_GAP = 10;
export function shooterCooldown(t: number) { return Math.max(2.4, 3 - t / 600); }
export function canSpawnRegular(bossAlive: boolean) { return !bossAlive; }
/** Un blindé seul, espacé de 6 à 10 secondes ; le tirage aléatoire ne les fait jamais apparaître. */
export function tankDelay(r: number) { return TANK_MIN_GAP + r * (TANK_MAX_GAP - TANK_MIN_GAP); }
export function tankDue(t: number, timer: number, bossAlive: boolean) { return t >= TANK_START && !bossAlive && timer <= 0; }
export function retainEnemiesWithBoss<T>(enemies: T[], boss: T): T[] { return [...enemies, boss]; }
export function bossDue(t: number, next: number, bossAlive: boolean) { return !bossAlive && t >= next; }
export function nextBossTime(deathTime: number, defeatedBoss = 0) { return deathTime + BOSS_EVERY + (defeatedBoss === 1 ? 15 : 0); }
export function bossStats(rank: number) {
  // Each boss is a bit tougher than the previous one: more HP, faster bullets, shorter pauses.
  // Boss 2 gets an extra bump (more HP, faster shots) that stays below boss 3's values.
  const bump = rank === 2 ? 1 : 0;
  return { hp: 95 + (rank - 1) * 55 + bump * 25, movement: Math.min(140, 55 + rank * 9), speed: Math.min(210, 115 + (rank - 1) * 10 + bump * 8), count: Math.min(7, 3 + Math.floor((rank - 1) / 2) + bump * 2), cooldown: Math.max(0.95, 1.85 - (rank - 1) * 0.1 - bump * 0.09) };
}
export function bossVolley(rank: number, age: number, angry: boolean, aim: number) {
  // Five readable motifs. Wide angular gaps and pauses preserve escape routes.
  const stats = bossStats(rank), pattern = Math.floor(age / 3.5) % 5;
  const count = stats.count;
  let angles: number[];
  if (pattern === 0) angles = Array.from({ length: count }, (_, i) => aim - 0.5 + i / (count - 1));
  else if (pattern === 1) angles = Array.from({ length: count + 1 }, (_, i) => Math.PI * 0.15 + i * Math.PI * 0.7 / count);
  else if (pattern === 2) angles = [Math.PI / 2 - 0.6, Math.PI / 2 + 0.6]; // Open center corridor.
  else if (pattern === 3) angles = [0.55, 1.25, 1.95, 2.65].map(a => a + Math.sin(age) * 0.12);
  else angles = [aim - 0.35, aim + 0.35]; // Split aimed pair, not a tracking wall.
  return { pattern, cooldown: stats.cooldown * (angry ? 0.92 : 1), velocities: angles.map(a => ({ vx: Math.cos(a) * stats.speed, vy: Math.sin(a) * stats.speed })) };
}

/** Paramètres de difficulté continus en fonction du temps de survie (secondes). */
export function difficulty(t: number) {
  // Intervalle entre apparitions : 1.4s au départ, tend vers 0.25s, avec une "respiration" légère.
  const base = 0.25 + 1.15 * Math.exp(-t / 70);
  const interval = base * (1 + 0.2 * Math.sin(t / 8));
  const weights: Record<SpawnKind, number> = {
    drone: 1,
    zig: t < 15 ? 0 : Math.min(1, (t - 15) / 30),
    shooter: t < SHOOTER_START ? 0 : Math.min(0.6, 0.3 + (t - SHOOTER_START) / 140),
  };
  return {
    interval,
    hpScale: 1 + t / 80,
    speedBonus: Math.min(140, t * 0.65),
    fireRate: 1 + Math.min(1, t / 240),
    groupChance: Math.min(0.35, 0.2 + t / 600),
    weights,
  };
}

export function pickKind(t: number, r: number): SpawnKind {
  const w = difficulty(t).weights;
  const total = w.drone + w.zig + w.shooter;
  let x = r * total;
  for (const k of ["drone", "zig", "shooter"] as const) {
    if ((x -= w[k]) < 0) return k;
  }
  return "drone";
}
