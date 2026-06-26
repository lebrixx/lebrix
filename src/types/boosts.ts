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
    coinPrice: 150,
  },
  bigger_zone: {
    id: 'bigger_zone',
    name: 'Convertisseur de score',
    icon: '💰',
    description: 'Convertit ton score en pièces bonus à la fin de la prochaine partie (+1 pièce tous les 3 points). Fonctionne dans tous les modes.',
    coinPrice: 150,
  },
  start_20: {
    id: 'start_20',
    name: 'Démarrage à 20',
    icon: '🚀',
    description: 'Commence la partie avec 20 points',
    coinPrice: 150,
  },
};

export interface BoostInventory {
  [key: string]: number; // boostId -> count
}
