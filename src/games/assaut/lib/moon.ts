// Moon obstacle: a huge body that falls from above along the right edge; it hurts the pilot and stops shots.
export const MOON = { first: 10, every: 60, speed: 110, radiusRatio: 0.54, xRatio: 1.09 };

export type MoonPass = { x: number; y: number; r: number; spin: number };

export function moonPass(time: number, width: number, height: number): MoonPass | null {
  if (time < MOON.first) return null;
  const elapsed = time - MOON.first;
  // A single pass: the moon falls once and never comes back; the Earth takes over afterwards.
  if (elapsed >= MOON.every) return null;
  const age = elapsed;
  const r = width * MOON.radiusRatio;
  // Starts fully above the visible area so it is seen falling in.
  const y = -r - 140 + age * MOON.speed;
  if (y - r > height) return null;
  // Its centre sits past the right edge: the visible arc starts well right of centre,
  // so most of the screen stays free to fly through while the body still reads as huge.
  const x = width * MOON.xRatio;
  return { x, y, r, spin: time * 0.25 };
}

export const moonAsRock = (m: MoonPass) => ({ x: m.x, y: m.y, r: m.r, speed: 0, angle: m.spin, spin: 0 });
