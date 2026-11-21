import type { BoostType } from '@/types/boosts';

/**
 * Boosts de partie pour les modes autonomes (Brix Rush, Assaut, Brix Arena, Chronophase, Altitude).
 * Les boosts sont consommés au lancement de la partie (pas à la fin) pour qu'un joueur
 * qui quitte en cours de route ne puisse pas les réutiliser.
 */
const STORAGE_KEY = 'luckyStopBoosts';
const UPDATE_EVENT = 'boostsInventoryUpdate';
export const BOOST_FX_EVENT = 'ls-run-boost-fx';

export const RUN_BOOST_ORDER: BoostType[] = ['shield', 'revive', 'start_20', 'bigger_zone'];
export const START_BONUS = 20;

export type RunBoostFx =
  | { kind: 'shield' }
  | { kind: 'revive' }
  | { kind: 'start' }
  | { kind: 'converter'; amount: number };

function readInventory(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getBoostStock(id: BoostType): number {
  return Math.max(0, readInventory()[id] || 0);
}

/** Retire de l'inventaire les boosts sélectionnés réellement possédés et renvoie ceux qui sont actifs pour la partie. */
export function consumeRunBoosts(selected: readonly string[]): BoostType[] {
  const inventory = readInventory();
  const used: BoostType[] = [];
  for (const id of RUN_BOOST_ORDER) {
    if (!selected.includes(id) || used.includes(id)) continue;
    if ((inventory[id] || 0) <= 0) continue;
    inventory[id] = (inventory[id] || 0) - 1;
    used.push(id);
  }
  if (used.length) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
      window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: inventory }));
    } catch { /* stockage indisponible : la partie continue */ }
  }
  return used;
}

/** Garde uniquement les boosts encore en stock (après un achat / une consommation ailleurs). */
export function keepOwnedBoosts(selected: readonly BoostType[]): BoostType[] {
  return selected.filter(id => getBoostStock(id) > 0);
}

export function emitBoostFx(fx: RunBoostFx) {
  window.dispatchEvent(new CustomEvent(BOOST_FX_EVENT, { detail: fx }));
}
