export type BoostType = 'shield' | 'slowdown' | 'start20';

export interface Boost {
  id: BoostType;
  name: string;
  description: string;
  icon: string;
  price: number; // Prix en coins
}

export interface BoostInventory {
  shield: number;
  slowdown: number;
  start20: number;
}

export interface ActiveBoosts {
  shield: boolean;
  slowdown: boolean;
  slowdownTimeLeft?: number;
  start20: boolean;
}

export const AVAILABLE_BOOSTS: Boost[] = [
  {
    id: 'shield',
    name: 'Bouclier',
    description: 'Protège d\'une erreur (activation automatique)',
    icon: '🛡️',
    price: 100,
  },
  {
    id: 'slowdown',
    name: 'Ralentir',
    description: 'Ralentit le cercle pendant 5 secondes',
    icon: '🐢',
    price: 100,
  },
  {
    id: 'start20',
    name: 'Démarrage à 20',
    description: 'Commence la partie avec 20 points',
    icon: '🚀',
    price: 100,
  },
];
