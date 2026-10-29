import { describe, expect, it } from 'vitest';
import { asteroidDelay, asteroidLimit, asteroidBlockingShot, createAsteroidField } from './asteroids';

describe('asteroid obstacles', () => {
  const rock = { x: 240, y: 300, r: 28, speed: 100, angle: 0, spin: 0 };
  it('blocks a shot hitting an asteroid', () => {
    expect(asteroidBlockingShot([rock], { x: 240, y: 340 }, { x: 240, y: 320, r: 3 })).toBe(rock);
  });
  it('blocks even a fast shot crossing the entire asteroid in one frame', () => {
    expect(asteroidBlockingShot([rock], { x: 240, y: 400 }, { x: 240, y: 200, r: 3 })).toBe(rock);
  });
  it('allows shots passing beside the asteroid', () => {
    expect(asteroidBlockingShot([rock], { x: 280, y: 400 }, { x: 280, y: 200, r: 3 })).toBeUndefined();
  });
  it('also blocks projectiles travelling down from enemies', () => {
    expect(asteroidBlockingShot([rock], { x: 240, y: 200 }, { x: 240, y: 400, r: 5 })).toBe(rock);
  });
  it('spawns above the screen then falls down', () => {
    const field = createAsteroidField(480, 900, () => 0.5);
    const pilot = { x: 12, y: 724, r: 12 };
    field.update(4, pilot);
    // Advance in real frame-sized steps so spawning starts offscreen.
    const fresh = createAsteroidField(480, 900, () => 0.5);
    for (let i = 0; i < 401; i++) fresh.update(0.01, pilot);
    const first = fresh.rocks[0];
    expect(first).toBeDefined();
    if (!first) return;
    expect(first.y).toBeLessThan(0);
    const y = first.y;
    fresh.update(0.1, pilot);
    expect(first.y).toBeGreaterThan(y);
  });
  it('never exceeds the current limit, even on a tall screen', () => {
    const field = createAsteroidField(480, 10000, () => 0.5);
    for (let i = 0; i < 6000; i++) {
      field.update(0.02, { x: 12, y: 9000, r: 12 });
      expect(field.rocks.length).toBeLessThanOrEqual(field.limit);
      expect(field.rocks.length).toBeLessThanOrEqual(4);
    }
  });
  it('allows two arrivals within a second on well separated trajectories', () => {
    const field = createAsteroidField(480, 900, () => 0);
    for (let i = 0; i < 501; i++) field.update(0.01, { x: 240, y: 724, r: 12 });
    expect(field.rocks).toHaveLength(2);
    const [first, second] = field.rocks;
    if (!first || !second) return;
    expect(Math.abs(first.x - second.x)).toBeGreaterThanOrEqual(160);
    expect(Math.abs(first.y - second.y)).toBeLessThan(120);
    expect(first.speed).toBe(105);
  });
  it('reports a collision with the aircraft and removes that obstacle', () => {
    const field = createAsteroidField(480, 900, () => 0.5);
    for (let i = 0; i < 401; i++) field.update(0.01, { x: 12, y: 724, r: 12 });
    const rock = field.rocks[0];
    expect(rock).toBeDefined();
    if (!rock) return;
    expect(field.update(0, { x: rock.x, y: rock.y, r: 12 })).toBe(true);
    expect(field.rocks).toHaveLength(0);
  });
  it('leaves the aircraft unharmed when it dodges', () => {
    const field = createAsteroidField(480, 900, () => 0.5);
    for (let i = 0; i < 800; i++) expect(field.update(0.01, { x: 12, y: 724, r: 12 })).toBe(false);
  });
});
describe('asteroid progression', () => {
  it('drops more rocks as the run goes on', () => {
    expect(asteroidLimit(0)).toBe(2);
    expect(asteroidLimit(140)).toBe(4);
    expect(asteroidLimit(1000)).toBe(4);
    expect(asteroidDelay(0)).toBe(5);
    expect(asteroidDelay(120)).toBe(2);
  });
});
