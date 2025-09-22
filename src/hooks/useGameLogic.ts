import { useState, useCallback, useEffect, useRef } from 'react';
import * as React from 'react';
import { ModeType, ModeID, cfgModes, cfgBase, inArc } from '@/constants/modes';

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
    };
    
    if (saved) {
      try {
        const parsedState = JSON.parse(saved);
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
    const dataToSave = {
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
  }, [gameState.bestScore, gameState.coins, gameState.ownedThemes, gameState.ownedItems, gameState.currentCustomization, gameState.currentMode]);

  // Animation de la bille (60 FPS) + Zone mobile
  const animateBall = useCallback(() => {
    if (gameState.gameStatus !== 'running') return;

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
    if (gameState.gameStatus === 'running') {
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

  // Démarrer le jeu
  const startGame = useCallback(() => {
    const modeConfig = cfgModes[currentMode];
    const zoneStart = Math.random() * 2 * Math.PI;
    const zoneArc = modeConfig.variableArc 
      ? Math.random() * (modeConfig.arcMax! - modeConfig.arcMin!) + modeConfig.arcMin!
      : modeConfig.zoneArc || cfgBase.zoneArc;
    
    // Vitesse de base modifiée pour le mode survie (+17%)
    const baseSpeed = modeConfig.survival ? cfg.baseSpeed * 1.17 : cfg.baseSpeed;
      
    setGameState(prev => ({
      ...prev,
      gameStatus: 'running',
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
      totalGamesPlayed: prev.totalGamesPlayed + 1,
      timeLeft: modeConfig.survival ? modeConfig.survivalTime : undefined,
      zoneDrift: modeConfig.keepMovingZone ? 0 : undefined,
      zoneDriftSpeed: modeConfig.keepMovingZone ? -modeConfig.zoneDriftSpeed : undefined, // Négatif pour aller dans le sens opposé de la balle
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

    // Vérifier si la bille est dans la zone verte (ou la deuxième zone en mode survie)
    const modeConfig = cfgModes[gameState.currentMode];
    const success = inArc(gameState.ballAngle, gameState.zoneStart, gameState.zoneEnd) ||
      (modeConfig.survival && inArc(gameState.ballAngle, (gameState.zoneStart + Math.PI) % (2 * Math.PI), (gameState.zoneEnd + Math.PI) % (2 * Math.PI)));

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

      // Mode Arc Changeant : changer la taille et position de l'arc
      if (modeConfig.variableArc) {
        newZoneArc = Math.random() * (modeConfig.arcMax! - modeConfig.arcMin!) + modeConfig.arcMin!;
        newZoneStart = Math.random() * 2 * Math.PI;
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
        coins: prev.coins + Math.floor(newScore / 6), // Gain de coins réduit
        level: prev.level + 1,
        lastResult: 'success',
        showResult: false,
        successFlash: true,
        successParticles: true,
        comboCount: newScore,
        maxSpeedReached: Math.max(prev.maxSpeedReached, newSpeed),
        directionChanges: shouldReverse ? prev.directionChanges + 1 : prev.directionChanges,
      }));

      // Effacer les effets visuels après 200ms
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          successFlash: false,
          successParticles: false,
        }));
      }, 200);

    } else {
      // ÉCHEC - Fin de partie pour tous les modes
      setGameState(prev => ({
        ...prev,
        gameStatus: 'gameover',
        bestScore: Math.max(prev.currentScore, prev.bestScore),
        coins: prev.coins + Math.floor(prev.currentScore / 20), // Réduction drastique des coins
        showResult: true,
        lastResult: 'failure',
      }));

      // Masquer le message de game over après 2 secondes
      setTimeout(() => {
        setGameState(prev => ({ ...prev, showResult: false }));
      }, 2000);
    }
  }, [gameState.gameStatus, gameState.ballAngle, gameState.zoneStart, gameState.zoneEnd, gameState.currentScore, gameState.ballSpeed, startGame, currentMode]);

  // Réinitialiser le jeu
  const resetGame = useCallback(() => {
    const modeConfig = cfgModes[currentMode];
    const zoneStart = Math.random() * 2 * Math.PI;
    const zoneArc = modeConfig.variableArc 
      ? Math.random() * (modeConfig.arcMax! - modeConfig.arcMin!) + modeConfig.arcMin!
      : modeConfig.zoneArc || cfgBase.zoneArc;
    
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

  return {
    gameState,
    startGame,
    onTap,
    resetGame,
    spendCoins,
    addCoins,
    purchaseTheme,
    purchaseItem,
    cfg, // Export config pour l'affichage
  };
};