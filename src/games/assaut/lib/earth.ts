import { MOON, type MoonPass } from './moon';
export const EARTH_DELAY = 15;
/** Same obstacle as the Moon, mirrored left, scheduled from the first boss defeat. */
export function earthPass(time: number, width: number, height: number, firstBossDeath: number | null): MoonPass | null {
  if (firstBossDeath === null || time < firstBossDeath + EARTH_DELAY) return null;
  const age = (time - firstBossDeath - EARTH_DELAY) % MOON.every;
  const r = width * MOON.radiusRatio;
  const y = -r - 140 + age * MOON.speed;
  if (y - r > height) return null;
  return { x: width * (1 - MOON.xRatio), y, r, spin: time * 0.25 };
}
