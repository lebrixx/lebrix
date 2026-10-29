// Configuration des modes de jeu

export const ModeID = {
  CLASSIC: "classic",
  ARC_CHANGEANT: "arc_changeant", 
  SURVIE_60S: "survie_60s",
  ZONE_MOBILE: "zone_mobile",
  ASSAUT: "assaut",
  BRIX_RUSH: "brix_rush",
  BRIX_ARENA: "brix_arena",
  MEMOIRE_EXPERT: "memoire_expert",
  PONG_CIRCULAIRE: "pong_circulaire",
} as const;

export type ModeType = typeof ModeID[keyof typeof ModeID];

// Ordre d'affichage partagé entre les modes et les classements.
export const RANKED_MODES = [ModeID.BRIX_RUSH, ModeID.ASSAUT, ModeID.BRIX_ARENA, ModeID.CLASSIC, ModeID.ARC_CHANGEANT, ModeID.SURVIE_60S] as const;
export const FREE_MODES = RANKED_MODES.filter(mode => mode !== ModeID.SURVIE_60S);
export const MODE_UNLOCK_PRICES: Partial<Record<ModeType, number>> = { [ModeID.SURVIE_60S]: 500 };
export const TICKET_MODE = ModeID.ARC_CHANGEANT;
export const requiresTicket = (mode: string): boolean => mode === TICKET_MODE;
export const isStandaloneMode = (mode: string): boolean => mode === ModeID.BRIX_RUSH || mode === ModeID.BRIX_ARENA || mode === ModeID.ASSAUT;
export function resolveSavedMode(saved: string | null): ModeType {
  if (saved === 'zone_mobile') return ModeID.ASSAUT;
  if (saved === 'memoire_expert') return ModeID.BRIX_ARENA;
  if (saved === 'zone_traitresse') return ModeID.BRIX_RUSH;
  return RANKED_MODES.find(mode => mode === saved) ?? ModeID.CLASSIC;
}

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

// L'ordre d'affichage est défini par RANKED_MODES, indépendamment des clés.
export const cfgModes: Record<ModeType, ModeConfig> = {
  [ModeID.BRIX_RUSH]: {
    name: "Brix Rush",
    desc: "Traverse les routes avec ton animal, esquive les voitures et contourne les barrières. Va le plus loin possible !",
    keepMovingZone: false,
    survival: false,
    survivalTime: 0,
    variableArc: false
  },
  [ModeID.ASSAUT]: {
    name: "Assaut",
    desc: "Pilote ton F-104 dans l’espace, collecte les bonus et affronte les vaisseaux boss.",
    keepMovingZone: false,
    survival: false,
    survivalTime: 0,
    variableArc: false
  },
  [ModeID.BRIX_ARENA]: {
    name: "Brix Arena",
    desc: "Affronte les robots, esquive les tirs et améliore ton équipement tous les dix points. Un point toutes les trois secondes de survie.",
    keepMovingZone: false,
    survival: false,
    survivalTime: 0,
    variableArc: false
  },
  [ModeID.ARC_CHANGEANT]: {
    name: "Ball Balance",
    desc: "Guide la bille sur une piste 3D sinueuse en glissant ton doigt. Tiens le plus longtemps possible — 1 point toutes les secondes !",
    keepMovingZone: false,
    survival: false,
    survivalTime: 0,
    variableArc: false
  },
  [ModeID.SURVIE_60S]: {
    name: "Stack Jump",
    desc: "Empile les plaques le plus haut possible ! Tape pour poser, vise le centre, vise les plaques dorées.",
    keepMovingZone: false,
    survival: false,
    survivalTime: 0,
    variableArc: false
  },
  [ModeID.ASSAUT]: {
    name: "Assaut",
    desc: "Pilote ton F-104 dans l’espace, collecte les bonus et affronte les vaisseaux boss.",
    keepMovingZone: false,
    survival: false,
    survivalTime: 0,
    variableArc: false
  },
  [ModeID.ZONE_MOBILE]: {
    name: "Falling Tunnel",
    desc: "Glisse ton doigt pour aligner la bille avec le trou vert. Évite les plaques qui foncent sur toi !",
    keepMovingZone: false,
    survival: false,
    survivalTime: 0,
    variableArc: false
  },
  [ModeID.MEMOIRE_EXPERT]: {
    name: "Rotating Cube",
    desc: "Swipe pour bouger sur la grille 4×4. Évite les zones jaunes qui virent au rouge. Capte les pastilles vertes pour gagner un bouclier (max 2).",
    zoneArc: Math.PI / 5,
    keepMovingZone: false,
    survival: false,
    survivalTime: 0,
    variableArc: false
  },
  [ModeID.PONG_CIRCULAIRE]: {
    name: "Brix Factory",
    desc: "Un petit mode un peu différent qui joue sur la régularité.",
    zoneArc: Math.PI / 4,
    keepMovingZone: false,
    survival: false,
    survivalTime: 0,
    variableArc: false
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
