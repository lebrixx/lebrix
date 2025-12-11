import { ModeID } from '@/constants/modes';

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  type: 'play_games' | 'score_in_mode' | 'total_score' | 'play_mode' | 'best_score_any' | 'play_different_modes';
  target: number;
  mode?: string;
  reward: { coins: number };
}

// 30 défis quotidiens différents
export const ALL_DAILY_CHALLENGES: DailyChallenge[] = [
  // Défis de parties jouées
  { id: 'play_3_games', title: 'Échauffement', description: 'Joue 3 parties', type: 'play_games', target: 3, reward: { coins: 15 } },
  { id: 'play_5_games', title: 'Joueur actif', description: 'Joue 5 parties', type: 'play_games', target: 5, reward: { coins: 25 } },
  { id: 'play_10_games', title: 'Marathon', description: 'Joue 10 parties', type: 'play_games', target: 10, reward: { coins: 50 } },
  
  // Défis par mode - Classique
  { id: 'classic_score_15', title: 'Classique Apprenti', description: 'Fais un score de 15 en Classique', type: 'score_in_mode', mode: ModeID.CLASSIC, target: 15, reward: { coins: 20 } },
  { id: 'classic_score_25', title: 'Classique Pro', description: 'Fais un score de 25 en Classique', type: 'score_in_mode', mode: ModeID.CLASSIC, target: 25, reward: { coins: 35 } },
  { id: 'play_classic_3', title: 'Fan du Classique', description: 'Joue 3 parties en Classique', type: 'play_mode', mode: ModeID.CLASSIC, target: 3, reward: { coins: 20 } },
  
  // Défis par mode - Arc changeant
  { id: 'arc_score_10', title: 'Arc Débutant', description: 'Fais un score de 10 en Arc changeant', type: 'score_in_mode', mode: ModeID.ARC_CHANGEANT, target: 10, reward: { coins: 20 } },
  { id: 'arc_score_20', title: 'Arc Expert', description: 'Fais un score de 20 en Arc changeant', type: 'score_in_mode', mode: ModeID.ARC_CHANGEANT, target: 20, reward: { coins: 40 } },
  { id: 'play_arc_3', title: 'Explorateur Arc', description: 'Joue 3 parties en Arc changeant', type: 'play_mode', mode: ModeID.ARC_CHANGEANT, target: 3, reward: { coins: 20 } },
  
  // Défis par mode - Survie 30s
  { id: 'survie_score_8', title: 'Survivant', description: 'Fais un score de 8 en Survie 30s', type: 'score_in_mode', mode: ModeID.SURVIE_60S, target: 8, reward: { coins: 25 } },
  { id: 'survie_score_15', title: 'Maître Survie', description: 'Fais un score de 15 en Survie 30s', type: 'score_in_mode', mode: ModeID.SURVIE_60S, target: 15, reward: { coins: 45 } },
  { id: 'play_survie_3', title: 'Adrénaline', description: 'Joue 3 parties en Survie 30s', type: 'play_mode', mode: ModeID.SURVIE_60S, target: 3, reward: { coins: 20 } },
  
  // Défis par mode - Zone mobile
  { id: 'mobile_score_10', title: 'Zone Nomade', description: 'Fais un score de 10 en Zone mobile', type: 'score_in_mode', mode: ModeID.ZONE_MOBILE, target: 10, reward: { coins: 25 } },
  { id: 'mobile_score_20', title: 'Chasseur Mobile', description: 'Fais un score de 20 en Zone mobile', type: 'score_in_mode', mode: ModeID.ZONE_MOBILE, target: 20, reward: { coins: 45 } },
  { id: 'play_mobile_3', title: 'Zone en mouvement', description: 'Joue 3 parties en Zone mobile', type: 'play_mode', mode: ModeID.ZONE_MOBILE, target: 3, reward: { coins: 20 } },
  
  // Défis par mode - Zone traîtresse
  { id: 'traitresse_score_8', title: 'Détecteur', description: 'Fais un score de 8 en Zone traîtresse', type: 'score_in_mode', mode: ModeID.ZONE_TRAITRESSE, target: 8, reward: { coins: 30 } },
  { id: 'traitresse_score_15', title: 'Démineur', description: 'Fais un score de 15 en Zone traîtresse', type: 'score_in_mode', mode: ModeID.ZONE_TRAITRESSE, target: 15, reward: { coins: 50 } },
  { id: 'play_traitresse_3', title: 'Courageux', description: 'Joue 3 parties en Zone traîtresse', type: 'play_mode', mode: ModeID.ZONE_TRAITRESSE, target: 3, reward: { coins: 20 } },
  
  // Défis par mode - Mémoire Expert
  { id: 'memoire_score_5', title: 'Mémoire courte', description: 'Fais un score de 5 en Mémoire Expert', type: 'score_in_mode', mode: ModeID.MEMOIRE_EXPERT, target: 5, reward: { coins: 30 } },
  { id: 'memoire_score_10', title: 'Mémoire eidétique', description: 'Fais un score de 10 en Mémoire Expert', type: 'score_in_mode', mode: ModeID.MEMOIRE_EXPERT, target: 10, reward: { coins: 55 } },
  { id: 'play_memoire_3', title: 'Entraînement mental', description: 'Joue 3 parties en Mémoire Expert', type: 'play_mode', mode: ModeID.MEMOIRE_EXPERT, target: 3, reward: { coins: 20 } },
  
  // Défis mixtes
  { id: 'play_2_modes', title: 'Polyvalent', description: 'Joue dans 2 modes différents', type: 'play_different_modes', target: 2, reward: { coins: 25 } },
  { id: 'total_score_30', title: 'Cumulateur', description: 'Cumule 30 points au total aujourd\'hui', type: 'total_score', target: 30, reward: { coins: 30 } },
  { id: 'total_score_50', title: 'Collectionneur', description: 'Cumule 50 points au total aujourd\'hui', type: 'total_score', target: 50, reward: { coins: 45 } },
  { id: 'total_score_100', title: 'Accumulateur', description: 'Cumule 100 points au total aujourd\'hui', type: 'total_score', target: 100, reward: { coins: 75 } },
  
  // Défis simples
  { id: 'first_game', title: 'Premier pas', description: 'Joue ta première partie du jour', type: 'play_games', target: 1, reward: { coins: 10 } },
  { id: 'score_any_10', title: 'Décollage', description: 'Fais un score de 10 en une partie', type: 'best_score_any', target: 10, reward: { coins: 15 } },
  { id: 'play_7_games', title: 'Semaine en un jour', description: 'Joue 7 parties', type: 'play_games', target: 7, reward: { coins: 35 } },
  { id: 'play_any_mode_5', title: 'Découvreur', description: 'Joue 5 parties', type: 'play_games', target: 5, reward: { coins: 30 } },
  { id: 'score_any_20', title: 'Bonne performance', description: 'Fais un score de 20 en une partie', type: 'best_score_any', target: 20, reward: { coins: 25 } },
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
  stats: {
    gamesPlayed: number;
    totalScore: number;
    modesPlayed: string[];
    gamesPerMode: { [mode: string]: number };
    bestScorePerMode: { [mode: string]: number };
    bestScoreAny: number;
  };
}

