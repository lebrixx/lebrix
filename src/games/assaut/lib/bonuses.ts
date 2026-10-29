export type BonusType = 'power' | 'shield' | 'heal' | 'rapid' | 'pierce';
export type Timed = 'rapid' | 'pierce';
export type Tone = 'p' | 's' | 'a' | 'd' | 'fg';
export const BONUS: Record<BonusType, { icon: string; name: string; desc: string; tone: Tone; weight: number; dur?: number }> = {
  power: { icon: '▲', name: 'ARME +1', desc: 'Ajoute des canons', tone: 'p', weight: 0.5 },
  rapid: { icon: '»', name: 'TIR RAPIDE', desc: 'Cadence doublée 8s', tone: 'a', weight: 3, dur: 8 },
  pierce: { icon: '⇑', name: 'PERFORANT', desc: 'Tirs traversants 8s', tone: 'p', weight: 2, dur: 8 },
  shield: { icon: '◯', name: 'BOUCLIER', desc: 'Encaisse un coup', tone: 's', weight: 2 },
  heal: { icon: '♥', name: 'VIE +1', desc: 'Récupère une vie', tone: 'd', weight: 0.7 },
};
// Liste affichée sur l'écran d'accueil : arme +1 remplacé par la bombe (uniquement ici).
export const MENU_BONUS: Array<{ key: string; icon: string; name: string; tone: Tone }> = [
  { key: 'rapid', icon: BONUS.rapid.icon, name: BONUS.rapid.name, tone: BONUS.rapid.tone },
  { key: 'pierce', icon: BONUS.pierce.icon, name: BONUS.pierce.name, tone: BONUS.pierce.tone },
  { key: 'shield', icon: BONUS.shield.icon, name: BONUS.shield.name, tone: BONUS.shield.tone },
  { key: 'heal', icon: BONUS.heal.icon, name: BONUS.heal.name, tone: BONUS.heal.tone },
  { key: 'bomb', icon: '✸', name: 'BOMBE ×2', tone: 'fg' },
];
// L'ARME +1 n'est jamais tirée au hasard : elle ne s'obtient qu'en battant un boss.
export function randomBonus(random = Math.random): BonusType {
  const list = (Object.entries(BONUS) as [BonusType, (typeof BONUS)[BonusType]][]).filter(([kind]) => kind !== 'power');
  let value = random() * list.reduce((total, [, bonus]) => total + bonus.weight, 0);
  for (const [kind, bonus] of list) if ((value -= bonus.weight) < 0) return kind;
  return 'heal';
}