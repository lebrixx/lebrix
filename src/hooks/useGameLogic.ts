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
  cursorPosition: number; // Position of the fixed cursor (0-360 degrees)
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
      cursorPosition: 0, // Start at top
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
      cursorPosition: 0,
    }));
  }, []);

  const stopWheel = useCallback(() => {
    if (!gameState.isSpinning) return;

    // Check if cursor is in green zone
    const normalizedRotation = gameState.wheelRotation % 360;
    const greenZoneStart = (360 - gameState.greenZoneSize / 2) % 360;
    const greenZoneEnd = (gameState.greenZoneSize / 2) % 360;
    
    // Calculate actual green zone position on wheel relative to cursor
    const actualGreenStart = (greenZoneStart - normalizedRotation + 360) % 360;
    const actualGreenEnd = (greenZoneEnd - normalizedRotation + 360) % 360;
    
    // Check if cursor position intersects with green zone
    const isSuccess = actualGreenStart > actualGreenEnd 
      ? (gameState.cursorPosition >= actualGreenStart || gameState.cursorPosition <= actualGreenEnd)
      : (gameState.cursorPosition >= actualGreenStart && gameState.cursorPosition <= actualGreenEnd);

    if (isSuccess) {
      // SUCCESS - IMMEDIATE CONTINUATION, NO DELAYS
      const newScore = gameState.currentScore + 1;
      const newSpeed = Math.max(gameState.wheelSpeed * SPEED_INCREASE, MIN_SPEED);
      const newZoneSize = Math.max(gameState.greenZoneSize * ZONE_DECREASE, MIN_GREEN_ZONE);
      
      // 30% chance to reverse direction
      const shouldReverse = Math.random() < 0.3;
      
      // Change cursor position randomly to make it more addictive
      const newCursorPosition = Math.floor(Math.random() * 8) * 45; // 8 positions around the circle

      setGameState(prev => ({
        ...prev,
        currentScore: newScore,
        wheelSpeed: newSpeed,
        greenZoneSize: newZoneSize,
        coins: prev.coins + newScore,
        level: prev.level + 1,
        cursorPosition: newCursorPosition,
        wheelRotation: shouldReverse ? 360 - prev.wheelRotation : prev.wheelRotation,
        // NO showResult, NO delays - keep it fluid
      }));

    } else {
      // FAILURE - stop game
      setGameState(prev => ({
        ...prev,
        isPlaying: false,
        isSpinning: false,
        bestScore: Math.max(gameState.currentScore, prev.bestScore),
        coins: prev.coins + Math.floor(gameState.currentScore / 2),
        showResult: true,
        lastResult: 'failure',
      }));

      // Hide failure message
      setTimeout(() => {
        setGameState(prev => ({ ...prev, showResult: false }));
      }, 1500);
    }
  }, [gameState.isSpinning, gameState.wheelRotation, gameState.greenZoneSize, gameState.currentScore, gameState.bestScore, gameState.wheelSpeed, gameState.level, gameState.cursorPosition]);

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