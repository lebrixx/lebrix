import { ModeID } from '@/constants/modes';

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  type: 'score_in_mode' | 'play_mode';
  target: number;
  mode: string;
  reward: { coins: number };
}

// UNIQUEMENT des défis spécifiques à un mode - plus aucun défi général
export const ALL_DAILY_CHALLENGES: DailyChallenge[] = [
  // Classique - Score
  { id: 'classic_score_10', title: 'Classique Débutant', description: 'Fais un score de 10 en Classique', type: 'score_in_mode', mode: ModeID.CLASSIC, target: 10, reward: { coins: 15 } },
  { id: 'classic_score_15', title: 'Classique Apprenti', description: 'Fais un score de 15 en Classique', type: 'score_in_mode', mode: ModeID.CLASSIC, target: 15, reward: { coins: 20 } },
  { id: 'classic_score_25', title: 'Classique Pro', description: 'Fais un score de 25 en Classique', type: 'score_in_mode', mode: ModeID.CLASSIC, target: 25, reward: { coins: 35 } },
  // Classique - Parties
  { id: 'play_classic_2', title: 'Fan du Classique', description: 'Joue 2 parties en Classique', type: 'play_mode', mode: ModeID.CLASSIC, target: 2, reward: { coins: 15 } },
  { id: 'play_classic_5', title: 'Addict Classique', description: 'Joue 5 parties en Classique', type: 'play_mode', mode: ModeID.CLASSIC, target: 5, reward: { coins: 30 } },
  
  // Arc changeant - Score
  { id: 'arc_score_8', title: 'Arc Débutant', description: 'Fais un score de 8 en Arc changeant', type: 'score_in_mode', mode: ModeID.ARC_CHANGEANT, target: 8, reward: { coins: 15 } },
  { id: 'arc_score_15', title: 'Arc Intermédiaire', description: 'Fais un score de 15 en Arc changeant', type: 'score_in_mode', mode: ModeID.ARC_CHANGEANT, target: 15, reward: { coins: 25 } },
  { id: 'arc_score_20', title: 'Arc Expert', description: 'Fais un score de 20 en Arc changeant', type: 'score_in_mode', mode: ModeID.ARC_CHANGEANT, target: 20, reward: { coins: 40 } },
  // Arc changeant - Parties
  { id: 'play_arc_2', title: 'Explorateur Arc', description: 'Joue 2 parties en Arc changeant', type: 'play_mode', mode: ModeID.ARC_CHANGEANT, target: 2, reward: { coins: 15 } },
  { id: 'play_arc_5', title: 'Maître Arc', description: 'Joue 5 parties en Arc changeant', type: 'play_mode', mode: ModeID.ARC_CHANGEANT, target: 5, reward: { coins: 30 } },
  
  // Survie 30s - Score
  { id: 'survie_score_5', title: 'Survivant Débutant', description: 'Fais un score de 5 en Survie 30s', type: 'score_in_mode', mode: ModeID.SURVIE_60S, target: 5, reward: { coins: 15 } },
  { id: 'survie_score_10', title: 'Survivant', description: 'Fais un score de 10 en Survie 30s', type: 'score_in_mode', mode: ModeID.SURVIE_60S, target: 10, reward: { coins: 30 } },
  { id: 'survie_score_15', title: 'Maître Survie', description: 'Fais un score de 15 en Survie 30s', type: 'score_in_mode', mode: ModeID.SURVIE_60S, target: 15, reward: { coins: 45 } },
  // Survie 30s - Parties
  { id: 'play_survie_2', title: 'Adrénaline', description: 'Joue 2 parties en Survie 30s', type: 'play_mode', mode: ModeID.SURVIE_60S, target: 2, reward: { coins: 15 } },
  { id: 'play_survie_5', title: 'Survivaliste', description: 'Joue 5 parties en Survie 30s', type: 'play_mode', mode: ModeID.SURVIE_60S, target: 5, reward: { coins: 30 } },
  
  // Zone mobile - Score
  { id: 'mobile_score_8', title: 'Zone Nomade', description: 'Fais un score de 8 en Zone mobile', type: 'score_in_mode', mode: ModeID.ZONE_MOBILE, target: 8, reward: { coins: 20 } },
  { id: 'mobile_score_15', title: 'Chasseur Mobile', description: 'Fais un score de 15 en Zone mobile', type: 'score_in_mode', mode: ModeID.ZONE_MOBILE, target: 15, reward: { coins: 35 } },
  { id: 'mobile_score_20', title: 'Expert Mobile', description: 'Fais un score de 20 en Zone mobile', type: 'score_in_mode', mode: ModeID.ZONE_MOBILE, target: 20, reward: { coins: 45 } },
  // Zone mobile - Parties
  { id: 'play_mobile_2', title: 'Zone en mouvement', description: 'Joue 2 parties en Zone mobile', type: 'play_mode', mode: ModeID.ZONE_MOBILE, target: 2, reward: { coins: 15 } },
  { id: 'play_mobile_5', title: 'Maître Mobile', description: 'Joue 5 parties en Zone mobile', type: 'play_mode', mode: ModeID.ZONE_MOBILE, target: 5, reward: { coins: 30 } },
  
  // Zone traîtresse - Score
  { id: 'traitresse_score_5', title: 'Détecteur', description: 'Fais un score de 5 en Zone traîtresse', type: 'score_in_mode', mode: ModeID.ZONE_TRAITRESSE, target: 5, reward: { coins: 20 } },
  { id: 'traitresse_score_10', title: 'Démineur', description: 'Fais un score de 10 en Zone traîtresse', type: 'score_in_mode', mode: ModeID.ZONE_TRAITRESSE, target: 10, reward: { coins: 35 } },
  { id: 'traitresse_score_15', title: 'Expert Démineur', description: 'Fais un score de 15 en Zone traîtresse', type: 'score_in_mode', mode: ModeID.ZONE_TRAITRESSE, target: 15, reward: { coins: 50 } },
  // Zone traîtresse - Parties
  { id: 'play_traitresse_2', title: 'Courageux', description: 'Joue 2 parties en Zone traîtresse', type: 'play_mode', mode: ModeID.ZONE_TRAITRESSE, target: 2, reward: { coins: 15 } },
  { id: 'play_traitresse_5', title: 'Sans peur', description: 'Joue 5 parties en Zone traîtresse', type: 'play_mode', mode: ModeID.ZONE_TRAITRESSE, target: 5, reward: { coins: 30 } },
  
  // Mémoire Expert - Score
  { id: 'memoire_score_3', title: 'Mémoire courte', description: 'Fais un score de 3 en Mémoire Expert', type: 'score_in_mode', mode: ModeID.MEMOIRE_EXPERT, target: 3, reward: { coins: 20 } },
  { id: 'memoire_score_6', title: 'Bonne mémoire', description: 'Fais un score de 6 en Mémoire Expert', type: 'score_in_mode', mode: ModeID.MEMOIRE_EXPERT, target: 6, reward: { coins: 40 } },
  { id: 'memoire_score_10', title: 'Mémoire eidétique', description: 'Fais un score de 10 en Mémoire Expert', type: 'score_in_mode', mode: ModeID.MEMOIRE_EXPERT, target: 10, reward: { coins: 55 } },
  // Mémoire Expert - Parties
  { id: 'play_memoire_2', title: 'Entraînement mental', description: 'Joue 2 parties en Mémoire Expert', type: 'play_mode', mode: ModeID.MEMOIRE_EXPERT, target: 2, reward: { coins: 15 } },
  { id: 'play_memoire_5', title: 'Génie', description: 'Joue 5 parties en Mémoire Expert', type: 'play_mode', mode: ModeID.MEMOIRE_EXPERT, target: 5, reward: { coins: 30 } },
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
  // Stats simplifiées - uniquement par mode
  gamesPerMode: { [mode: string]: number };
  bestScorePerMode: { [mode: string]: number };
}

