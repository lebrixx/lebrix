import { describe, expect, it } from 'vitest';
import { respawnDue, resetToStart } from './respawn';

describe('original death behavior', () => {
  it('returns to the departure line after the original 1200ms delay', () => {
    expect(respawnDue(2200, 1000)).toBe(false);
    expect(respawnDue(2201, 1000)).toBe(true);
  });
  it('resets current position and death while retaining the record', () => {
    const player = { col: 12, fromCol: 11, row: 7, fromRow: 7, dead: true, best: 480 };
    resetToStart(player, 4);
    expect(player).toEqual({ col: 0, fromCol: 0, row: 4, fromRow: 4, dead: false, best: 480 });
  });
});