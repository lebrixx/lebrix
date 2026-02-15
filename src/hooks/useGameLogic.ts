import { useState, useCallback, useEffect, useRef } from 'react';
import * as React from 'react';
import { ModeType, ModeID, cfgModes, cfgBase, inArc } from '@/constants/modes';
import { startGameSession } from '@/utils/scoresApi';
import { BoostType } from '@/types/boosts';
import { consumeTicket } from '@/utils/ticketSystem';
import { getCoinMultiplier } from '@/utils/dailyBonusMode';

interface CustomizationItem {
  id: string;
  name: string;
  type: 'background' | 'circle' | 'effect';
  preview: string;
  color?: string;
}

interface Customization {
  background: string;
  circle: string;
  effect: string;
}

export interface GameState {
  gameStatus: 'idle' | 'running' | 'gameover';
  currentScore: number;
  bestScore: number;
  coins: number;
  ownedThemes: string[];
  ownedItems: CustomizationItem[];
  currentCustomization: Customization;
  ballAngle: number; // Position angulaire de la bille (radians)
  ballSpeed: number; // Vitesse angulaire (radians/seconde)
  ballDirection: number; // Direction: 1 ou -1
  zoneStart: number; // Angle de début de la zone verte (radians)
  zoneEnd: number; // Angle de fin de la zone verte (radians)
  zoneArc: number; // Taille de l'arc vert (radians)
  showResult: boolean;
  lastResult: 'success' | 'failure' | null;
  level: number;
  setCustomization: (customization: Customization) => void;
  // Effets visuels
  successFlash: boolean;
  successParticles: boolean;
  comboCount: number; // Pour le pitch audio progressif
  // Statistiques pour les défis
  maxSpeedReached: number;
  directionChanges: number;
  totalGamesPlayed: number;
  gameStartTime: number; // Timestamp du début de partie pour validation durée minimale
  // Mode-specific
  currentMode: ModeType;
  timeLeft?: number; // Pour mode survie
  zoneDrift?: number; // Pour zone mobile
  zoneDriftSpeed?: number;
  // Pour mode zone traîtresse
  multipleZones?: Array<{ start: number; end: number; arc: number }>;
  trapZoneIndex?: number; // Index de la zone piégée
  // Pour mode mémoire expert - une seule zone à la fois
  memoryZoneVisible?: boolean; // La zone est-elle visible?
  // Boosts actifs
  activeBoosts: BoostType[];
  hasShield: boolean;
}

// Configuration du jeu
const cfg = {
  radius: 110,                // rayon de rotation de la bille
  ballSize: 10,               // diamètre visuel de la bille (px)
  baseSpeed: 1.8,            // radians/seconde au départ
  speedGain: 1.03,           // +3% à chaque réussite (comme demandé)
  debounceMs: 40,            // anti double-tap
  directionReverseChance: 0.2, // 20% de chance d'inverser la direction
  speedVariation: 0.05       // ±5% de variation de vitesse aléatoire
};

// Items par défaut disponibles
const defaultItems: CustomizationItem[] = [
  // Palettes de couleurs
  { id: 'palette-neon', name: 'Néon', type: 'background', preview: 'linear-gradient(135deg, #00ffff, #ff00ff)', color: '#00ffff' },
  { id: 'palette-sunset', name: 'Coucher de soleil', type: 'background', preview: 'linear-gradient(135deg, #ff6b35, #f7931e)', color: '#ff6b35' },
  { id: 'palette-ocean', name: 'Océan', type: 'background', preview: 'linear-gradient(135deg, #0077be, #00a8cc)', color: '#0077be' },
  { id: 'palette-forest', name: 'Forêt', type: 'background', preview: 'linear-gradient(135deg, #2d5a27, #76c893)', color: '#2d5a27' },
  { id: 'palette-lava', name: 'Lave', type: 'background', preview: 'linear-gradient(135deg, #ff4444, #cc2936)', color: '#ff4444' },
  { id: 'palette-arctic', name: 'Arctique', type: 'background', preview: 'linear-gradient(135deg, #a8dadc, #f1faee)', color: '#a8dadc' },
  
  // Cercles
  { id: 'circle-default', name: 'Défaut', type: 'circle', preview: '', color: '#4ee1a0' },
  
  // Effets
  { id: 'effect-default', name: 'Défaut', type: 'effect', preview: '', color: '#4ee1a0' },
];