// NOUVELLE CLÉ - v5 pour forcer un reset complet
const STORAGE_KEY = 'daily_challenges_v5';

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

function getDailyChallengeIndices(date: string): number[] {
  const [year, month, day] = date.split('-').map(Number);
  const seed = Math.abs((year * 31337) ^ (month * 7919) ^ (day * 104729));
  const random = mulberry32(seed);
  
  const indices: number[] = [];
  while (indices.length < 3) {
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
    gamesPerMode: {},
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
  if (typeof data.gamesPerMode !== 'object' || data.gamesPerMode === null) return false;
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
  // Ignorer les parties trop courtes (moins de 5 secondes)
  if (gameDuration < 5) {
    console.log('[DailyChallenges] Partie ignorée - durée:', gameDuration, 's');
    return;
  }
  
  // Valider le score
  if (typeof score !== 'number' || isNaN(score) || score < 0) {
    console.log('[DailyChallenges] Score invalide:', score);
    return;
  }
  
  // Récupérer ou créer la progression du jour
  const progress = getDailyChallengeProgress();
  const challenges = getTodaysChallenges();
  
  console.log('[DailyChallenges] === AVANT mise à jour ===');
  console.log('gamesPerMode:', JSON.stringify(progress.gamesPerMode));
  console.log('bestScorePerMode:', JSON.stringify(progress.bestScorePerMode));
  console.log('Mode joué:', mode, '| Score:', score);
  
  // === MISE À JOUR DES STATISTIQUES UNIQUEMENT POUR CE MODE ===
  
  // 1. Incrémenter le nombre de parties pour ce mode spécifique
  const currentGames = progress.gamesPerMode[mode] || 0;
  progress.gamesPerMode[mode] = currentGames + 1;
  
  // 2. Mettre à jour le meilleur score pour ce mode spécifique
  const currentBest = progress.bestScorePerMode[mode] || 0;
  if (score > currentBest) {
    progress.bestScorePerMode[mode] = score;
  }
  
  console.log('[DailyChallenges] === APRÈS mise à jour ===');
  console.log('gamesPerMode:', JSON.stringify(progress.gamesPerMode));
  console.log('bestScorePerMode:', JSON.stringify(progress.bestScorePerMode));
  
  // === ÉVALUATION DES DÉFIS ===
  challenges.forEach(challenge => {
    // S'assurer que le défi existe dans la progression
    if (!progress.challenges[challenge.id]) {
      progress.challenges[challenge.id] = {
        progress: 0,
        completed: false,
        claimed: false
      };
    }
    
    const challengeData = progress.challenges[challenge.id];
    
    // Ne pas modifier si déjà complété
    if (challengeData.completed) {
      console.log('[DailyChallenges] Défi déjà complété:', challenge.id);
      return;
    }
    
    // Calculer la progression basée sur le type
    let newProgress = 0;
    
    if (challenge.type === 'play_mode') {
      // Nombre de parties jouées dans ce mode spécifique
      newProgress = progress.gamesPerMode[challenge.mode] || 0;
    } else if (challenge.type === 'score_in_mode') {
      // Meilleur score dans ce mode spécifique
      newProgress = progress.bestScorePerMode[challenge.mode] || 0;
    }
    
    challengeData.progress = newProgress;
    
    // Vérifier si complété
    if (newProgress >= challenge.target) {
      challengeData.completed = true;
      console.log('[DailyChallenges] ✅ Défi complété:', challenge.id, '(', newProgress, '/', challenge.target, ')');
    } else {
      console.log('[DailyChallenges] ⏳ Défi en cours:', challenge.id, '(', newProgress, '/', challenge.target, ')');
    }
  });
  
  // Sauvegarder
  saveProgress(progress);
  console.log('[DailyChallenges] Progression sauvegardée');
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

// Reset manuel pour debug
export function resetDailyChallenges(): void {
  const today = getTodayDate();
  const empty = createEmptyProgress(today);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
  console.log('[DailyChallenges] Reset effectué');
}
