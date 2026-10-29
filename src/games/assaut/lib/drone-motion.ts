/** Autonomous flight: no player coordinates enter this calculation. */
export function droneVelocity(age: number, seed: number) {
  const phase = seed * Math.PI * 2;
  return (seed - 0.5) * 65 + Math.sin(age * (0.65 + seed * 0.4) + phase) * 42;
}

type Aircraft = { x: number; y: number; r: number; hp: number; kind: string };
const extent = (e: Aircraft) => ({ x: e.r * 1.8 + 3, y: e.r * 2.25 + 4 });

export function droneSpawnX(enemies: Aircraft[], preferred: number, width: number): number | null {
  const candidates = [preferred, ...Array.from({ length: 9 }, (_, i) => 30 + i * (width - 60) / 8)];
  return candidates.find(x => x >= 30 && x <= width - 30 && enemies.every(e => {
    if (e.hp <= 0 || e.kind === 'boss') return true;
    const size = extent(e);
    return Math.hypot((x - e.x) / (24.6 + size.x), (-42 - e.y) / (31 + size.y)) >= 1;
  })) ?? null;
}

/** Separate visible aircraft footprints without changing their collision radii. */
export function separateDrones(enemies: Aircraft[], width: number) {
  const aircraft = enemies.filter(e => e.hp > 0 && e.kind !== 'boss');
  for (let pass = 0; pass < 12; pass++) {
    for (let i = 0; i < aircraft.length; i++) {
      const a = aircraft[i];
      if (!a) continue;
      for (let j = i + 1; j < aircraft.length; j++) {
        const b = aircraft[j];
        if (!b || (a.kind !== 'drone' && b.kind !== 'drone')) continue;
        const sa = extent(a), sb = extent(b);
        const rx = sa.x + sb.x, ry = sa.y + sb.y;
        let dx = (b.x - a.x) / rx, dy = (b.y - a.y) / ry;
        let distance = Math.hypot(dx, dy);
        if (distance >= 1) continue;
        if (distance < 0.0001) { dx = 1; dy = 0; distance = 1; }
        const push = (1.005 - Math.hypot((b.x - a.x) / rx, (b.y - a.y) / ry)) / 2;
        a.x -= dx / distance * push * rx; b.x += dx / distance * push * rx;
        a.y -= dy / distance * push * ry; b.y += dy / distance * push * ry;
        a.x = Math.max(sa.x, Math.min(width - sa.x, a.x));
        b.x = Math.max(sb.x, Math.min(width - sb.x, b.x));
      }
    }
  }
}
/** Push aircraft (not the boss) outside falling planets so they never overlap visually. */
export function avoidBodies(enemies: Aircraft[], bodies: { x: number; y: number; r: number }[], width: number) {
  for (const e of enemies) {
    if (e.hp <= 0 || e.kind === 'boss') continue;
    const size = extent(e);
    for (const b of bodies) {
      const min = b.r + Math.max(size.x, size.y);
      let dx = e.x - b.x, dy = e.y - b.y, d = Math.hypot(dx, dy);
      if (d >= min) continue;
      if (d < 0.001) { dx = b.x > width / 2 ? -1 : 1; dy = 0; d = 1; }
      e.x = b.x + dx / d * min; e.y = b.y + dy / d * min;
      e.x = Math.max(size.x, Math.min(width - size.x, e.x));
    }
  }
}
