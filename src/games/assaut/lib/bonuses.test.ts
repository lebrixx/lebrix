import { describe, expect, it } from 'vitest';
import { BONUS, MENU_BONUS, randomBonus } from './bonuses';
describe('bonus selection', () => {
  it('never drops magnet, bomb, double score or slow', () => {
    for (let i = 0; i < 1000; i++) expect(['magnet', 'bomb', 'x2', 'slow']).not.toContain(randomBonus(() => i / 1000));
  });
  it('never drops the weapon upgrade — only boss kills grant it', () => {
    const drops = Array.from({ length: 1000 }, (_, i) => randomBonus(() => i / 1000));
    expect(drops.filter(kind => kind === 'power').length).toBe(0);
    for (let i = 0; i < 1000; i++) expect(randomBonus()).not.toBe('power');
  });
});
describe('home screen bonus cards', () => {
  it('shows the bomb card instead of the weapon upgrade', () => {
    const names = MENU_BONUS.map(b => b.name);
    expect(names).toContain('BOMBE ×2');
    expect(names).not.toContain(BONUS.power.name);
    expect(names).toContain(BONUS.heal.name);
  });
});
