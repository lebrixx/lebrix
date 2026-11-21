import { trs } from '@/i18n/tr';
// Configuration des modes de jeu

export const ModeID = {
  CLASSIC: "classic",
  ARC_CHANGEANT: "arc_changeant", 
  SURVIE_60S: "survie_60s",
  ZONE_MOBILE: "zone_mobile",
  ASSAUT: "assaut",
  BRIX_RUSH: "brix_rush",
  BRIX_ARENA: "brix_arena",
  CHRONOPHASE: "chronophase",
  BLOUP: "bloup",
  MEMOIRE_EXPERT: "memoire_expert",
  PONG_CIRCULAIRE: "pong_circulaire",
} as const;

export type ModeType = typeof ModeID[keyof typeof ModeID];

// Ordre d'affichage partagé entre les modes et les classements.
export const RANKED_MODES = [ModeID.BRIX_RUSH, ModeID.ASSAUT, ModeID.BRIX_ARENA, ModeID.CHRONOPHASE, ModeID.BLOUP, ModeID.SURVIE_60S] as const;
export const FREE_MODES = RANKED_MODES.filter(mode => mode !== ModeID.SURVIE_60S);
export const MODE_UNLOCK_PRICES: Partial<Record<ModeType, number>> = { [ModeID.SURVIE_60S]: 500 };
export const TICKET_MODE = ModeID.BLOUP;
export const requiresTicket = (mode: string): boolean => mode === TICKET_MODE;
export const isStandaloneMode = (mode: string): boolean => mode === ModeID.BRIX_RUSH || mode === ModeID.BRIX_ARENA || mode === ModeID.ASSAUT || mode === ModeID.CHRONOPHASE || mode === ModeID.BLOUP;
export function resolveSavedMode(saved: string | null): ModeType {
  if (saved === 'zone_mobile') return ModeID.ASSAUT;
  if (saved === 'memoire_expert') return ModeID.BRIX_ARENA;
  if (saved === 'zone_traitresse') return ModeID.BRIX_RUSH;
  if (saved === 'classic') return ModeID.CHRONOPHASE;
  if (saved === 'arc_changeant') return ModeID.BLOUP;
  return RANKED_MODES.find(mode => mode === saved) ?? ModeID.CHRONOPHASE;
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
    get desc() { return trs("Traverse les routes avec ton animal, esquive les voitures et contourne les barrières. Va le plus loin possible !", "Cross the roads with your animal, dodge the cars and get around the fences. Go as far as you can!", "Cruza las carreteras con tu animal, esquiva los coches y rodea las vallas. ¡Llega lo más lejos posible!"); },
    keepMovingZone: false,
    survival: false,
    survivalTime: 0,
    variableArc: false
  },
  [ModeID.ASSAUT]: {
    name: "Assaut",
    get desc() { return trs("Pilote ton F-104 dans l’espace, collecte les bonus et affronte les vaisseaux boss.", "Fly your F-104 through space, collect power-ups and take on the boss ships.", "Pilota tu F-104 por el espacio, recoge bonus y enfréntate a las naves jefe."); },
    keepMovingZone: false,
    survival: false,
    survivalTime: 0,
    variableArc: false
  },
  [ModeID.BRIX_ARENA]: {
    name: "Brix Arena",
    get desc() { return trs("Affronte les robots, esquive les tirs et améliore ton équipement tous les dix points. Un point toutes les trois secondes de survie.", "Fight the robots, dodge their shots and upgrade your gear every ten points. One point for every three seconds you survive.", "Enfréntate a los robots, esquiva los disparos y mejora tu equipo cada diez puntos. Un punto por cada tres segundos de supervivencia."); },
    keepMovingZone: false,
    survival: false,
    survivalTime: 0,
    variableArc: false
  },
  [ModeID.CHRONOPHASE]: {
    name: "Chronophase",
    get desc() { return trs("Cours, change de couleur d'un tap et remonte le temps pour traverser chaque obstacle.", "Run, change color with a tap and rewind time to get through every obstacle.", "Corre, cambia de color con un toque y retrocede en el tiempo para superar cada obstáculo."); },
    keepMovingZone: false,
    survival: false,
    survivalTime: 0,
    variableArc: false
  },
  [ModeID.BLOUP]: {
    name: "Bloup",
    get desc() { return trs("Lâche les boules de gelée, fusionne les couleurs et évite de faire déborder le pot. Deux fusions font un point !", "Drop the jelly balls, merge the colors and don't let the jar overflow. Two merges make one point!", "Suelta las bolas de gelatina, fusiona los colores y evita que el bote se desborde. ¡Dos fusiones dan un punto!"); },
    keepMovingZone: false,
    survival: false,
    survivalTime: 0,
    variableArc: false
  },
  [ModeID.CLASSIC]: {
    name: "Cube Dodge",
    desc: "Esquive les blocs, change de couleur d'un tap et traverse les portails pour entrer en PHASE ×3 !",
    zoneArc: Math.PI / 5,
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
    name: "Altitude",
    get desc() { return trs("Pose chaque plaque au millimètre. Monte plus haut que jamais.", "Place every plate to the millimeter. Climb higher than ever.", "Coloca cada placa al milímetro. Sube más alto que nunca."); },
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
