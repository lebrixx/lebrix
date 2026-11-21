import { trs } from '@/i18n/tr';
export type BonusType = 'power' | 'shield' | 'heal' | 'rapid' | 'pierce';
export type Timed = 'rapid' | 'pierce';
export type Tone = 'p' | 's' | 'a' | 'd' | 'fg';
export const BONUS: Record<BonusType, { icon: string; name: string; desc: string; tone: Tone; weight: number; dur?: number }> = {
  power: { icon: '▲', get name() { return trs('ARME +1', 'WEAPON +1', 'ARMA +1'); }, get desc() { return trs('Ajoute des canons', 'Adds cannons', 'Añade cañones'); }, tone: 'p', weight: 0.5 },
  rapid: { icon: '»', get name() { return trs('TIR RAPIDE', 'RAPID FIRE', 'FUEGO RÁPIDO'); }, get desc() { return trs('Cadence doublée 8s', 'Double fire rate 8s', 'Cadencia doble 8s'); }, tone: 'a', weight: 3, dur: 8 },
  pierce: { icon: '⇑', get name() { return trs('PERFORANT', 'PIERCING', 'PERFORANTE'); }, get desc() { return trs('Tirs traversants 8s', 'Piercing shots 8s', 'Disparos perforantes 8s'); }, tone: 'p', weight: 2, dur: 8 },
  shield: { icon: '◯', get name() { return trs('BOUCLIER', 'SHIELD', 'ESCUDO'); }, get desc() { return trs('Encaisse un coup', 'Absorbs one hit', 'Absorbe un golpe'); }, tone: 's', weight: 2 },
  heal: { icon: '♥', get name() { return trs('VIE +1', 'LIFE +1', 'VIDA +1'); }, get desc() { return trs('Récupère une vie', 'Restores one life', 'Recupera una vida'); }, tone: 'd', weight: 0.7 },
};
// Liste affichée sur l'écran d'accueil : arme +1 remplacé par la bombe (uniquement ici).
export const MENU_BONUS: Array<{ key: string; icon: string; name: string; tone: Tone }> = [
  { key: 'rapid', icon: BONUS.rapid.icon, get name() { return BONUS.rapid.name; }, tone: BONUS.rapid.tone },
  { key: 'pierce', icon: BONUS.pierce.icon, get name() { return BONUS.pierce.name; }, tone: BONUS.pierce.tone },
  { key: 'shield', icon: BONUS.shield.icon, get name() { return BONUS.shield.name; }, tone: BONUS.shield.tone },
  { key: 'heal', icon: BONUS.heal.icon, get name() { return BONUS.heal.name; }, tone: BONUS.heal.tone },
  { key: 'bomb', icon: '✸', get name() { return trs('BOMBE ×2', 'BOMB ×2', 'BOMBA ×2'); }, tone: 'fg' },
];
// L'ARME +1 n'est jamais tirée au hasard : elle ne s'obtient qu'en battant un boss.
export function randomBonus(random = Math.random): BonusType {
  const list = (Object.entries(BONUS) as [BonusType, (typeof BONUS)[BonusType]][]).filter(([kind]) => kind !== 'power');
  let value = random() * list.reduce((total, [, bonus]) => total + bonus.weight, 0);
  for (const [kind, bonus] of list) if ((value -= bonus.weight) < 0) return kind;
  return 'heal';
}