// NOUVELLE CLÉ - v4 pour forcer un reset complet
const STORAGE_KEY = 'daily_challenges_v4';

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
    stats: {
      gamesPlayed: 0,
      totalScore: 0,
      modesPlayed: [],
      gamesPerMode: {},
      bestScorePerMode: {},
      bestScoreAny: 0
    }
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
  if (!data.stats || typeof data.stats !== 'object') return false;
  if (typeof data.stats.gamesPlayed !== 'number') return false;
  if (typeof data.stats.totalScore !== 'number') return false;
  if (!Array.isArray(data.stats.modesPlayed)) return false;
  if (typeof data.stats.gamesPerMode !== 'object') return false;
  if (typeof data.stats.bestScorePerMode !== 'object') return false;
  if (typeof data.stats.bestScoreAny !== 'number') return false;
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

// Calculer la progression d'un défi basé sur les stats actuelles
function calculateChallengeProgress(challenge: DailyChallenge, stats: DailyChallengeProgress['stats']): number {
  switch (challenge.type) {
    case 'play_games':
      return stats.gamesPlayed;
      
    case 'score_in_mode':
      if (challenge.mode) {
        return stats.bestScorePerMode[challenge.mode] || 0;
      }
      return 0;
      
    case 'total_score':
      return stats.totalScore;
      
    case 'play_mode':
      if (challenge.mode) {
        return stats.gamesPerMode[challenge.mode] || 0;
      }
      return 0;
      
    case 'best_score_any':
      return stats.bestScoreAny;
      
    case 'play_different_modes':
      return stats.modesPlayed.length;
      
    default:
      return 0;
  }
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
  console.log('Stats:', JSON.stringify(progress.stats));
  console.log('Mode joué:', mode, '| Score:', score);
  
  // === MISE À JOUR DES STATISTIQUES ===
  
  // 1. Incrémenter le nombre de parties
  progress.stats.gamesPlayed = (progress.stats.gamesPlayed || 0) + 1;
  
  // 2. Ajouter au score total
  progress.stats.totalScore = (progress.stats.totalScore || 0) + score;
  
  // 3. Ajouter le mode à la liste si nouveau
  if (!progress.stats.modesPlayed) {
    progress.stats.modesPlayed = [];
  }
  if (!progress.stats.modesPlayed.includes(mode)) {
    progress.stats.modesPlayed.push(mode);
  }
  
  // 4. Incrémenter le compteur de parties pour ce mode
  if (!progress.stats.gamesPerMode) {
    progress.stats.gamesPerMode = {};
  }
  progress.stats.gamesPerMode[mode] = (progress.stats.gamesPerMode[mode] || 0) + 1;
  
  // 5. Mettre à jour le meilleur score pour ce mode
  if (!progress.stats.bestScorePerMode) {
    progress.stats.bestScorePerMode = {};
  }
  const currentBestForMode = progress.stats.bestScorePerMode[mode] || 0;
  if (score > currentBestForMode) {
    progress.stats.bestScorePerMode[mode] = score;
  }
  
  // 6. Mettre à jour le meilleur score tous modes confondus
  if (score > (progress.stats.bestScoreAny || 0)) {
    progress.stats.bestScoreAny = score;
  }
  
  console.log('[DailyChallenges] === APRÈS mise à jour stats ===');
  console.log('Stats:', JSON.stringify(progress.stats));
  
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
      return;
    }
    
    // Calculer la nouvelle progression
    const newProgress = calculateChallengeProgress(challenge, progress.stats);
    challengeData.progress = newProgress;
    
    // Vérifier si complété
    if (newProgress >= challenge.target) {
      challengeData.completed = true;
      console.log('[DailyChallenges] Défi complété:', challenge.id, '(', newProgress, '/', challenge.target, ')');
    } else {
      console.log('[DailyChallenges] Défi en cours:', challenge.id, '(', newProgress, '/', challenge.target, ')');
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
