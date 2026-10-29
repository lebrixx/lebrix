import { describe, expect, it } from 'vitest';
import { earthPass } from './earth';
import { moonPass, moonAsRock } from './moon';
import { asteroidBlockingShot } from './asteroids';

describe('Terre obstacle', () => {
  it('attend la mort du premier boss puis exactement 15 secondes', () => {
    expect(earthPass(120, 420, 800, null)).toBeNull();
    expect(earthPass(67.99, 420, 800, 53)).toBeNull();
    const earth = earthPass(68, 420, 800, 53);
    if (!earth) throw new Error('Terre absente');
    expect(earth.y + earth.r).toBeLessThan(0);
  });
  it('garde la taille et la vitesse de la Lune avec une trajectoire miroir à gauche', () => {
    const earth = earthPass(72, 420, 800, 53);
    const moon = moonPass(14, 420, 800);
    if (!earth || !moon) throw new Error('Planètes absentes');
    expect(earth.r).toBeCloseTo(420 * 0.54);
    expect(earth.r).toBe(moon.r);
    expect(earth.y).toBe(moon.y);
    expect(earth.x).toBeCloseTo(420 - moon.x);
    expect(earth.x + earth.r).toBeLessThan(210);
    expect(earthPass(73, 420, 800, 53)?.y).toBeCloseTo(earth.y + 110);
  });
  it('bloque les tirs dans son disque visible', () => {
    const earth = earthPass(74, 420, 800, 53);
    if (!earth) throw new Error('Terre absente');
    expect(asteroidBlockingShot([moonAsRock(earth)], { x: 80, y: earth.y + earth.r + 30 }, { x: 80, y: earth.y, r: 3 })).toBeTruthy();
    expect(asteroidBlockingShot([moonAsRock(earth)], { x: 350, y: earth.y + earth.r + 30 }, { x: 350, y: earth.y, r: 3 })).toBeFalsy();
  });
});