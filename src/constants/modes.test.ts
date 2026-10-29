import { describe, expect, it } from 'vitest';
import { FREE_MODES, RANKED_MODES, requiresTicket, resolveSavedMode } from './modes';

describe('Brix Arena replacement', () => {
  it('is unlocked from the start', () => { expect(FREE_MODES).toContain('brix_arena'); });
  it('replaces Rotating Cube in all six ranked identities', () => {
    expect([...RANKED_MODES]).toEqual(['brix_rush', 'assaut', 'brix_arena', 'arc_changeant', 'survie_60s', 'classic']);
  });
  it('makes Assaut free without a ticket', () => {
    expect(FREE_MODES).toContain('assaut');
    expect(requiresTicket('assaut')).toBe(false);
    expect(requiresTicket('zone_mobile')).toBe(false);
    for (const mode of ['classic','brix_rush','arc_changeant','survie_60s','brix_arena','memoire_expert']) expect(requiresTicket(mode)).toBe(false);
  });
  it('redirects old Falling Tunnel selections without mixing historical scores', () => {
    expect(resolveSavedMode('zone_mobile')).toBe('assaut');
    expect(RANKED_MODES).not.toContain('zone_mobile');
  });
  it('redirects saved Rotating Cube selections without reusing its records', () => {
    expect(resolveSavedMode('memoire_expert')).toBe('brix_arena');
    expect(resolveSavedMode('brix_arena')).toBe('brix_arena');
    expect(resolveSavedMode('unknown')).toBe('classic');
  });
});