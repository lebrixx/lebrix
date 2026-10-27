import { describe, expect, it } from 'vitest';
import { resolveBrixUsername } from './username';

describe('Brix Rush main-game username', () => {
  it('blocks play without a valid main-game username', () => {
    for (const name of [null, undefined, '', '   ', 'ab']) {
      expect(resolveBrixUsername(name)).toBeNull();
    }
  });
  it('keeps the chosen main-game username unchanged, including all 16 characters', () => {
    expect(resolveBrixUsername('Player1234567890')).toBe('Player1234567890');
    expect(resolveBrixUsername('Lebrix')).toBe('Lebrix');
  });
});