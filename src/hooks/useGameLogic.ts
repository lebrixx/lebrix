import { useState, useCallback, useEffect, useRef } from 'react';
import * as React from 'react';
import { ModeType, ModeID, cfgModes, cfgBase, inArc } from '@/constants/modes';
import { startGameSession } from '@/utils/scoresApi';
import { BoostType } from '@/types/boosts';

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
  // Mode-specific
  currentMode: ModeType;
  timeLeft?: number; // Pour mode survie
  zoneDrift?: number; // Pour zone mobile
  zoneDriftSpeed?: number;
  // Pour mode zone traîtresse
  multipleZones?: Array<{ start: number; end: number; arc: number }>;
  trapZoneIndex?: number; // Index de la zone piégée
  // Pour mode mémoire expert
  memoryZones?: Array<{ start: number; end: number; arc: number }>;
  memoryPhase?: 'showing' | 'memorizing' | 'completed';
  memoryClickOrder?: number[];
  memoryExpectedOrder?: number[];
  memoryLevel?: number; // Nombre de zones à mémoriser
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
      ownedThemes: [],
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
          ownedThemes: parsedState.ownedThemes || [],
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

      const dataToSave = {
        ...savedData, // Préserver les données existantes
        [`bestScore_${gameState.currentMode}`]: gameState.bestScore,
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

  // Animation de la bille (60 FPS) + Zone mobile - Skip en mode mémoire
  const animateBall = useCallback(() => {
    if (gameState.gameStatus !== 'running') return;
    // Pas d'animation en mode mémoire
    if (gameState.currentMode === ModeID.MEMOIRE_EXPERT) return;

    const animate = (currentTime: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = currentTime;
      }

      const deltaTime = (currentTime - lastTimeRef.current) / 1000; // en secondes
      lastTimeRef.current = currentTime;

      setGameState(prev => {
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
            return {
              ...prev,
              gameStatus: 'gameover',
              timeLeft: 0,
              showResult: true,
              lastResult: 'failure',
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
    if (gameState.gameStatus === 'running' && gameState.currentMode !== ModeID.MEMOIRE_EXPERT) {
      lastTimeRef.current = undefined;
      animateBall();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState.gameStatus, animateBall]);

  // Démarrer le jeu avec boosts sélectionnés
  const startGame = useCallback((boosts: BoostType[] = []) => {
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
    
    // Mode Mémoire Expert
    let memoryZones: Array<{ start: number; end: number; arc: number }> | undefined;
    let memoryPhase: 'showing' | 'memorizing' | 'completed' | undefined;
    let memoryClickOrder: number[] | undefined;
    let memoryExpectedOrder: number[] | undefined;
    let memoryLevel: number | undefined;
    
    if (currentMode === ModeID.MEMOIRE_EXPERT) {
      memoryLevel = 2; // Commencer avec 2 zones
      memoryZones = [];
      memoryExpectedOrder = [];
      memoryClickOrder = [];
      memoryPhase = 'showing';
      
      const fixedArc = modeConfig.zoneArc || cfgBase.zoneArc;
      const usedAngles: number[] = [];
      
      // Générer des zones aléatoires non-chevauchantes
      for (let i = 0; i < memoryLevel; i++) {
        let start;
        let attempts = 0;
        do {
          start = Math.random() * 2 * Math.PI;
          // Vérifier qu'il n'y a pas de chevauchement avec les zones existantes
          const tooClose = usedAngles.some(angle => {
            const diff = Math.abs(start - angle);
            return diff < fixedArc * 2 || (2 * Math.PI - diff) < fixedArc * 2;
          });
          if (!tooClose) break;
          attempts++;
        } while (attempts < 50);
        
        usedAngles.push(start);
        memoryZones.push({ 
          start, 
          end: start + fixedArc, 
          arc: fixedArc 
        });
        memoryExpectedOrder.push(i);
      }
      
      // Timer pour cacher les zones après 1 seconde
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          memoryPhase: 'memorizing',
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
      totalGamesPlayed: prev.totalGamesPlayed + 1,
      timeLeft: modeConfig.survival ? modeConfig.survivalTime : undefined,
      zoneDrift: modeConfig.keepMovingZone ? 0 : undefined,
      zoneDriftSpeed: modeConfig.keepMovingZone ? -modeConfig.zoneDriftSpeed : undefined, // Négatif pour aller dans le sens opposé de la balle
      multipleZones,
      trapZoneIndex,
      memoryZones,
      memoryPhase,
      memoryClickOrder,
      memoryExpectedOrder,
      memoryLevel,
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

    // Mode Mémoire Expert : gestion spéciale des clics
    if (gameState.currentMode === ModeID.MEMOIRE_EXPERT && gameState.memoryPhase === 'memorizing') {
      if (!gameState.memoryZones || !gameState.memoryExpectedOrder || !gameState.memoryClickOrder) return;
      
      // Trouver quelle zone a été cliquée
      let clickedZoneIndex = -1;
      for (let i = 0; i < gameState.memoryZones.length; i++) {
        const zone = gameState.memoryZones[i];
        if (inArc(gameState.ballAngle, zone.start, zone.end)) {
          clickedZoneIndex = i;
          break;
        }
      }
      
      // Si aucune zone cliquée
      if (clickedZoneIndex === -1) {
        // Game over - clic en dehors des zones
        setGameState(prev => ({
          ...prev,
          gameStatus: 'gameover',
          bestScore: Math.max(prev.currentScore, prev.bestScore),
          coins: prev.coins + prev.currentScore, // 10 points = 1 coin
          showResult: true,
          lastResult: 'failure',
        }));
        return;
      }
      
      // Vérifier si c'est la bonne zone dans le bon ordre
      const expectedIndex = gameState.memoryExpectedOrder[gameState.memoryClickOrder.length];
      
      if (clickedZoneIndex !== expectedIndex) {
        // Mauvaise zone ou mauvais ordre - Game over
        setGameState(prev => ({
          ...prev,
          gameStatus: 'gameover',
          bestScore: Math.max(prev.currentScore, prev.bestScore),
          coins: prev.coins + prev.currentScore, // 10 points = 1 coin
          showResult: true,
          lastResult: 'failure',
        }));
        return;
      }
      
      // Bonne zone ! Ajouter à l'ordre des clics
      const newClickOrder = [...gameState.memoryClickOrder, clickedZoneIndex];
      
      // Toutes les zones ont été cliquées correctement
      if (newClickOrder.length === gameState.memoryZones.length) {
        const newScore = gameState.currentScore + (gameState.memoryZones.length * 10); // 10 points par zone
        const newMemoryLevel = (gameState.memoryLevel || 2) + 1; // +1 zone au niveau suivant
        
        // Générer le prochain niveau
        const modeConfig = cfgModes[gameState.currentMode];
        const fixedArc = modeConfig.zoneArc || cfgBase.zoneArc;
        const newMemoryZones: Array<{ start: number; end: number; arc: number }> = [];
        const usedAngles: number[] = [];
        
        for (let i = 0; i < newMemoryLevel; i++) {
          let start;
          let attempts = 0;
          do {
            start = Math.random() * 2 * Math.PI;
            const tooClose = usedAngles.some(angle => {
              const diff = Math.abs(start - angle);
              return diff < fixedArc * 2 || (2 * Math.PI - diff) < fixedArc * 2;
            });
            if (!tooClose) break;
            attempts++;
          } while (attempts < 50);
          
          usedAngles.push(start);
          newMemoryZones.push({ start, end: start + fixedArc, arc: fixedArc });
        }
        
        setGameState(prev => ({
          ...prev,
          currentScore: newScore,
          bestScore: Math.max(prev.bestScore, newScore),
          memoryZones: newMemoryZones,
          memoryExpectedOrder: Array.from({ length: newMemoryLevel }, (_, i) => i),
          memoryClickOrder: [],
          memoryPhase: 'showing',
          memoryLevel: newMemoryLevel,
          successFlash: true,
          successParticles: true,
          comboCount: prev.comboCount + 1,
        }));
        
        // Masquer les flashs après animation
        setTimeout(() => {
          setGameState(prev => ({ ...prev, successFlash: false, successParticles: false }));
        }, 300);
        
        // Passer en phase de mémorisation après 1 seconde
        setTimeout(() => {
          setGameState(prev => ({
            ...prev,
            memoryPhase: 'memorizing',
          }));
        }, 1000);
        
        return;
      }
      
      // Continuer à cliquer sur les zones suivantes
      setGameState(prev => ({
        ...prev,
        memoryClickOrder: newClickOrder,
        successFlash: true,
      }));
      
      setTimeout(() => {
        setGameState(prev => ({ ...prev, successFlash: false }));
      }, 200);
      
      return;
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
      setGameState(prev => ({
        ...prev,
        gameStatus: 'gameover',
        bestScore: Math.max(prev.currentScore, prev.bestScore),
        coins: prev.coins + Math.floor(prev.currentScore / 20),
        showResult: true,
        lastResult: 'failure',
      }));

      // Masquer le message de game over immédiatement
      setGameState(prev => ({ ...prev, showResult: false }));
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
        coins: prev.coins + (newScore % 2 === 0 ? 1 : 0), // +1 coin toutes les 2 zones vertes réussies
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

      // Effacer les effets visuels immédiatement
      setGameState(prev => ({
        ...prev,
        successFlash: false,
        successParticles: false,
      }));

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
        setTimeout(() => {
          setGameState(prev => ({ ...prev, showResult: false }));
        }, 100);
        return;
      }
      
      // ÉCHEC - Fin de partie pour tous les modes
      setGameState(prev => ({
        ...prev,
        gameStatus: 'gameover',
        bestScore: Math.max(prev.currentScore, prev.bestScore),
        coins: prev.coins + Math.floor(prev.currentScore / 20), // Réduction drastique des coins
        showResult: true,
        lastResult: 'failure',
      }));

      // Masquer le message de game over immédiatement
      setGameState(prev => ({ ...prev, showResult: false }));
    }
  }, [gameState.gameStatus, gameState.ballAngle, gameState.zoneStart, gameState.zoneEnd, gameState.currentScore, gameState.ballSpeed, startGame, currentMode]);

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
    if (gameState.coins >= amount) {
      setGameState(prev => ({ ...prev, coins: prev.coins - amount }));
      return true;
    }
    return false;
  }, [gameState.coins]);

  // Ajouter des coins (récompenses, défis)
  const addCoins = useCallback((amount: number) => {
    if (amount <= 0) return;
    setGameState(prev => ({ ...prev, coins: prev.coins + amount }));
  }, []);

  // Sauvegarde automatique
  useEffect(() => {
    saveProgress();
  }, [saveProgress]);

  // Acheter un thème (prix variable)
  const purchaseTheme = useCallback((themeId: string, price: number): boolean => {
    if (gameState.ownedThemes.includes(themeId)) {
      return false; // Déjà possédé
    }
    if (gameState.coins >= price) {
      setGameState(prev => ({
        ...prev,
        coins: prev.coins - price,
        ownedThemes: [...prev.ownedThemes, themeId],
      }));
      return true;
    }
    return false;
  }, [gameState.coins, gameState.ownedThemes]);

  // Acheter un item de personnalisation
  const purchaseItem = useCallback((item: CustomizationItem): boolean => {
    if (gameState.ownedItems.find(owned => owned.id === item.id)) {
      return false; // Déjà possédé
    }
    
    const itemPrice = 30; // Prix pour les items de personnalisation
    
    if (gameState.coins >= itemPrice) {
      setGameState(prev => ({
        ...prev,
        coins: prev.coins - itemPrice,
        ownedItems: [...prev.ownedItems, item]
      }));
      return true;
    }
    return false;
  }, [gameState.coins, gameState.ownedItems]);

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