import { describe, expect, it } from 'vitest';
import { droneSpawnX, droneVelocity, separateDrones } from './drone-motion';

const drone = (x: number, y = 100) => ({ x, y, r: 12, hp: 2, kind: 'drone' });

describe('vol des avions rouges', () => {
  it('varie les trajectoires avec des déplacements vers les deux côtés', () => {
    expect(droneVelocity(0, 0.25)).toBeGreaterThan(0);
    expect(droneVelocity(0, 0.75)).toBeLessThan(0);
    expect(droneVelocity(4, 0.25)).not.toBe(droneVelocity(0, 0.25));
  });
  it('sépare les avions même initialement au même endroit sans modifier leur hitbox', () => {
    const enemies = [drone(240), drone(240), drone(240)];
    separateDrones(enemies, 480);
    for (let i = 0; i < enemies.length; i++) {
      expect(enemies[i]?.r).toBe(12);
      for (const b of enemies.slice(i + 1)) {
        const a = enemies[i];
        if (!a) throw new Error('missing aircraft');
        expect(Math.hypot((a.x - b.x) / 49.2, (a.y - b.y) / 62)).toBeGreaterThanOrEqual(1);
      }
    }
  });
  it('choisit une apparition libre plutôt que de superposer les avions', () => {
    const occupied = drone(240, -42);
    const x = droneSpawnX([occupied], 240, 480);
    expect(x).not.toBeNull();
    expect(Math.abs((x ?? 240) - occupied.x)).toBeGreaterThanOrEqual(49.2);
  });
});
import { avoidBodies } from './drone-motion';
describe('avoidBodies', () => {
  it('pushes an aircraft out of a planet disc', () => {
    const e = { x: 300, y: 200, r: 14, hp: 1, kind: 'drone' };
    avoidBodies([e], [{ x: 320, y: 200, r: 80 }], 420);
    expect(Math.hypot(e.x - 320, e.y - 200)).toBeGreaterThanOrEqual(80);
  });
});
