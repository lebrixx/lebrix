import { useState, useCallback, useEffect, useRef } from 'react';

export interface GameState {
  gameStatus: 'idle' | 'running' | 'gameover';
  currentScore: number;
  bestScore: number;
  coins: number;
  ballAngle: number; // Position angulaire de la bille (radians)
  ballSpeed: number; // Vitesse angulaire (radians/seconde)
  zoneStart: number; // Angle de début de la zone verte (radians)
  zoneEnd: number; // Angle de fin de la zone verte (radians)
  showResult: boolean;
  lastResult: 'success' | 'failure' | null;
  level: number;
}

// Configuration du jeu
const cfg = {
  radius: 110,                // rayon de rotation de la bille
  ballSize: 10,               // diamètre visuel de la bille (px)
  baseSpeed: 1.8,            // radians/seconde au départ
  speedGain: 1.03,           // +3% à chaque réussite
  zoneArc: Math.PI / 5,      // taille de l'arc vert (constante, ~36°)
  debounceMs: 40             // anti double-tap
};

export const useGameLogic = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('luckyStopGame');
    const zoneStart = Math.random() * 2 * Math.PI;
    const defaultState: GameState = {
      gameStatus: 'idle',
      currentScore: 0,
      bestScore: 0,
      coins: 100, // Starting coins
      ballAngle: 0,
      ballSpeed: cfg.baseSpeed,
      zoneStart: zoneStart,
      zoneEnd: zoneStart + cfg.zoneArc,
      showResult: false,
      lastResult: null,
      level: 1,
    };
    
    if (saved) {
      try {
        const parsedState = JSON.parse(saved);
        return {
          ...defaultState,
          bestScore: parsedState.bestScore || 0,
          coins: parsedState.coins || 100,
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

  // Sauvegarde du progress
  const saveProgress = useCallback(() => {
    const dataToSave = {
      bestScore: gameState.bestScore,
      coins: gameState.coins,
      timestamp: Date.now(),
    };
    localStorage.setItem('luckyStopGame', JSON.stringify(dataToSave));
  }, [gameState.bestScore, gameState.coins]);

  // Animation de la bille (60 FPS)
  const animateBall = useCallback(() => {
    if (gameState.gameStatus !== 'running') return;

    const animate = (currentTime: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = currentTime;
      }

      const deltaTime = (currentTime - lastTimeRef.current) / 1000; // en secondes
      lastTimeRef.current = currentTime;

      setGameState(prev => ({
        ...prev,
        ballAngle: (prev.ballAngle + prev.ballSpeed * deltaTime) % (2 * Math.PI),
      }));

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
      zoneStart: zoneStart,
      zoneEnd: zoneStart + cfg.zoneArc,
      showResult: false,
      lastResult: null,
      level: 1,
    }));
  }, []);

  // Vérifier si l'angle est dans la zone verte (gère le wrap 0-2π)
  const isInGreenZone = useCallback((angle: number, zoneStart: number, zoneEnd: number): boolean => {
    if (zoneStart <= zoneEnd) {
      return angle >= zoneStart && angle <= zoneEnd;
    } else {
      // La zone traverse 0 (ex: de 5.5 à 0.5)
      return angle >= zoneStart || angle <= zoneEnd;
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
    const success = isInGreenZone(gameState.ballAngle, gameState.zoneStart, gameState.zoneEnd);

    if (success) {
      // SUCCÈS - Continue immédiatement sans pause
      const newScore = gameState.currentScore + 1;
      const newSpeed = gameState.ballSpeed * cfg.speedGain; // +3%
      const newZoneStart = Math.random() * 2 * Math.PI;
      const newZoneEnd = newZoneStart + cfg.zoneArc;

      setGameState(prev => ({
        ...prev,
        currentScore: newScore,
        ballSpeed: newSpeed,
        zoneStart: newZoneStart,
        zoneEnd: newZoneEnd,
        coins: prev.coins + newScore, // Gain de coins basé sur le score
        level: prev.level + 1,
        lastResult: 'success',
        showResult: true,
      }));

      // Masquer le résultat rapidement
      setTimeout(() => {
        setGameState(prev => ({ ...prev, showResult: false }));
      }, 500);

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
      zoneStart: zoneStart,
      zoneEnd: zoneStart + cfg.zoneArc,
      showResult: false,
      lastResult: null,
      level: 1,
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

  // Sauvegarde automatique
  useEffect(() => {
    saveProgress();
  }, [saveProgress]);

  return {
    gameState,
    startGame,
    onTap,
    resetGame,
    spendCoins,
    cfg, // Export config pour l'affichage
  };
};