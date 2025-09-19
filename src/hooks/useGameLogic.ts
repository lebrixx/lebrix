import { useState, useCallback, useEffect, useRef } from 'react';

export interface GameState {
  isPlaying: boolean;
  isSpinning: boolean;
  currentScore: number;
  bestScore: number;
  coins: number;
  wheelSpeed: number;
  greenZoneSize: number;
  wheelRotation: number;
  showResult: boolean;
  lastResult: 'success' | 'failure' | null;
  level: number;
}

export interface GameStats {
  totalGames: number;
  totalWins: number;
  totalCoins: number;
  averageScore: number;
}

const INITIAL_SPEED = 2; // seconds per rotation
const MIN_SPEED = 0.3;
const INITIAL_GREEN_ZONE = 60; // degrees
const MIN_GREEN_ZONE = 15;
const SPEED_INCREASE = 0.9;
const ZONE_DECREASE = 0.92;

export const useGameLogic = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('luckyStopGame');
    const defaultState: GameState = {
      isPlaying: false,
      isSpinning: false,
      currentScore: 0,
      bestScore: 0,
      coins: 100, // Starting coins
      wheelSpeed: INITIAL_SPEED,
      greenZoneSize: INITIAL_GREEN_ZONE,
      wheelRotation: 0,
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
  const startTimeRef = useRef<number>();

  // Save progress to localStorage
  const saveProgress = useCallback(() => {
    const dataToSave = {
      bestScore: gameState.bestScore,
      coins: gameState.coins,
      timestamp: Date.now(),
    };
    localStorage.setItem('luckyStopGame', JSON.stringify(dataToSave));
  }, [gameState.bestScore, gameState.coins]);

  // Animate wheel rotation
  const animateWheel = useCallback(() => {
    if (!gameState.isSpinning) return;

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const rotationSpeed = 360 / (gameState.wheelSpeed * 1000); // degrees per millisecond
      const newRotation = (elapsed * rotationSpeed) % 360;

      setGameState(prev => ({
        ...prev,
        wheelRotation: newRotation,
      }));

      if (gameState.isSpinning) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [gameState.isSpinning, gameState.wheelSpeed]);

  useEffect(() => {
    if (gameState.isSpinning) {
      startTimeRef.current = undefined;
      animateWheel();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState.isSpinning, animateWheel]);

  const startGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      isSpinning: true,
      currentScore: 0,
      wheelSpeed: INITIAL_SPEED,
      greenZoneSize: INITIAL_GREEN_ZONE,
      showResult: false,
      lastResult: null,
      level: 1,
    }));
  }, []);

  const stopWheel = useCallback(() => {
    if (!gameState.isSpinning) return;

    setGameState(prev => ({ ...prev, isSpinning: false }));

    // Check if wheel stopped in green zone
    // Green zone is positioned at top (0 degrees) with size gameState.greenZoneSize
    const stopPosition = gameState.wheelRotation;
    const greenZoneStart = 360 - (gameState.greenZoneSize / 2);
    const greenZoneEnd = (gameState.greenZoneSize / 2);
    
    const isSuccess = stopPosition >= greenZoneStart || stopPosition <= greenZoneEnd;

    // Immediate processing - no setTimeout delays
    if (isSuccess) {
      // Success - continue to next level immediately
      const newScore = gameState.currentScore + 1;
      const newSpeed = Math.max(gameState.wheelSpeed * SPEED_INCREASE, MIN_SPEED);
      const newZoneSize = Math.max(gameState.greenZoneSize * ZONE_DECREASE, MIN_GREEN_ZONE);
      const coinsEarned = gameState.level;
      
      // Randomize rotation direction occasionally for variety
      const shouldReverse = Math.random() < 0.15;

      setGameState(prev => ({
        ...prev,
        currentScore: newScore,
        wheelSpeed: newSpeed,
        greenZoneSize: newZoneSize,
        coins: prev.coins + coinsEarned,
        isSpinning: true, // Continue immediately
        showResult: true,
        lastResult: 'success',
        level: prev.level + 1,
        wheelRotation: shouldReverse ? 360 - prev.wheelRotation : prev.wheelRotation,
      }));

      // Non-blocking result hide
      requestAnimationFrame(() => {
        setTimeout(() => {
          setGameState(prev => ({ ...prev, showResult: false }));
        }, 800);
      });

    } else {
      // Failure - end game
      const finalScore = gameState.currentScore;
      const newBestScore = Math.max(finalScore, gameState.bestScore);
      const bonusCoins = Math.floor(finalScore / 2);

      setGameState(prev => ({
        ...prev,
        isPlaying: false,
        bestScore: newBestScore,
        coins: prev.coins + bonusCoins,
        showResult: true,
        lastResult: 'failure',
      }));

      // Non-blocking result hide
      requestAnimationFrame(() => {
        setTimeout(() => {
          setGameState(prev => ({ ...prev, showResult: false }));
        }, 1500);
      });
    }
  }, [gameState.isSpinning, gameState.wheelRotation, gameState.greenZoneSize, gameState.currentScore, gameState.bestScore, gameState.wheelSpeed, gameState.level]);

  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      isSpinning: false,
      currentScore: 0,
      wheelSpeed: INITIAL_SPEED,
      greenZoneSize: INITIAL_GREEN_ZONE,
      wheelRotation: 0,
      showResult: false,
      lastResult: null,
      level: 1,
    }));
  }, []);

  const spendCoins = useCallback((amount: number): boolean => {
    if (gameState.coins >= amount) {
      setGameState(prev => ({ ...prev, coins: prev.coins - amount }));
      return true;
    }
    return false;
  }, [gameState.coins]);

  // Auto-save progress
  useEffect(() => {
    saveProgress();
  }, [saveProgress]);

  return {
    gameState,
    startGame,
    stopWheel,
    resetGame,
    spendCoins,
  };
};