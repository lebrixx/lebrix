// Configuration des modes de jeu

export const ModeID = {
  CLASSIC: "classic",
  ARC_CHANGEANT: "arc_changeant", 
  SURVIE_60S: "survie_60s",
  ZONE_MOBILE: "zone_mobile",
  ZONE_TRAITRESSE: "zone_traitresse",
} as const;

export type ModeType = typeof ModeID[keyof typeof ModeID];

export const cfgBase = {
  zoneArc: Math.PI / 5,      // ~36°, valeur par défaut
  speedGain: 1.03,           // +3% par réussite
  debounceMs: 40,            // anti double-jugement
  directionReverseChance: 0.2, // 20% de chance d'inverser la direction
  speedVariation: 0.05       // ±5% de variation de vitesse aléatoire
};

interface ModeConfig {
  name: string;
  desc: string;
  zoneArc?: number;
  arcMin?: number;
  arcMax?: number;
  keepMovingZone: boolean;
  survival: boolean;
  survivalTime: number;
  variableArc: boolean;
  zoneDriftSpeed?: number;
  zoneDriftGain?: number;
  zoneDriftInvertChance?: number;
  multipleZones?: boolean;
  numberOfZones?: number;
  trapZone?: boolean;
}

export const cfgModes: Record<ModeType, ModeConfig> = {
  [ModeID.CLASSIC]: {
    name: "Classique",
    desc: "Le mode de jeu original. L'arc reste fixe, +3% de vitesse par réussite.",
    zoneArc: Math.PI / 5,
    keepMovingZone: false,
    survival: false,
    survivalTime: 0,
    variableArc: false
  },
  [ModeID.ARC_CHANGEANT]: {
    name: "Arc changeant",
    desc: "À chaque réussite, l'arc vert change de taille et d'emplacement. +3% de vitesse.",
    arcMin: Math.PI / 12,     // ~15°
    arcMax: Math.PI / 3,      // ~60°
    keepMovingZone: false,
    survival: false,
    survivalTime: 0,
    variableArc: true
  },
  [ModeID.SURVIE_60S]: {
    name: "Survie 30s",
    desc: "Tu as 30 secondes pour réussir le plus de hits. Un échec = game over !",
    zoneArc: Math.PI / 5,
    keepMovingZone: false,
    survival: true,
    survivalTime: 30,
    variableArc: false
  },
  [ModeID.ZONE_MOBILE]: {
    name: "Zone mobile",
    desc: "L'arc vert glisse en continu autour du cercle. +3% de vitesse à chaque réussite.",
    zoneArc: Math.PI / 5,
    keepMovingZone: true,
    zoneDriftSpeed: 0.6,      // rad/s au départ
    zoneDriftGain: 1.05,      // +5% sur la vitesse de glissement
    zoneDriftInvertChance: 0.3, // 30% de chance d'inverser le sens
    survival: false,
    survivalTime: 0,
    variableArc: false
  },
  [ModeID.ZONE_TRAITRESSE]: {
    name: "Zone traîtresse",
    desc: "Plusieurs zones vertes, mais une seule est piégée. Trouve la bonne zone pour gagner !",
    zoneArc: Math.PI / 6,     // ~30° par zone
    keepMovingZone: false,
    survival: false,
    survivalTime: 0,
    variableArc: false,
    multipleZones: true,
    numberOfZones: 4,         // 4 zones vertes au total
    trapZone: true            // Une des zones est piégée
  }
};

// Utilitaire pour vérifier si l'angle est dans la zone (gère le wrap 2π→0)
export function inArc(angle: number, start: number, end: number): boolean {
  const TAU = Math.PI * 2;
  const normalizedAngle = ((angle % TAU) + TAU) % TAU;
  const normalizedStart = ((start % TAU) + TAU) % TAU;
  const normalizedEnd = ((end % TAU) + TAU) % TAU;
  
  if (normalizedStart <= normalizedEnd) {
    return normalizedAngle >= normalizedStart && normalizedAngle <= normalizedEnd;
  }
  return normalizedAngle >= normalizedStart || normalizedAngle <= normalizedEnd;
}