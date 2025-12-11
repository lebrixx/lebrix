import { ModeID } from '@/constants/modes';

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  type: 'score_in_mode';
  target: number;
  mode: string;
  reward: { coins: number };
}

// UNIQUEMENT des défis de score dans un mode spécifique
export const ALL_DAILY_CHALLENGES: DailyChallenge[] = [
  // Classique
  { id: 'classic_score_10', title: 'Classique Débutant', description: 'Fais un score de 10 en Classique', type: 'score_in_mode', mode: ModeID.CLASSIC, target: 10, reward: { coins: 15 } },
  { id: 'classic_score_15', title: 'Classique Apprenti', description: 'Fais un score de 15 en Classique', type: 'score_in_mode', mode: ModeID.CLASSIC, target: 15, reward: { coins: 20 } },
  { id: 'classic_score_20', title: 'Classique Confirmé', description: 'Fais un score de 20 en Classique', type: 'score_in_mode', mode: ModeID.CLASSIC, target: 20, reward: { coins: 30 } },
  { id: 'classic_score_25', title: 'Classique Pro', description: 'Fais un score de 25 en Classique', type: 'score_in_mode', mode: ModeID.CLASSIC, target: 25, reward: { coins: 40 } },
  
  // Arc changeant
  { id: 'arc_score_8', title: 'Arc Débutant', description: 'Fais un score de 8 en Arc changeant', type: 'score_in_mode', mode: ModeID.ARC_CHANGEANT, target: 8, reward: { coins: 15 } },
  { id: 'arc_score_12', title: 'Arc Intermédiaire', description: 'Fais un score de 12 en Arc changeant', type: 'score_in_mode', mode: ModeID.ARC_CHANGEANT, target: 12, reward: { coins: 20 } },
  { id: 'arc_score_15', title: 'Arc Confirmé', description: 'Fais un score de 15 en Arc changeant', type: 'score_in_mode', mode: ModeID.ARC_CHANGEANT, target: 15, reward: { coins: 30 } },
  { id: 'arc_score_20', title: 'Arc Expert', description: 'Fais un score de 20 en Arc changeant', type: 'score_in_mode', mode: ModeID.ARC_CHANGEANT, target: 20, reward: { coins: 45 } },
  
  // Survie 30s
  { id: 'survie_score_5', title: 'Survivant Débutant', description: 'Fais un score de 5 en Survie 30s', type: 'score_in_mode', mode: ModeID.SURVIE_60S, target: 5, reward: { coins: 15 } },
  { id: 'survie_score_8', title: 'Survivant', description: 'Fais un score de 8 en Survie 30s', type: 'score_in_mode', mode: ModeID.SURVIE_60S, target: 8, reward: { coins: 25 } },
  { id: 'survie_score_12', title: 'Survie Confirmé', description: 'Fais un score de 12 en Survie 30s', type: 'score_in_mode', mode: ModeID.SURVIE_60S, target: 12, reward: { coins: 35 } },
  { id: 'survie_score_15', title: 'Maître Survie', description: 'Fais un score de 15 en Survie 30s', type: 'score_in_mode', mode: ModeID.SURVIE_60S, target: 15, reward: { coins: 50 } },
  
  // Zone mobile
  { id: 'mobile_score_8', title: 'Zone Nomade', description: 'Fais un score de 8 en Zone mobile', type: 'score_in_mode', mode: ModeID.ZONE_MOBILE, target: 8, reward: { coins: 20 } },
  { id: 'mobile_score_12', title: 'Chasseur Mobile', description: 'Fais un score de 12 en Zone mobile', type: 'score_in_mode', mode: ModeID.ZONE_MOBILE, target: 12, reward: { coins: 30 } },
  { id: 'mobile_score_15', title: 'Mobile Confirmé', description: 'Fais un score de 15 en Zone mobile', type: 'score_in_mode', mode: ModeID.ZONE_MOBILE, target: 15, reward: { coins: 40 } },
  { id: 'mobile_score_20', title: 'Expert Mobile', description: 'Fais un score de 20 en Zone mobile', type: 'score_in_mode', mode: ModeID.ZONE_MOBILE, target: 20, reward: { coins: 50 } },
  
  // Zone traîtresse
  { id: 'traitresse_score_5', title: 'Détecteur', description: 'Fais un score de 5 en Zone traîtresse', type: 'score_in_mode', mode: ModeID.ZONE_TRAITRESSE, target: 5, reward: { coins: 20 } },
  { id: 'traitresse_score_8', title: 'Démineur', description: 'Fais un score de 8 en Zone traîtresse', type: 'score_in_mode', mode: ModeID.ZONE_TRAITRESSE, target: 8, reward: { coins: 30 } },
  { id: 'traitresse_score_10', title: 'Traîtresse Confirmé', description: 'Fais un score de 10 en Zone traîtresse', type: 'score_in_mode', mode: ModeID.ZONE_TRAITRESSE, target: 10, reward: { coins: 40 } },
  { id: 'traitresse_score_15', title: 'Expert Démineur', description: 'Fais un score de 15 en Zone traîtresse', type: 'score_in_mode', mode: ModeID.ZONE_TRAITRESSE, target: 15, reward: { coins: 55 } },
  
  // Mémoire Expert
  { id: 'memoire_score_3', title: 'Mémoire courte', description: 'Fais un score de 3 en Mémoire Expert', type: 'score_in_mode', mode: ModeID.MEMOIRE_EXPERT, target: 3, reward: { coins: 20 } },
  { id: 'memoire_score_5', title: 'Bonne mémoire', description: 'Fais un score de 5 en Mémoire Expert', type: 'score_in_mode', mode: ModeID.MEMOIRE_EXPERT, target: 5, reward: { coins: 35 } },
  { id: 'memoire_score_8', title: 'Mémoire Confirmé', description: 'Fais un score de 8 en Mémoire Expert', type: 'score_in_mode', mode: ModeID.MEMOIRE_EXPERT, target: 8, reward: { coins: 50 } },
  { id: 'memoire_score_10', title: 'Mémoire eidétique', description: 'Fais un score de 10 en Mémoire Expert', type: 'score_in_mode', mode: ModeID.MEMOIRE_EXPERT, target: 10, reward: { coins: 60 } },
];

