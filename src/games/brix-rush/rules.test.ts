import { describe, expect, it } from 'vitest';
import { cfgModes, FREE_MODES, RANKED_MODES, ModeID } from '../../constants/modes';
import { blockedByFence, CELL, fencesAt, hitByCar, laneAt, toMeters } from './world';

describe('Brix Rush replacement', () => {
  it('is unlocked by default', () => { expect(FREE_MODES).toContain('brix_rush'); });
  it('replaces Orbit Dodge in cumulative rankings', () => {
    expect(RANKED_MODES).toContain('brix_rush');
    expect(RANKED_MODES).not.toContain('zone_traitresse');
    expect(RANKED_MODES).toHaveLength(6);
    expect(ModeID.BRIX_RUSH).toBe('brix_rush');
  });
  it('is listed first, then Cube Dodge and Brix Arena, in menus and rankings', () => {
    expect(RANKED_MODES.slice(0, 3)).toEqual([ModeID.BRIX_RUSH, ModeID.CLASSIC, ModeID.BRIX_ARENA]);
    const modeListOrder = Object.keys(cfgModes).filter((mode) => mode !== ModeID.PONG_CIRCULAIRE);
    expect(modeListOrder.slice(0, 3)).toEqual([ModeID.BRIX_RUSH, ModeID.CLASSIC, ModeID.BRIX_ARENA]);
  });
  it('scores distance reached rather than repeated backwards movements', () => {
    expect(toMeters(8 * CELL)).toBe(8);
    expect(toMeters(Math.max(8 * CELL, 7 * CELL))).toBe(8);
  });
  it('starts on safe grass without fences or traffic', () => {
    for (let col = 0; col < 3; col++) {
      expect(laneAt('BRIX', col).safe).toBe(true);
      expect(fencesAt('BRIX', col)).toEqual([]);
      expect(hitByCar('BRIX', col, 160, 0)).toBe(false);
    }
  });
  it('preserves the supplied fence collision rules', () => {
    const col = Array.from({ length: 100 }, (_, i) => i + 3).find(c => fencesAt('BRIX', c).length > 0);
    expect(col).toBeDefined();
    if (col === undefined) throw new Error('No fence generated');
    const row = fencesAt('BRIX', col)[0];
    if (row === undefined) throw new Error('No fence row');
    expect(blockedByFence('BRIX', col, row)).toBe(true);
    expect(blockedByFence('BRIX', col, (row + 3) % 9)).toBe(false);
  });
});