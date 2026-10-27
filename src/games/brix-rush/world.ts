// Pure, deterministic world: same room code => same lanes & same traffic for everyone.
// The player goes RIGHT column by column; cars drive up/down inside each road column.
export const MAX_PLAYERS = 6;
export const CELL = 40;
export const ROWS = 9;
export const VIEW_H = CELL * ROWS;
export const SAFE_START = 3;
export const HOP_MS = 110;
/** One shared course for every room (solo, public multi, private code) so all modes play the same track. */
export const COURSE_SEED = "BRIX";

export type Lane = { safe: true } | { safe: false; dir: 1 | -1; speed: number; carLen: number; period: number; phase: number };

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Up to this score, green strips may sit right next to each other. */
export const FREE_GREEN_UNTIL = 12;
/** Past it, at least this many roads must separate two green strips. */
export const MIN_ROADS_BETWEEN_GREEN = 4;

type Built = { lanes: Lane[]; roads: number };
const built = new Map<string, Built>();

/** Build lanes 0..upto for a seed, keeping green strips apart once past the start. */
function buildTo(seed: string, upto: number): Built {
  let b = built.get(seed);
  if (!b) {
    if (built.size > 16) built.clear();
    const lanes: Lane[] = [];
    for (let c = 0; c < SAFE_START; c++) lanes[c] = { safe: true };
    b = { lanes, roads: 0 };
    built.set(seed, b);
  }
  for (let col = Math.max(b.lanes.length, SAFE_START); col <= upto; col++) {
    const r = rng(hash(`${seed}:${col}`));
    const difficulty = Math.min(1, col / 200);
    const wantsGreen = r() < 0.28 - difficulty * 0.12;
    let lane: Lane;
    if (wantsGreen && (col <= FREE_GREEN_UNTIL || b.roads >= MIN_ROADS_BETWEEN_GREEN)) {
      lane = { safe: true };
      b.roads = 0;
    } else {
      const carLen = 1 + Math.floor(r() * 2.6);
      lane = {
        safe: false,
        dir: r() < 0.5 ? 1 : -1,
        speed: 50 + r() * 64 + difficulty * 66,
        carLen,
        period: CELL * (carLen + 4.4 + r() * (5.4 - difficulty * 1.5)),
        phase: r() * 1000,
      };
      b.roads++;
    }
    b.lanes[col] = lane;
  }
  return b;
}

export function laneAt(seed: string, col: number): Lane {
  if (col < SAFE_START) return { safe: true };
  return buildTo(seed, col).lanes[col] ?? { safe: true };
}

/** Car top positions (px) in a road lane at shared time t (seconds). */
export function carsAt(lane: Lane, t: number): number[] {
  if (lane.safe === true) return [];
  const h = lane.carLen * CELL;
  const off = (((lane.phase + lane.dir * lane.speed * t) % lane.period) + lane.period) % lane.period;
  const out: number[] = [];
  for (let y = off - lane.period; y < VIEW_H + lane.period; y += lane.period) if (y + h > -CELL && y < VIEW_H + CELL) out.push(y);
  return out;
}

export function hitByCar(seed: string, col: number, rowY: number, t: number) {
  const lane = laneAt(seed, col);
  if (lane.safe === true) return false;
  const h = lane.carLen * CELL;
  const pad = 6;
  return carsAt(lane, t).some((y) => rowY + pad < y + h - 3 && rowY + CELL - pad > y + 3);
}

export const PLAYER_HUES = [25, 190, 140, 330, 60, 270];
export function hueFor(id: string) {
  return PLAYER_HUES[hash(id) % PLAYER_HUES.length] ?? 25;
}

/** Score = columns crossed. */
export function toMeters(x: number) {
  return Math.floor(x / CELL);
}

/** Most fences a single green strip can hold. */
export const MAX_FENCES_PER_GREEN = 2;

/** Rows blocked by a fence in a green strip (deterministic per seed; none on the start area). */
export function fencesAt(seed: string, col: number): number[] {
  if (col < SAFE_START || !laneAt(seed, col).safe) return [];
  const r = rng(hash(`${seed}:${col}:fence`));
  const count = r() < 0.25 ? 1 : MAX_FENCES_PER_GREEN;
  const rows: number[] = [];
  while (rows.length < count) {
    const row = Math.floor(r() * ROWS);
    if (!rows.includes(row)) rows.push(row);
  }
  return rows;
}

export function blockedByFence(seed: string, col: number, row: number) {
  return fencesAt(seed, col).includes(row);
}
