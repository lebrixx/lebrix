import { useState, useCallback, useEffect, useRef } from 'react';
import * as React from 'react';

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
}

// Configuration du jeu
const cfg = {
  radius: 110,                // rayon de rotation de la bille
  ballSize: 10,               // diamètre visuel de la bille (px)
  baseSpeed: 1.8,            // radians/seconde au départ
  speedGain: 1.03,           // +3% à chaque réussite (comme demandé)
  zoneArc: Math.PI / 5,      // taille de l'arc vert (constante, ~36°)
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

export const useGameLogic = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('luckyStopGame');
    const zoneStart = Math.random() * 2 * Math.PI;
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
      zoneEnd: zoneStart + cfg.zoneArc,
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
    };
    
    if (saved) {
      try {
        const parsedState = JSON.parse(saved);
        return {
          ...defaultState,
          bestScore: parsedState.bestScore || 0,
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
  });

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
      bestScore: gameState.bestScore,
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
  }, [gameState.bestScore, gameState.coins, gameState.ownedThemes, gameState.ownedItems, gameState.currentCustomization]);

  // Animation de la bille (60 FPS)
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
        
        return {
          ...prev,
          ballAngle: newAngle,
        };
      });

      if (gameState.gameStatus === 'running') {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [gameState.gameStatus]);

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
    const zoneStart = Math.random() * 2 * Math.PI;
    setGameState(prev => ({
      ...prev,
      gameStatus: 'running',
      currentScore: 0,
      ballAngle: 0,
      ballSpeed: cfg.baseSpeed,
      ballDirection: 1,
      zoneStart: zoneStart,
      zoneEnd: zoneStart + cfg.zoneArc,
      showResult: false,
      lastResult: null,
      level: 1,
      successFlash: false,
      successParticles: false,
      comboCount: 0,
      maxSpeedReached: cfg.baseSpeed,
      directionChanges: 0,
      totalGamesPlayed: prev.totalGamesPlayed + 1,
    }));
  }, []);

  // Vérifier si l'angle est dans la zone verte (gère le wrap 0-2π)
  const isInGreenZone = useCallback((angle: number, zoneStart: number): boolean => {
    // Normaliser tous les angles entre 0 et 2π
    const normalizedAngle = ((angle % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
    const normalizedZoneStart = ((zoneStart % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
    const normalizedZoneEnd = ((normalizedZoneStart + cfg.zoneArc) % (2 * Math.PI));
    
    if (normalizedZoneStart <= normalizedZoneEnd) {
      // Zone normale (ne traverse pas 0)
      return normalizedAngle >= normalizedZoneStart && normalizedAngle <= normalizedZoneEnd;
    } else {
      // La zone traverse 0 (ex: de 5.5 à 0.5)
      return normalizedAngle >= normalizedZoneStart || normalizedAngle <= normalizedZoneEnd;
    }
  }, []);

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

    // Vérifier si la bille est dans la zone verte
    const success = isInGreenZone(gameState.ballAngle, gameState.zoneStart);

    if (success) {
      // SUCCÈS - Continue immédiatement sans pause
      const newScore = gameState.currentScore + 1;
      const baseSpeed = gameState.ballSpeed * cfg.speedGain; // +3%
      
      // Variation aléatoire de vitesse (±5%)
      const speedVariation = (Math.random() - 0.5) * 2 * cfg.speedVariation;
      const newSpeed = baseSpeed * (1 + speedVariation);
      
      // Chance aléatoire d'inverser la direction (20%)
      const shouldReverse = Math.random() < cfg.directionReverseChance;
      const newDirection = shouldReverse ? gameState.ballDirection * -1 : gameState.ballDirection;
      
      const newZoneStart = Math.random() * 2 * Math.PI;

      setGameState(prev => ({
        ...prev,
        currentScore: newScore,
        bestScore: Math.max(prev.bestScore, newScore),
        ballSpeed: newSpeed,
        ballDirection: newDirection,
        zoneStart: newZoneStart,
        zoneEnd: newZoneStart + cfg.zoneArc,
        coins: prev.coins + newScore, // Gain de coins basé sur le score
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
      // ÉCHEC - Fin de partie
      setGameState(prev => ({
        ...prev,
        gameStatus: 'gameover',
        bestScore: Math.max(gameState.currentScore, prev.bestScore),
        coins: prev.coins + Math.floor(gameState.currentScore / 2), // Bonus coins pour essayer
        showResult: true,
        lastResult: 'failure',
      }));

      // Masquer le message de game over après 2 secondes
      setTimeout(() => {
        setGameState(prev => ({ ...prev, showResult: false }));
      }, 2000);
    }
  }, [gameState.gameStatus, gameState.ballAngle, gameState.zoneStart, gameState.zoneEnd, gameState.currentScore, gameState.ballSpeed, startGame, isInGreenZone]);

  // Réinitialiser le jeu
  const resetGame = useCallback(() => {
    const zoneStart = Math.random() * 2 * Math.PI;
    setGameState(prev => ({
      ...prev,
      gameStatus: 'idle',
      currentScore: 0,
      ballAngle: 0,
      ballSpeed: cfg.baseSpeed,
      ballDirection: 1,
      zoneStart: zoneStart,
      zoneEnd: zoneStart + cfg.zoneArc,
      showResult: false,
      lastResult: null,
      level: 1,
      successFlash: false,
      successParticles: false,
      comboCount: 0,
      maxSpeedReached: cfg.baseSpeed,
      directionChanges: 0,
    }));
  }, []);

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