import React, { useEffect } from 'react';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useSound } from '@/hooks/useSound';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface GameWheelProps {
  theme: string;
}

export const GameWheel: React.FC<GameWheelProps> = ({ theme }) => {
  const { gameState, startGame, stopWheel, resetGame } = useGameLogic();
  const { playClick, playSuccess, playFailure, toggleMute, isMuted } = useSound();

  // Handle spacebar and enter key presses
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        if (gameState.isSpinning) {
          stopWheel();
        } else if (!gameState.isPlaying) {
          startGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState.isSpinning, gameState.isPlaying, startGame, stopWheel]);

  // Play sounds based on game result
  useEffect(() => {
    if (gameState.showResult) {
      if (gameState.lastResult === 'success') {
        playSuccess();
      } else if (gameState.lastResult === 'failure') {
        playFailure();
      }
    }
  }, [gameState.showResult, gameState.lastResult, playSuccess, playFailure]);

  const handleWheelClick = () => {
    playClick();
    if (gameState.isSpinning) {
      stopWheel();
    } else if (!gameState.isPlaying) {
      startGame();
    }
  };

  const handleReset = () => {
    playClick();
    resetGame();
  };

  // Calculate wheel segments for visual display
  const segments = 8;
  const segmentAngle = 360 / segments;

  return (
    <div className={`min-h-screen bg-gradient-game flex flex-col items-center justify-center p-4 ${theme}`}>
      {/* Score Display */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="text-6xl font-bold text-primary mb-2 drop-shadow-lg">
          {gameState.currentScore}
        </div>
        <div className="text-text-secondary text-lg">
          Best: {gameState.bestScore} • Coins: {gameState.coins} • Level: {gameState.level}
        </div>
      </div>

      {/* Wheel Container */}
      <div className="relative mb-8">
        {/* Indicateur externe de visée (à l'extérieur du cercle) */
        }
        <div className="absolute inset-0 pointer-events-none z-30">
          {/* Flèche de cible */}
          <div 
            className="absolute w-8 h-8 transform -translate-x-1/2 -translate-y-1/2"
            style={{
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) rotate(${gameState.cursorPosition}deg) translateY(-190px)`,
            }}
            aria-label="Indicateur de visée"
          >
            <div className="w-0 h-0 border-l-8 border-r-8 border-b-16 border-l-transparent border-r-transparent border-b-white drop-shadow-2xl animate-pulse scale-125 shadow-glow-primary"></div>
          </div>

          {/* Point lumineux pour mieux voir l'endroit exact */}
          <div
            className="absolute w-3 h-3 rounded-full bg-primary shadow-glow-primary transform -translate-x-1/2 -translate-y-1/2"
            style={{
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) rotate(${gameState.cursorPosition}deg) translateY(-210px)`,
            }}
          />
        </div>

        {/* Wheel */}
        <div 
          className={`
            relative w-80 h-80 rounded-full border-4 border-wheel-border shadow-wheel
            ${gameState.isSpinning ? 'animate-spin-wheel cursor-pointer' : 'cursor-pointer hover:scale-105'}
            ${gameState.showResult && gameState.lastResult === 'success' ? 'animate-success-flash' : ''}
            ${gameState.showResult && gameState.lastResult === 'failure' ? 'animate-danger-shake' : ''}
            transition-transform duration-300
          `}
          style={{
            transform: `rotate(${gameState.wheelRotation}deg)`,
            animationDuration: gameState.isSpinning ? `${gameState.wheelSpeed}s` : undefined,
          }}
          onClick={handleWheelClick}
        >
          {/* Wheel Background */}
          <div className="absolute inset-0 rounded-full bg-gradient-wheel"></div>

          {/* Wheel segments */}
          {Array.from({ length: segments }, (_, i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(from ${i * segmentAngle}deg, 
                  hsl(var(--wheel-segment)) ${i * segmentAngle}deg, 
                  hsl(var(--wheel-base)) ${(i + 0.5) * segmentAngle}deg, 
                  hsl(var(--wheel-segment)) ${(i + 1) * segmentAngle}deg)`,
                opacity: 0.8,
              }}
            ></div>
          ))}

          {/* Green Zone (Success Zone) - Enhanced Visibility */}
          <div
            className="absolute inset-0 rounded-full animate-pulse-zone"
            style={{
              background: `conic-gradient(from ${360 - gameState.greenZoneSize / 2}deg, 
                transparent 0deg, 
                hsl(var(--success)) ${gameState.greenZoneSize / 2}deg,
                hsl(var(--success-glow)) ${gameState.greenZoneSize / 2 + 1}deg,
                hsl(var(--success)) ${gameState.greenZoneSize}deg,
                transparent ${gameState.greenZoneSize}deg)`,
              filter: 'drop-shadow(0 0 20px hsl(var(--success) / 1)) drop-shadow(0 0 40px hsl(var(--success) / 0.6))',
              border: '3px solid hsl(var(--success-glow))',
              boxShadow: `
                inset 0 0 20px hsl(var(--success) / 0.3),
                0 0 30px hsl(var(--success) / 0.8),
                0 0 60px hsl(var(--success) / 0.4)
              `,
            }}
          ></div>

          {/* Center Hub */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-game-dark border-2 border-primary shadow-glow-primary flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-primary animate-pulse-glow"></div>
          </div>
        </div>

        {/* Result Overlay */}
        {gameState.showResult && (
          <div className="absolute inset-0 flex items-center justify-center z-30">
            <div className={`
              px-6 py-3 rounded-full text-white font-bold text-xl animate-scale-in
              ${gameState.lastResult === 'success' 
                ? 'bg-gradient-success shadow-glow-success' 
                : 'bg-gradient-danger shadow-glow-danger'
              }
            `}>
              {gameState.lastResult === 'success' ? 'SUCCESS!' : 'GAME OVER'}
            </div>
          </div>
        )}
      </div>

      {/* Game Controls */}
      <div className="flex gap-4 items-center animate-fade-in">
        {!gameState.isPlaying ? (
          <Button 
            onClick={handleWheelClick}
            size="lg"
            className="bg-gradient-primary hover:scale-105 shadow-glow-primary transition-all duration-300 px-8 py-4 text-lg font-bold"
          >
            <Play className="w-6 h-6 mr-2" />
            START GAME
          </Button>
        ) : (
          <Button 
            onClick={handleWheelClick}
            size="lg"
            className="bg-gradient-primary hover:scale-105 shadow-glow-primary transition-all duration-300 px-8 py-4 text-lg font-bold"
            disabled={!gameState.isSpinning}
          >
            <Pause className="w-6 h-6 mr-2" />
            STOP WHEEL
          </Button>
        )}

        <Button
          onClick={handleReset}
          variant="outline"
          size="lg"
          className="border-wheel-border hover:bg-button-hover hover:scale-105 transition-all duration-300"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>

        <Button
          onClick={toggleMute}
          variant="outline"
          size="lg"
          className="border-wheel-border hover:bg-button-hover hover:scale-105 transition-all duration-300"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
      </div>

      {/* Instructions */}
      <div className="text-center mt-8 text-text-muted animate-fade-in">
        <p className="text-sm">
          {gameState.isSpinning 
            ? 'Click the wheel, press SPACE or ENTER to stop!'
            : 'Click START or press SPACE/ENTER to begin'
          }
        </p>
        <p className="text-xs mt-2">
          Zone Size: {Math.round(gameState.greenZoneSize)}° • Speed: {gameState.wheelSpeed.toFixed(1)}s
        </p>
      </div>
    </div>
  );
};