export type BoostType = 'shield' | 'bigger_zone' | 'start_20';

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
    name: 'Bouclier',
    icon: '🛡️',
    description: 'Protège automatiquement d\'une erreur',
    coinPrice: 100,
  },
  bigger_zone: {
    id: 'bigger_zone',
    name: 'Zone verte plus grande',
    icon: '🎯',
    description: 'Agrandit temporairement la zone verte',
    coinPrice: 100,
  },
  start_20: {
    id: 'start_20',
    name: 'Démarrage à 20',
    icon: '🚀',
    description: 'Commence la partie avec 20 points',
    coinPrice: 100,
  },
};

export interface BoostInventory {
  [key: string]: number; // boostId -> count
}
