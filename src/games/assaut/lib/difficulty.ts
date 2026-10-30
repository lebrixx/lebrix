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
  // Denser, faster salvos at every rank; pauses keep shrinking smoothly on long runs.
  // Boss 2 gets an extra bump (more HP, faster shots); boss 3 réutilise exactement les statistiques du boss 2.
  // Boss 1 reste plus doux : une balle de moins par salve et un léger répit entre les salves.
  const bump = rank === 2 || rank === 3 ? 1 : 0;
  const first = rank === 1 ? 1 : 0;
  const eff = rank === 3 ? 2 : rank;
  return { hp: 95 + (eff - 1) * 55 + bump * 25, movement: Math.min(140, 55 + eff * 9), speed: Math.min(260, 145 + (eff - 1) * 12 + bump * 6), count: Math.min(14, 5 + eff - 1 + (eff >= 2 ? 1 : 0)) - first, cooldown: 0.5 + 0.65 * Math.exp(-(eff - 1) * 0.16) - bump * 0.03 + first * 0.2 };
}
export function bossVolley(rank: number, age: number, angry: boolean, aim: number) {
  // Five denser motifs; split fans retain a center corridor rather than a tracking wall.
  const stats = bossStats(rank), pattern = Math.floor(age / 3.5) % 5;
  const count = stats.count;
  let angles: number[];
  if (pattern === 0) angles = Array.from({ length: count }, (_, i) => aim - 0.5 + i / (count - 1));
  else if (pattern === 1) angles = Array.from({ length: count + 1 }, (_, i) => Math.PI * 0.15 + i * Math.PI * 0.7 / count);
  else if (pattern === 2) angles = Array.from({ length: count }, (_, i) => {
    const half = Math.ceil(count / 2);
    return i < half ? Math.PI / 2 - 0.85 + i / Math.max(1, half - 1) * 0.45 : Math.PI / 2 + 0.4 + (i - half) / Math.max(1, count - half - 1) * 0.45;
  });
  else if (pattern === 3) angles = Array.from({ length: count }, (_, i) => 0.55 + i * 2.1 / (count - 1) + Math.sin(age) * 0.12);
  else angles = Array.from({ length: count }, (_, i) => {
    const half = Math.ceil(count / 2);
    return i < half ? aim - 0.7 + i / Math.max(1, half - 1) * 0.4 : aim + 0.3 + (i - half) / Math.max(1, count - half - 1) * 0.4;
  });
  return { pattern, cooldown: stats.cooldown * (angry ? 0.85 : 1), velocities: angles.map(a => ({ vx: Math.cos(a) * stats.speed, vy: Math.sin(a) * stats.speed })) };
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