export const useGameLogic = (currentMode: ModeType = ModeID.CLASSIC) => {
  const [selectedBoosts, setSelectedBoosts] = useState<BoostType[]>([]);
  
  // Refs pour les timeouts à nettoyer
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  
  // Fonction helper pour ajouter un timeout qui sera auto-nettoyé
  const addTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      callback();
      // Retirer ce timeout de la liste après son exécution
      timeoutsRef.current = timeoutsRef.current.filter(id => id !== timeoutId);
    }, delay);
    timeoutsRef.current.push(timeoutId);
    return timeoutId;
  }, []);
  
  // Nettoyer tous les timeouts au démontage
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(id => clearTimeout(id));
      timeoutsRef.current = [];
    };
  }, []);
  
  // Réinitialiser le jeu quand le mode change
  const [gameState, setGameState] = useState<GameState>(() => {
    return createInitialState(currentMode);
  });

  // Effet pour réinitialiser le jeu quand le mode change
  useEffect(() => {
    setGameState(createInitialState(currentMode));
  }, [currentMode]);

  // Fonction pour créer l'état initial basé sur le mode
  function createInitialState(mode: ModeType): GameState {
    const saved = localStorage.getItem('luckyStopGame');
    const modeConfig = cfgModes[mode];
    const zoneStart = Math.random() * 2 * Math.PI;
    const zoneArc = modeConfig.variableArc 
      ? Math.random() * (modeConfig.arcMax! - modeConfig.arcMin!) + modeConfig.arcMin!
      : modeConfig.zoneArc || cfgBase.zoneArc;
    
    // Créer plusieurs zones pour le mode zone traîtresse (positions fixes)
    let multipleZones: Array<{ start: number; end: number; arc: number }> | undefined;
    let trapZoneIndex: number | undefined;
    if (modeConfig.multipleZones && modeConfig.numberOfZones) {
      multipleZones = [];
      const fixedArc = modeConfig.zoneArc || cfgBase.zoneArc; // Arc fixe pour toutes les zones
      const angleStep = (2 * Math.PI) / modeConfig.numberOfZones; // Espacement uniforme
      
      for (let i = 0; i < modeConfig.numberOfZones; i++) {
        const start = i * angleStep; // Position fixe basée sur l'index
        multipleZones.push({ 
          start, 
          end: start + fixedArc, 
          arc: fixedArc // Même arc pour toutes les zones
        });
      }
      trapZoneIndex = Math.floor(Math.random() * modeConfig.numberOfZones);
    }
    
    const defaultState: GameState = {
      gameStatus: 'idle',
      currentScore: 0,
      bestScore: 0,
      coins: 100, // Starting coins
      ownedThemes: ['theme-neon'], // Thème de base toujours débloqué
      ownedItems: [...defaultItems],
      currentCustomization: {
        background: 'palette-neon',
        circle: 'circle-default',
        effect: 'effect-default',
      },
      ballAngle: 0,
      ballSpeed: cfg.baseSpeed,
      ballDirection: 1,
      zoneStart: zoneStart,
      zoneEnd: zoneStart + zoneArc,
      zoneArc: zoneArc,
      showResult: false,
      lastResult: null,
      level: 1,
      setCustomization: () => {},
      successFlash: false,
      successParticles: false,
      comboCount: 0,
      maxSpeedReached: cfg.baseSpeed,
      directionChanges: 0,
      totalGamesPlayed: 0,
      gameStartTime: 0,
      currentMode: mode,
      timeLeft: modeConfig.survival ? modeConfig.survivalTime : undefined,
      zoneDrift: modeConfig.keepMovingZone ? 0 : undefined,
      zoneDriftSpeed: modeConfig.keepMovingZone ? -modeConfig.zoneDriftSpeed : undefined, // Négatif pour aller dans le sens opposé de la balle
      multipleZones,
      trapZoneIndex,
      activeBoosts: [],
      hasShield: false,
    };
    
    if (saved) {
      try {
        const parsedState = JSON.parse(saved);
        console.log('Loading saved state for mode:', mode, parsedState);
        return {
          ...defaultState,
          bestScore: parsedState[`bestScore_${mode}`] || 0,
          coins: parsedState.coins || 100,
          ownedThemes: parsedState.ownedThemes && parsedState.ownedThemes.length > 0 
            ? [...new Set([...parsedState.ownedThemes, 'theme-neon'])] // Toujours inclure theme-neon
            : ['theme-neon'],
          ownedItems: parsedState.ownedItems || [...defaultItems],
          currentCustomization: parsedState.currentCustomization || {
            background: 'palette-neon',
            circle: 'circle-default',
            effect: 'effect-default',
          },
          maxSpeedReached: parsedState.maxSpeedReached || cfg.baseSpeed,
          directionChanges: parsedState.directionChanges || 0,
          totalGamesPlayed: parsedState.totalGamesPlayed || 0,
        };
      } catch (e) {
        console.error('Error loading saved state:', e);
        return defaultState;
      }
    }
    return defaultState;
  }

  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>();
  const lastTapTime = useRef<number>(0);

  // Fonction pour modifier la personnalisation
  const setCustomization = useCallback((customization: Customization) => {
    setGameState(prev => ({ ...prev, currentCustomization: customization }));
  }, []);

  // Mise à jour du gameState avec setCustomization
  React.useEffect(() => {
    setGameState(prev => ({ ...prev, setCustomization }));
  }, [setCustomization]);

  // Sauvegarde du progress
  const saveProgress = useCallback(() => {
    try {
      // Récupérer les données existantes pour préserver les scores des autres modes
      const existingData = localStorage.getItem('luckyStopGame');
      let savedData = {};
      if (existingData) {
        try {
          savedData = JSON.parse(existingData);
        } catch (e) {
          console.warn('Error parsing existing save data:', e);
        }
      }

      // Protéger le bestScore : ne jamais écrire un score inférieur à celui déjà stocké
      const existingBestScore = savedData[`bestScore_${gameState.currentMode}`] || 0;
      const safeBestScore = Math.max(gameState.bestScore, existingBestScore);

      const dataToSave = {
        ...savedData, // Préserver les données existantes
        [`bestScore_${gameState.currentMode}`]: safeBestScore,
        coins: gameState.coins,
        ownedThemes: gameState.ownedThemes,
        ownedItems: gameState.ownedItems,
        currentCustomization: gameState.currentCustomization,
        maxSpeedReached: gameState.maxSpeedReached,
        directionChanges: gameState.directionChanges,
        totalGamesPlayed: gameState.totalGamesPlayed,
        timestamp: Date.now(),
      };
      
      localStorage.setItem('luckyStopGame', JSON.stringify(dataToSave));
      console.log('Game progress saved successfully:', dataToSave);
    } catch (error) {
      console.error('Failed to save game progress:', error);
    }
  }, [gameState.bestScore, gameState.coins, gameState.ownedThemes, gameState.ownedItems, gameState.currentCustomization, gameState.currentMode, gameState.maxSpeedReached, gameState.directionChanges, gameState.totalGamesPlayed]);

  // Sauvegarder automatiquement quand les coins ou le bestScore changent
  useEffect(() => {
    saveProgress();
  }, [gameState.coins, gameState.bestScore, saveProgress]);

  // Animation de la bille (60 FPS) + Zone mobile
  const animateBall = useCallback(() => {
    if (gameState.gameStatus !== 'running') {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      return;
    }

    const animate = (currentTime: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = currentTime;
      }

      const deltaTime = (currentTime - lastTimeRef.current) / 1000; // en secondes
      lastTimeRef.current = currentTime;

      setGameState(prev => {
        if (prev.gameStatus !== 'running') return prev;
        
        let newAngle = prev.ballAngle + prev.ballSpeed * prev.ballDirection * deltaTime;
        // Normaliser l'angle entre 0 et 2π (gérer les angles négatifs)
        newAngle = ((newAngle % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
        
        let newZoneStart = prev.zoneStart;
        let newTimeLeft = prev.timeLeft;
        
        // Mode Zone Mobile : faire glisser la zone verte
        const modeConfig = cfgModes[prev.currentMode];
        if (modeConfig.keepMovingZone && prev.zoneDriftSpeed) {
          newZoneStart = prev.zoneStart + (prev.zoneDriftSpeed * deltaTime);
          newZoneStart = ((newZoneStart % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
        }
        
        // Mode Survie : décrémenter le timer
        if (modeConfig.survival && prev.timeLeft !== undefined) {
          newTimeLeft = Math.max(0, prev.timeLeft - deltaTime);
          
          // Fin du temps en mode survie
          if (newTimeLeft <= 0 && prev.timeLeft > 0) {
            // Vérifier si la partie a duré au moins 5 secondes
            const gameDuration = (Date.now() - prev.gameStartTime) / 1000;
            const shouldCount = gameDuration >= 5;
            
            return {
              ...prev,
              gameStatus: 'gameover',
              timeLeft: 0,
              showResult: true,
              lastResult: 'failure',
              totalGamesPlayed: shouldCount ? prev.totalGamesPlayed + 1 : prev.totalGamesPlayed,
            };
          }
        }
        
        return {
          ...prev,
          ballAngle: newAngle,
          zoneStart: newZoneStart,
          zoneEnd: newZoneStart + prev.zoneArc,
          timeLeft: newTimeLeft,
        };
      });

      if (gameState.gameStatus === 'running') {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [gameState.gameStatus, gameState.currentMode]);

  useEffect(() => {
    if (gameState.gameStatus === 'running') {
      lastTimeRef.current = undefined;
      animateBall();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [gameState.gameStatus, animateBall]);

  // Démarrer le jeu avec boosts sélectionnés
  const startGame = useCallback((boosts: BoostType[] = []) => {
    // Éviter les appels multiples si déjà en cours
    if (gameState.gameStatus === 'running') {
      console.log('[startGame] Already running, ignoring');
      return;
    }
    
    // Mode Expert : vérifier et consommer un ticket
    if (currentMode === ModeID.MEMOIRE_EXPERT) {
      const hasTicket = consumeTicket();
      if (!hasTicket) {
        // Pas de ticket disponible, ne pas démarrer
        console.warn('Pas de ticket disponible pour le mode expert');
        return;
      }
    }
    
    // Annuler toute animation en cours avant de démarrer une nouvelle
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
    lastTimeRef.current = undefined;
    
    // Mark the start of game session for security tracking
    startGameSession();
    
    setSelectedBoosts(boosts);
    
    const modeConfig = cfgModes[currentMode];
    const zoneStart = Math.random() * 2 * Math.PI;
    const zoneArc = modeConfig.variableArc 
      ? Math.random() * (modeConfig.arcMax! - modeConfig.arcMin!) + modeConfig.arcMin!
      : modeConfig.zoneArc || cfgBase.zoneArc;
    
    // Créer plusieurs zones pour le mode zone traîtresse (positions fixes)
    let multipleZones: Array<{ start: number; end: number; arc: number }> | undefined;
    let trapZoneIndex: number | undefined;
    if (modeConfig.multipleZones && modeConfig.numberOfZones) {
      multipleZones = [];
      const fixedArc = modeConfig.zoneArc || cfgBase.zoneArc; // Arc fixe pour toutes les zones
      const angleStep = (2 * Math.PI) / modeConfig.numberOfZones; // Espacement uniforme
      
      for (let i = 0; i < modeConfig.numberOfZones; i++) {
        const start = i * angleStep; // Position fixe basée sur l'index
        multipleZones.push({ 
          start, 
          end: start + fixedArc, 
          arc: fixedArc // Même arc pour toutes les zones
        });
      }
      trapZoneIndex = Math.floor(Math.random() * modeConfig.numberOfZones);
    }
    
    // Mode Mémoire Expert - une seule zone à la fois
    let memoryZoneVisible = false;
    
    if (currentMode === ModeID.MEMOIRE_EXPERT) {
      memoryZoneVisible = true;
      
      // Timer pour cacher la zone après 1 seconde
      addTimeout(() => {
        setGameState(prev => ({
          ...prev,
          memoryZoneVisible: false,
        }));
      }, 1000);
    }
    
    // Vitesse de base modifiée pour le mode survie (+17%)
    const baseSpeed = modeConfig.survival ? cfg.baseSpeed * 1.17 : cfg.baseSpeed;
    
    // Appliquer boost "bigger_zone" si sélectionné
    let effectiveZoneArc = zoneArc;
    if (boosts.includes('bigger_zone')) {
      effectiveZoneArc = zoneArc * 1.5; // 50% plus grand
    }
    
    // Score de départ avec boost "start_20"
    const startScore = boosts.includes('start_20') ? 20 : 0;
      
    setGameState(prev => ({
      ...prev,
      gameStatus: 'running',
      currentScore: startScore,
      ballAngle: 0,
      ballSpeed: baseSpeed,
      ballDirection: 1,
      zoneStart: zoneStart,
      zoneEnd: zoneStart + effectiveZoneArc,
      zoneArc: effectiveZoneArc,
      showResult: false,
      lastResult: null,
      level: 1,
      successFlash: false,
      successParticles: false,
      comboCount: 0,
      maxSpeedReached: baseSpeed,
      directionChanges: 0,
      gameStartTime: Date.now(), // Enregistrer le temps de début
      timeLeft: modeConfig.survival ? modeConfig.survivalTime : undefined,
      zoneDrift: modeConfig.keepMovingZone ? 0 : undefined,
      zoneDriftSpeed: modeConfig.keepMovingZone ? -modeConfig.zoneDriftSpeed : undefined, // Négatif pour aller dans le sens opposé de la balle
      multipleZones,
      trapZoneIndex,
      memoryZoneVisible,
      activeBoosts: boosts,
      hasShield: boosts.includes('shield'),
    }));
  }, [currentMode]);

  // Tap/Click du joueur
  const onTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapTime.current < cfg.debounceMs) return; // Anti double-tap
    lastTapTime.current = now;

    if (gameState.gameStatus === 'idle') {
      startGame();
      return;
    }

    if (gameState.gameStatus === 'gameover') {
      startGame();
      return;
    }

    if (gameState.gameStatus !== 'running') return;

    // Mode Mémoire Expert : clic sur la zone visible
    if (gameState.currentMode === ModeID.MEMOIRE_EXPERT) {
      // Vérifier si le clic est dans la zone
      const isInZone = inArc(gameState.ballAngle, gameState.zoneStart, gameState.zoneEnd);
      
      if (isInZone) {
        // Succès ! +1 point
        const newScore = gameState.currentScore + 1;
        
        // Générer une nouvelle position pour la zone
        const newZoneStart = Math.random() * 2 * Math.PI;
        
        setGameState(prev => ({
          ...prev,
          currentScore: newScore,
          bestScore: Math.max(prev.bestScore, newScore),
          coins: prev.coins + (newScore % 2 === 0 ? 1 * getCoinMultiplier(prev.currentMode) : 0), // +1 coin (x2 si bonus) toutes les 2 zones réussies
          zoneStart: newZoneStart,
          zoneEnd: newZoneStart + prev.zoneArc,
          memoryZoneVisible: true,
          successFlash: true,
          successParticles: true,
          comboCount: prev.comboCount + 1,
        }));
        
        // Masquer les effets
        addTimeout(() => {
          setGameState(prev => ({ ...prev, successFlash: false, successParticles: false }));
        }, 300);
        
        // Cacher la zone après 1 seconde
        addTimeout(() => {
          setGameState(prev => ({
            ...prev,
            memoryZoneVisible: false,
          }));
        }, 1000);
        
        return;
      } else {
        // Échec - clic en dehors de la zone, afficher la zone pendant 2 secondes
        // Vérifier si la partie a duré au moins 5 secondes
        const gameDuration = (Date.now() - gameState.gameStartTime) / 1000;
        const shouldCount = gameDuration >= 5;
        
        setGameState(prev => ({
          ...prev,
          gameStatus: 'gameover',
          bestScore: Math.max(prev.currentScore, prev.bestScore),
          coins: prev.coins + Math.floor(prev.currentScore / 10) * getCoinMultiplier(prev.currentMode),
          showResult: true,
          lastResult: 'failure',
          memoryZoneVisible: true, // Montrer où était la zone
          totalGamesPlayed: shouldCount ? prev.totalGamesPlayed + 1 : prev.totalGamesPlayed,
        }));
        
        // Cacher la zone après 2 secondes
        addTimeout(() => {
          setGameState(prev => ({ ...prev, memoryZoneVisible: false }));
        }, 2000);
        
        return;
      }
    }

    // Vérifier si la bille est dans la zone verte
    const modeConfig = cfgModes[gameState.currentMode];
    
    let success = false;
    let hitTrapZone = false;
    
    // Mode zone traîtresse : vérifier toutes les zones
    if (modeConfig.multipleZones && gameState.multipleZones && gameState.trapZoneIndex !== undefined) {
      for (let i = 0; i < gameState.multipleZones.length; i++) {
        const zone = gameState.multipleZones[i];
        if (inArc(gameState.ballAngle, zone.start, zone.end)) {
          if (i === gameState.trapZoneIndex) {
            hitTrapZone = true;
          } else {
            success = true;
          }
          break;
        }
      }
    }
    // Mode normal : vérifier la zone standard (ou la deuxième zone en mode survie)
    else {
      success = inArc(gameState.ballAngle, gameState.zoneStart, gameState.zoneEnd) ||
        (modeConfig.survival && inArc(gameState.ballAngle, (gameState.zoneStart + Math.PI) % (2 * Math.PI), (gameState.zoneEnd + Math.PI) % (2 * Math.PI)));
    }
    
    // Si le joueur a touché la zone piégée, c'est game over
    if (hitTrapZone) {
      // Vérifier si la partie a duré au moins 5 secondes
      const gameDuration = (Date.now() - gameState.gameStartTime) / 1000;
      const shouldCount = gameDuration >= 5;
      
      setGameState(prev => ({
        ...prev,
        gameStatus: 'gameover',
        bestScore: Math.max(prev.currentScore, prev.bestScore),
        coins: prev.coins + Math.floor(prev.currentScore / 20) * getCoinMultiplier(prev.currentMode),
        showResult: false, // Ne pas afficher le message
        lastResult: 'failure',
        totalGamesPlayed: shouldCount ? prev.totalGamesPlayed + 1 : prev.totalGamesPlayed,
      }));
      return;
    }

    if (success) {
      // SUCCÈS - Continue immédiatement sans pause
      const newScore = gameState.currentScore + 1;
      const baseSpeed = gameState.ballSpeed * cfg.speedGain; // +3%
      
      // Variation aléatoire de vitesse (±5%)
      const speedVariation = (Math.random() - 0.5) * 2 * cfg.speedVariation;
      const newSpeed = baseSpeed * (1 + speedVariation);
      
      const modeConfig = cfgModes[gameState.currentMode];
      
      // Chance aléatoire d'inverser la direction (20%) - SAUF en mode zone mobile
      const shouldReverse = modeConfig.keepMovingZone ? false : Math.random() < cfg.directionReverseChance;
      const newDirection = shouldReverse ? gameState.ballDirection * -1 : gameState.ballDirection;
      
      let newZoneStart = gameState.zoneStart;
      let newZoneArc = gameState.zoneArc;
      let newZoneDriftSpeed = gameState.zoneDriftSpeed;
      let newMultipleZones = gameState.multipleZones;
      let newTrapZoneIndex = gameState.trapZoneIndex;

      // Mode Arc Changeant : changer la taille et position de l'arc
      if (modeConfig.variableArc) {
        newZoneArc = Math.random() * (modeConfig.arcMax! - modeConfig.arcMin!) + modeConfig.arcMin!;
        newZoneStart = Math.random() * 2 * Math.PI;
      }
      // Mode Zone Traîtresse : changer seulement la zone piégée (garder les positions fixes)
      else if (modeConfig.multipleZones && modeConfig.numberOfZones) {
        // Les zones restent fixes, on change juste quelle zone est piégée
        newTrapZoneIndex = Math.floor(Math.random() * modeConfig.numberOfZones);
      }
      // Mode Zone Mobile : accélérer le drift mais GARDER le sens opposé constant
      else if (modeConfig.keepMovingZone && newZoneDriftSpeed) {
        newZoneDriftSpeed = newZoneDriftSpeed * (modeConfig.zoneDriftGain || 1.05);
        // Garder le même sens (pas d'inversion) pour maintenir l'opposition avec la balle
      }
      // Mode classique/survie : repositionner l'arc normalement
      else if (!modeConfig.keepMovingZone) {
        newZoneStart = Math.random() * 2 * Math.PI;
      }

      setGameState(prev => ({
        ...prev,
        currentScore: newScore,
        bestScore: Math.max(prev.bestScore, newScore),
        ballSpeed: newSpeed,
        ballDirection: newDirection,
        zoneStart: newZoneStart,
        zoneEnd: newZoneStart + newZoneArc,
        zoneArc: newZoneArc,
        zoneDriftSpeed: newZoneDriftSpeed,
        coins: prev.coins + (newScore % 2 === 0 ? 1 * getCoinMultiplier(prev.currentMode) : 0), // +1 coin (x2 si bonus) toutes les 2 zones vertes réussies
        level: prev.level + 1,
        lastResult: 'success',
        showResult: false,
        successFlash: true,
        successParticles: true,
        comboCount: newScore,
        maxSpeedReached: Math.max(prev.maxSpeedReached, newSpeed),
        directionChanges: shouldReverse ? prev.directionChanges + 1 : prev.directionChanges,
        multipleZones: newMultipleZones,
        trapZoneIndex: newTrapZoneIndex,
      }));

      // Effacer les effets visuels après un court délai
      addTimeout(() => {
        setGameState(prev => ({
          ...prev,
          successFlash: false,
          successParticles: false,
        }));
      }, 50);

    } else {
      // ÉCHEC - Vérifier d'abord si le bouclier est actif
      if (gameState.hasShield) {
        // Consommer le bouclier et continuer
        setGameState(prev => ({
          ...prev,
          hasShield: false,
          activeBoosts: prev.activeBoosts.filter(b => b !== 'shield'),
          showResult: true,
          lastResult: 'success', // Afficher comme succès car sauvé
        }));
        
        // Masquer immédiatement
        addTimeout(() => {
          setGameState(prev => ({ ...prev, showResult: false }));
        }, 100);
        return;
      }
      
      // ÉCHEC - Fin de partie pour tous les modes
      // Vérifier si la partie a duré au moins 5 secondes
      const gameDuration = (Date.now() - gameState.gameStartTime) / 1000;
      const shouldCount = gameDuration >= 5;
      
      setGameState(prev => ({
        ...prev,
        gameStatus: 'gameover',
        bestScore: Math.max(prev.currentScore, prev.bestScore),
        coins: prev.coins + Math.floor(prev.currentScore / 20) * getCoinMultiplier(prev.currentMode),
        showResult: false, // Ne pas afficher le message
        lastResult: 'failure',
        totalGamesPlayed: shouldCount ? prev.totalGamesPlayed + 1 : prev.totalGamesPlayed,
      }));
    }
  }, [gameState.gameStatus, gameState.ballAngle, gameState.zoneStart, gameState.zoneEnd, gameState.currentScore, gameState.ballSpeed, startGame, currentMode, addTimeout]);

  // Réinitialiser le jeu
  const resetGame = useCallback(() => {
    const modeConfig = cfgModes[currentMode];
    const zoneStart = Math.random() * 2 * Math.PI;
    const zoneArc = modeConfig.variableArc 
      ? Math.random() * (modeConfig.arcMax! - modeConfig.arcMin!) + modeConfig.arcMin!
      : modeConfig.zoneArc || cfgBase.zoneArc;
    
    // Créer plusieurs zones pour le mode zone traîtresse
    let multipleZones: Array<{ start: number; end: number; arc: number }> | undefined;
    let trapZoneIndex: number | undefined;
    if (modeConfig.multipleZones && modeConfig.numberOfZones) {
      multipleZones = [];
      const angleStep = (2 * Math.PI) / modeConfig.numberOfZones;
      for (let i = 0; i < modeConfig.numberOfZones; i++) {
        const start = i * angleStep + Math.random() * 0.2;
        const arc = modeConfig.zoneArc || cfgBase.zoneArc;
        multipleZones.push({ start, end: start + arc, arc });
      }
      trapZoneIndex = Math.floor(Math.random() * modeConfig.numberOfZones);
    }
    
    // Vitesse de base modifiée pour le mode survie (+17%)
    const baseSpeed = modeConfig.survival ? cfg.baseSpeed * 1.17 : cfg.baseSpeed;
      
    setGameState(prev => ({
      ...prev,
      gameStatus: 'idle',
      currentScore: 0,
      ballAngle: 0,
      ballSpeed: baseSpeed,
      ballDirection: 1,
      zoneStart: zoneStart,
      zoneEnd: zoneStart + zoneArc,
      zoneArc: zoneArc,
      showResult: false,
      lastResult: null,
      level: 1,
      successFlash: false,
      successParticles: false,
      comboCount: 0,
      maxSpeedReached: baseSpeed,
      directionChanges: 0,
      timeLeft: modeConfig.survival ? modeConfig.survivalTime : undefined,
      zoneDrift: modeConfig.keepMovingZone ? 0 : undefined,
      zoneDriftSpeed: modeConfig.keepMovingZone ? -modeConfig.zoneDriftSpeed : undefined, // Négatif pour aller dans le sens opposé de la balle
      multipleZones,
      trapZoneIndex,
    }));
  }, [currentMode]);

  // Dépenser des coins
  const spendCoins = useCallback((amount: number): boolean => {
    let success = false;
    setGameState(prev => {
      if (prev.coins >= amount) {
        success = true;
        return { ...prev, coins: prev.coins - amount };
      }
      return prev;
    });
    return success;
  }, []);

  // Ajouter des coins (récompenses, défis)
  const addCoins = useCallback((amount: number) => {
    if (amount <= 0) return;
    console.log('[useGameLogic] addCoins called:', { amount });
    setGameState(prev => {
      const next = { ...prev, coins: prev.coins + amount };
      console.log('[useGameLogic] coins updated:', { before: prev.coins, after: next.coins });
      return next;
    });
  }, []);

  // Sauvegarde automatique
  useEffect(() => {
    saveProgress();
  }, [saveProgress]);

  // Acheter un thème (prix variable)
  const purchaseTheme = useCallback((themeId: string, price: number): boolean => {
    let success = false;
    setGameState(prev => {
      if (prev.ownedThemes.includes(themeId)) {
        return prev; // Déjà possédé
      }
      if (prev.coins >= price) {
        success = true;
        return {
          ...prev,
          coins: prev.coins - price,
          ownedThemes: [...prev.ownedThemes, themeId],
        };
      }
      return prev; // Pas assez de coins
    });
    return success;
  }, []);

  // Acheter un item de personnalisation
  const purchaseItem = useCallback((item: CustomizationItem): boolean => {
    let success = false;
    const itemPrice = 30;
    setGameState(prev => {
      if (prev.ownedItems.find(owned => owned.id === item.id)) {
        return prev; // Déjà possédé
      }
      if (prev.coins >= itemPrice) {
        success = true;
        return {
          ...prev,
          coins: prev.coins - itemPrice,
          ownedItems: [...prev.ownedItems, item]
        };
      }
      return prev;
    });
    return success;
  }, []);

  const reviveGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      gameStatus: 'running',
      showResult: false,
      lastResult: null,
    }));
  }, []);

  return {
    gameState,
    startGame,
    onTap,
    resetGame,
    reviveGame,
    spendCoins,
    addCoins,
    purchaseTheme,
    purchaseItem,
    cfg, // Export config pour l'affichage
  };
};