export interface DailyChallengeProgress {
  date: string;
  challenges: {
    [challengeId: string]: {
      progress: number;
      completed: boolean;
      claimed: boolean;
    };
  };
  // Meilleur score du jour pour chaque mode
  bestScorePerMode: { [mode: string]: number };
}

// NOUVELLE CLÉ v6 - reset complet
const STORAGE_KEY = 'daily_challenges_v6';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Générateur pseudo-aléatoire déterministe
function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Sélectionne 2 défis différents pour aujourd'hui
function getDailyChallengeIndices(date: string): number[] {
  const [year, month, day] = date.split('-').map(Number);
  const seed = Math.abs((year * 31337) ^ (month * 7919) ^ (day * 104729));
  const random = mulberry32(seed);
  
  const indices: number[] = [];
  while (indices.length < 2) {
    const index = Math.floor(random() * ALL_DAILY_CHALLENGES.length);
    if (!indices.includes(index)) {
      indices.push(index);
    }
  }
  return indices;
}

export function getTodaysChallenges(): DailyChallenge[] {
  const today = getTodayDate();
  const indices = getDailyChallengeIndices(today);
  return indices.map(i => ALL_DAILY_CHALLENGES[i]);
}

function createEmptyProgress(date: string): DailyChallengeProgress {
  const challenges = getTodaysChallenges();
  
  const progress: DailyChallengeProgress = {
    date,
    challenges: {},
    bestScorePerMode: {}
  };
  
  // Initialiser chaque défi à 0
  challenges.forEach(c => {
    progress.challenges[c.id] = {
      progress: 0,
      completed: false,
      claimed: false
    };
  });
  
  return progress;
}

function isValidProgress(data: any, today: string): data is DailyChallengeProgress {
  if (!data || typeof data !== 'object') return false;
  if (data.date !== today) return false;
  if (typeof data.bestScorePerMode !== 'object' || data.bestScorePerMode === null) return false;
  if (!data.challenges || typeof data.challenges !== 'object') return false;
  return true;
}

