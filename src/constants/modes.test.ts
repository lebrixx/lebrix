import { describe, expect, it } from 'vitest';
import { FREE_MODES, RANKED_MODES, requiresTicket, resolveSavedMode, MODE_UNLOCK_PRICES } from './modes';

describe('Brix Arena replacement', () => {
  it('is unlocked from the start', () => { expect(FREE_MODES).toContain('brix_arena'); });
  it('replaces Rotating Cube in all six ranked identities', () => {
    expect([...RANKED_MODES]).toEqual(['brix_rush', 'assaut', 'brix_arena', 'chronophase', 'bloup', 'survie_60s']);
  });
  it('makes Assaut free without a ticket', () => {
    expect(FREE_MODES).toContain('assaut');
    expect(requiresTicket('assaut')).toBe(false);
    expect(requiresTicket('zone_mobile')).toBe(false);
    for (const mode of ['classic','brix_rush','survie_60s','brix_arena','memoire_expert']) expect(requiresTicket(mode)).toBe(false);
  });
  it('redirects old Falling Tunnel selections without mixing historical scores', () => {
    expect(resolveSavedMode('zone_mobile')).toBe('assaut');
    expect(RANKED_MODES).not.toContain('zone_mobile');
  });
  it('redirects saved Rotating Cube selections without reusing its records', () => {
    expect(resolveSavedMode('memoire_expert')).toBe('brix_arena');
    expect(resolveSavedMode('brix_arena')).toBe('brix_arena');
    expect(resolveSavedMode('unknown')).toBe('chronophase');
  });
});
describe('Mode access rules', () => {
  it('preserves ticket access for the Ball Balance replacement', () => {
    expect(RANKED_MODES.filter(requiresTicket)).toEqual(['bloup']);
  });
  it('locks Stack Jump for a permanent 500 coin purchase', () => {
    expect(FREE_MODES).not.toContain('survie_60s');
    expect(MODE_UNLOCK_PRICES.survie_60s).toBe(500);
  });
});
describe('Bloup replacement', () => {
  it('replaces Ball Balance without mixing historical identities', () => {
    expect(RANKED_MODES).not.toContain('arc_changeant');
    expect(resolveSavedMode('arc_changeant')).toBe('bloup');
    expect(FREE_MODES).toContain('bloup');
  });
});
describe('Chronophase replacement', () => {
  it('replaces Cube Dodge, free, and redirects saved selections', () => {
    expect(RANKED_MODES).not.toContain('classic');
    expect(FREE_MODES).toContain('chronophase');
    expect(requiresTicket('chronophase')).toBe(false);
    expect(resolveSavedMode('classic')).toBe('chronophase');
  });
});
