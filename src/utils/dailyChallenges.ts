import { ModeID } from '@/constants/modes';

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  type: 'play_games' | 'score_in_mode' | 'total_score' | 'play_mode' | 'best_score_any' | 'play_different_modes';
  target: number;
  mode?: string; // Mode spécifique si applicable
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
  date: string; // YYYY-MM-DD
  challenges: {
    [challengeId: string]: {
      progress: number;
      completed: boolean;
      claimed: boolean;
    };
  };
  // Statistiques de la journée - TOUTES doivent commencer à 0 au début du jour
  gamesPlayedToday: number;
  totalScoreToday: number;
  modesPlayedToday: string[];
  gamesPerModeToday: { [mode: string]: number };
  bestScorePerModeToday: { [mode: string]: number };
  bestScoreAnyModeToday: number;
}

const DAILY_CHALLENGES_KEY = 'daily_challenges_progress_v2'; // Nouvelle clé pour reset

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Générateur pseudo-aléatoire Mulberry32
function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function getDailyChallengeIndices(date: string): number[] {
  const dateParts = date.split('-');
  const year = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]);
  const day = parseInt(dateParts[2]);
  
  // Seed basé sur la date
  let seed = (year * 31337) ^ (month * 7919) ^ (day * 104729);
  seed = Math.abs(seed);
  
  const random = mulberry32(seed);
  const indices: number[] = [];
  const totalChallenges = ALL_DAILY_CHALLENGES.length;
  
  while (indices.length < 3) {
    const index = Math.floor(random() * totalChallenges);
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

function createFreshProgress(date: string): DailyChallengeProgress {
  const challenges = getTodaysChallenges();
  const progress: DailyChallengeProgress = {
    date,
    challenges: {},
    gamesPlayedToday: 0,
    totalScoreToday: 0,
    modesPlayedToday: [],
    gamesPerModeToday: {},
    bestScorePerModeToday: {},
    bestScoreAnyModeToday: 0
  };
  
  challenges.forEach(c => {
    progress.challenges[c.id] = { progress: 0, completed: false, claimed: false };
  });
  
  return progress;
}

export function getDailyChallengeProgress(): DailyChallengeProgress {
  const saved = localStorage.getItem(DAILY_CHALLENGES_KEY);
  const today = getTodayDate();
  
  if (saved) {
    try {
      const parsed: DailyChallengeProgress = JSON.parse(saved);
      
      // Si c'est un nouveau jour, réinitialiser TOUT
      if (parsed.date !== today) {
        const freshProgress = createFreshProgress(today);
        saveDailyChallengeProgress(freshProgress);
        return freshProgress;
      }
      
      // Valider les données - si corrompues, réinitialiser
      if (typeof parsed.gamesPlayedToday !== 'number' || parsed.gamesPlayedToday < 0) {
        const freshProgress = createFreshProgress(today);
        saveDailyChallengeProgress(freshProgress);
        return freshProgress;
      }
      
      return parsed;
    } catch (e) {
      const freshProgress = createFreshProgress(today);
      saveDailyChallengeProgress(freshProgress);
      return freshProgress;
    }
  }
  
  const freshProgress = createFreshProgress(today);
  saveDailyChallengeProgress(freshProgress);
  return freshProgress;
}

export function saveDailyChallengeProgress(progress: DailyChallengeProgress): void {
  localStorage.setItem(DAILY_CHALLENGES_KEY, JSON.stringify(progress));
}

// FONCTION PRINCIPALE - appelée après chaque partie
export function updateDailyChallengeProgress(
  mode: string,
  score: number,
  gameDuration: number
): void {
  // Ne compter que les parties de plus de 5 secondes
  if (gameDuration < 5) {
    console.log('[DailyChallenges] Game too short, ignoring:', gameDuration);
    return;
  }
  
  // Vérifier que le score est valide
  if (typeof score !== 'number' || isNaN(score) || score < 0) {
    console.log('[DailyChallenges] Invalid score, ignoring:', score);
    return;
  }
  
  // Récupérer la progression actuelle
  const progress = getDailyChallengeProgress();
  const challenges = getTodaysChallenges();
  
  console.log('[DailyChallenges] Before update:', {
    gamesPlayedToday: progress.gamesPlayedToday,
    totalScoreToday: progress.totalScoreToday,
    mode,
    score
  });
  
  // 1. Incrémenter le nombre de parties jouées (+1 à chaque partie)
  progress.gamesPlayedToday += 1;
  
  // 2. Ajouter le score au total
  progress.totalScoreToday += score;
  
  // 3. Ajouter le mode s'il n'est pas déjà présent
  if (!progress.modesPlayedToday.includes(mode)) {
    progress.modesPlayedToday.push(mode);
  }
  
  // 4. Incrémenter le compteur pour ce mode
  if (!progress.gamesPerModeToday[mode]) {
    progress.gamesPerModeToday[mode] = 0;
  }
  progress.gamesPerModeToday[mode] += 1;
  
  // 5. Mettre à jour le meilleur score pour ce mode
  if (!progress.bestScorePerModeToday[mode] || score > progress.bestScorePerModeToday[mode]) {
    progress.bestScorePerModeToday[mode] = score;
  }
  
  // 6. Mettre à jour le meilleur score tous modes confondus
  if (score > progress.bestScoreAnyModeToday) {
    progress.bestScoreAnyModeToday = score;
  }
  
  console.log('[DailyChallenges] After stats update:', {
    gamesPlayedToday: progress.gamesPlayedToday,
    totalScoreToday: progress.totalScoreToday,
    modesPlayedToday: progress.modesPlayedToday,
    gamesPerModeToday: progress.gamesPerModeToday
  });
  
  // 7. Évaluer chaque défi du jour
  challenges.forEach(challenge => {
    // S'assurer que le défi existe dans la progression
    if (!progress.challenges[challenge.id]) {
      progress.challenges[challenge.id] = { progress: 0, completed: false, claimed: false };
    }
    
    const challengeProgress = progress.challenges[challenge.id];
    
    // Ne pas mettre à jour si déjà complété
    if (challengeProgress.completed) {
      return;
    }
    
    let newProgress = 0;
    
    switch (challenge.type) {
      case 'play_games':
        // Nombre total de parties jouées aujourd'hui
        newProgress = progress.gamesPlayedToday;
        break;
        
      case 'score_in_mode':
        // Meilleur score dans un mode spécifique
        if (challenge.mode && progress.bestScorePerModeToday[challenge.mode]) {
          newProgress = progress.bestScorePerModeToday[challenge.mode];
        }
        break;
        
      case 'total_score':
        // Score total cumulé aujourd'hui
        newProgress = progress.totalScoreToday;
        break;
        
      case 'play_mode':
        // Nombre de parties dans un mode spécifique
        if (challenge.mode && progress.gamesPerModeToday[challenge.mode]) {
          newProgress = progress.gamesPerModeToday[challenge.mode];
        }
        break;
        
      case 'best_score_any':
        // Meilleur score en une seule partie tous modes
        newProgress = progress.bestScoreAnyModeToday;
        break;
        
      case 'play_different_modes':
        // Nombre de modes différents joués
        newProgress = progress.modesPlayedToday.length;
        break;
    }
    
    // Mettre à jour la progression
    challengeProgress.progress = newProgress;
    
    // Vérifier si le défi est complété
    if (newProgress >= challenge.target) {
      challengeProgress.completed = true;
      console.log('[DailyChallenges] Challenge completed:', challenge.id, newProgress, '/', challenge.target);
    }
  });
  
  // 8. Sauvegarder
  saveDailyChallengeProgress(progress);
  
  console.log('[DailyChallenges] Final progress saved');
}

// Réinitialiser les défis quotidiens (pour debug)
export function resetDailyChallenges(): void {
  const today = getTodayDate();
  const freshProgress = createFreshProgress(today);
  saveDailyChallengeProgress(freshProgress);
  console.log('[DailyChallenges] Challenges reset');
}

export function claimDailyChallenge(challengeId: string): number {
  const progress = getDailyChallengeProgress();
  const challenges = getTodaysChallenges();
  const challenge = challenges.find(c => c.id === challengeId);
  
  if (!challenge) return 0;
  
  const challengeProgress = progress.challenges[challengeId];
  if (!challengeProgress || !challengeProgress.completed || challengeProgress.claimed) {
    return 0;
  }
  
  challengeProgress.claimed = true;
  saveDailyChallengeProgress(progress);
  
  return challenge.reward.coins;
}

export function hasPendingDailyChallengeRewards(): boolean {
  const progress = getDailyChallengeProgress();
  
  return Object.values(progress.challenges).some(
    c => c.completed && !c.claimed
  );
}