export function getDailyChallengeProgress(): DailyChallengeProgress {
  const today = getTodayDate();
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (isValidProgress(parsed, today)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('[DailyChallenges] Error reading progress:', e);
  }
  
  // Créer une nouvelle progression vide
  const empty = createEmptyProgress(today);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
  return empty;
}

function saveProgress(progress: DailyChallengeProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

// FONCTION PRINCIPALE - appelée après chaque partie terminée
export function updateDailyChallengeProgress(
  mode: string,
  score: number,
  gameDuration: number
): void {
  // Ignorer les parties trop courtes
  if (gameDuration < 5) {
    console.log('[DailyChallenges] Partie ignorée - durée:', gameDuration, 's');
    return;
  }
  
  // Valider le score
  if (typeof score !== 'number' || isNaN(score) || score < 0) {
    console.log('[DailyChallenges] Score invalide:', score);
    return;
  }
  
  const progress = getDailyChallengeProgress();
  const challenges = getTodaysChallenges();
  
  console.log('[DailyChallenges] Mode:', mode, '| Score:', score);
  console.log('[DailyChallenges] bestScorePerMode AVANT:', JSON.stringify(progress.bestScorePerMode));
  
  // Mettre à jour le meilleur score du jour pour ce mode
  const currentBest = progress.bestScorePerMode[mode] || 0;
  if (score > currentBest) {
    progress.bestScorePerMode[mode] = score;
    console.log('[DailyChallenges] Nouveau meilleur score pour', mode, ':', score);
  }
  
  console.log('[DailyChallenges] bestScorePerMode APRÈS:', JSON.stringify(progress.bestScorePerMode));
  
  // Évaluer chaque défi du jour
  challenges.forEach(challenge => {
    // S'assurer que le défi existe
    if (!progress.challenges[challenge.id]) {
      progress.challenges[challenge.id] = {
        progress: 0,
        completed: false,
        claimed: false
      };
    }
    
    const challengeData = progress.challenges[challenge.id];
    
    // Si déjà complété, ne rien faire
    if (challengeData.completed) {
      return;
    }
    
    // Le défi concerne-t-il le mode joué ?
    if (challenge.mode !== mode) {
      console.log('[DailyChallenges] Défi', challenge.id, 'pas pour ce mode (', challenge.mode, '!=', mode, ')');
      return;
    }
    
    // Mettre à jour la progression = meilleur score dans ce mode
    const bestScore = progress.bestScorePerMode[mode] || 0;
    challengeData.progress = bestScore;
    
    // Vérifier si complété
    if (bestScore >= challenge.target) {
      challengeData.completed = true;
      console.log('[DailyChallenges] ✅ COMPLÉTÉ:', challenge.id, '(', bestScore, '>=', challenge.target, ')');
    } else {
      console.log('[DailyChallenges] ⏳ En cours:', challenge.id, '(', bestScore, '/', challenge.target, ')');
    }
  });
  
  saveProgress(progress);
}

// Réclamer un défi complété
export function claimDailyChallenge(challengeId: string): number {
  const progress = getDailyChallengeProgress();
  const challenges = getTodaysChallenges();
  const challenge = challenges.find(c => c.id === challengeId);
  
  if (!challenge) return 0;
  
  const challengeData = progress.challenges[challengeId];
  if (!challengeData || !challengeData.completed || challengeData.claimed) {
    return 0;
  }
  
  challengeData.claimed = true;
  saveProgress(progress);
  
  return challenge.reward.coins;
}

// Vérifier s'il y a des récompenses non réclamées
export function hasPendingDailyChallengeRewards(): boolean {
  const progress = getDailyChallengeProgress();
  return Object.values(progress.challenges).some(c => c.completed && !c.claimed);
}

// Reset manuel
export function resetDailyChallenges(): void {
  const today = getTodayDate();
  const empty = createEmptyProgress(today);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
  console.log('[DailyChallenges] Reset effectué');
}
