import { trs } from '@/i18n/tr';
export type BoostType = 'shield' | 'bigger_zone' | 'start_20' | 'revive';

export interface Boost {
  id: BoostType;
  name: string;
  icon: string;
  description: string;
  coinPrice: number;
}

export const BOOSTS: Record<BoostType, Boost> = {
  shield: {
    id: 'shield',
    get name() { return trs('Bouclier', 'Shield', 'Escudo'); },
    icon: '🛡️',
    get description() { return trs('Protège automatiquement d\'une erreur', 'Automatically protects you from one mistake', 'Te protege automáticamente de un error'); },
    coinPrice: 150,
  },
  bigger_zone: {
    id: 'bigger_zone',
    get name() { return trs('Convertisseur de score', 'Score converter', 'Convertidor de puntuación'); },
    icon: '💰',
    get description() { return trs('Convertit ton score en pièces bonus à la fin de la prochaine partie (+1 pièce tous les 3 points). Fonctionne dans tous les modes.', 'Turns your score into bonus coins at the end of your next game (+1 coin every 3 points). Works in every mode.', 'Convierte tu puntuación en monedas extra al final de la próxima partida (+1 moneda cada 3 puntos). Funciona en todos los modos.'); },
    coinPrice: 150,
  },
  start_20: {
    id: 'start_20',
    get name() { return trs('Démarrage à 20', 'Start at 20', 'Empezar en 20'); },
    icon: '🚀',
    get description() { return trs('Commence la partie avec 20 points', 'Start the game with 20 points', 'Empieza la partida con 20 puntos'); },
    coinPrice: 150,
  },
  revive: {
    id: 'revive',
    get name() { return trs('Seconde chance', 'Second chance', 'Segunda oportunidad'); },
    icon: '❤️‍🔥',
    get description() { return trs('Active-le au début de la partie : quand tu perds, tu reprends automatiquement là où tu en étais. Fonctionne dans tous les modes.', 'Activate it at the start of a game: when you lose, you automatically continue where you were. Works in every mode.', 'Actívalo al empezar la partida: cuando pierdes, continúas automáticamente donde estabas. Funciona en todos los modos.'); },
    coinPrice: 250,
  },
};

export interface BoostInventory {
  [key: string]: number; // boostId -> count
}
