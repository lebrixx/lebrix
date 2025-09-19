import React, { useEffect } from 'react';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useSound } from '@/hooks/useSound';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface CircleTapProps {
  theme: string;
}

export const CircleTap: React.FC<CircleTapProps> = ({ theme }) => {
  const { gameState, startGame, onTap, resetGame, cfg } = useGameLogic();
  const { playClick, playSuccess, playFailure, toggleMute, isMuted } = useSound();

  // Gestion des touches clavier
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        onTap();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onTap]);

  // Sons basés sur le résultat
  useEffect(() => {
    if (gameState.showResult) {
      if (gameState.lastResult === 'success') {
        playSuccess();
      } else if (gameState.lastResult === 'failure') {
        playFailure();
      }
    }
  }, [gameState.showResult, gameState.lastResult, playSuccess, playFailure]);

  const handleTap = () => {
    playClick();
    onTap();
  };

  const handleReset = () => {
    playClick();
    resetGame();
  };

  // Position de la bille
  const ballX = Math.cos(gameState.ballAngle - Math.PI / 2) * cfg.radius;
  const ballY = Math.sin(gameState.ballAngle - Math.PI / 2) * cfg.radius;

  // Position de la zone verte
  const zoneStartDeg = (gameState.zoneStart * 180) / Math.PI;
  const zoneArcDeg = (cfg.zoneArc * 180) / Math.PI;

  return (
    <div className={`min-h-screen bg-gradient-game flex flex-col items-center justify-center p-4 ${theme}`}>
      {/* Affichage du score */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="text-6xl font-bold text-primary mb-2 drop-shadow-lg">
          {gameState.currentScore}
        </div>
        <div className="text-text-secondary text-lg">
          Meilleur: {gameState.bestScore} • Coins: {gameState.coins} • Niveau: {gameState.level}
        </div>
      </div>

      {/* Conteneur du jeu */}
      <div className="relative mb-8">
        {/* Cercle principal (anneau) */}
        <svg
          width={cfg.radius * 2 + 80}
          height={cfg.radius * 2 + 80}
          className="drop-shadow-2xl"
          onClick={handleTap}
          style={{ cursor: gameState.gameStatus === 'running' ? 'pointer' : 'default' }}
        >
          {/* Cercle de base */}
          <circle
            cx={cfg.radius + 40}
            cy={cfg.radius + 40}
            r={cfg.radius}
            fill="none"
            stroke="hsl(var(--ring))"
            strokeWidth="8"
            className="opacity-80"
          />

          {/* Zone verte (arc de succès) */}
          <path
            d={`M ${cfg.radius + 40 + Math.cos((zoneStartDeg - 90) * Math.PI / 180) * cfg.radius} ${cfg.radius + 40 + Math.sin((zoneStartDeg - 90) * Math.PI / 180) * cfg.radius}
                A ${cfg.radius} ${cfg.radius} 0 ${zoneArcDeg > 180 ? 1 : 0} 1 
                ${cfg.radius + 40 + Math.cos((zoneStartDeg + zoneArcDeg - 90) * Math.PI / 180) * cfg.radius} ${cfg.radius + 40 + Math.sin((zoneStartDeg + zoneArcDeg - 90) * Math.PI / 180) * cfg.radius}`}
            fill="none"
            stroke="#4ee1a0"
            strokeWidth="16"
            className="drop-shadow-lg animate-pulse"
            style={{
              filter: 'drop-shadow(0 0 15px #4ee1a0) drop-shadow(0 0 30px #4ee1a0)',
            }}
          />

          {/* Bille - Barre rouge qui dépasse */}
          <g transform={`translate(${cfg.radius + 40}, ${cfg.radius + 40}) rotate(${(gameState.ballAngle * 180) / Math.PI - 90})`}>
            {/* Barre rouge principale qui dépasse */}
            <rect
              x={cfg.radius - 15}
              y={-3}
              width={30}
              height={6}
              fill="#FF4444"
              className="drop-shadow-lg"
              style={{
                filter: 'drop-shadow(0 0 10px #FF4444) drop-shadow(0 0 20px #FF4444)',
              }}
            />
            
            {/* Centre de la bille pour l'animation */}
            <circle
              cx={cfg.radius}
              cy={0}
              r={8}
              fill="#FF4444"
              className="animate-pulse"
              style={{
                filter: 'drop-shadow(0 0 8px #FF4444)',
              }}
            />
          </g>

          {/* Trail de la bille quand elle bouge */}
          {gameState.gameStatus === 'running' && (
            <g transform={`translate(${cfg.radius + 40}, ${cfg.radius + 40}) rotate(${(gameState.ballAngle * 180) / Math.PI - 90})`}>
              <rect
                x={cfg.radius - 15}
                y={-3}
                width={30}
                height={6}
                fill="#FF4444"
                className="opacity-30 animate-ping"
              />
            </g>
          )}
        </svg>

        {/* Overlay des résultats */}
        {gameState.showResult && (
          <div className="absolute inset-0 flex items-center justify-center z-30">
            <div className={`
              px-6 py-3 rounded-full text-white font-bold text-xl animate-scale-in
              ${gameState.lastResult === 'success' 
                ? 'bg-gradient-success shadow-glow-success' 
                : 'bg-gradient-danger shadow-glow-danger'
              }
            `}>
              {gameState.lastResult === 'success' ? 'RÉUSSI!' : 'PARTIE TERMINÉE'}
            </div>
          </div>
        )}
      </div>

      {/* Contrôles du jeu */}
      <div className="flex gap-4 items-center animate-fade-in">
        {gameState.gameStatus === 'idle' || gameState.gameStatus === 'gameover' ? (
          <Button 
            onClick={handleTap}
            size="lg"
            className="bg-gradient-primary hover:scale-105 shadow-glow-primary transition-all duration-300 px-8 py-4 text-lg font-bold"
          >
            <Play className="w-6 h-6 mr-2" />
            {gameState.gameStatus === 'idle' ? 'COMMENCER' : 'REJOUER'}
          </Button>
        ) : (
          <Button 
            onClick={handleTap}
            size="lg"
            className="bg-gradient-primary hover:scale-105 shadow-glow-primary transition-all duration-300 px-8 py-4 text-lg font-bold"
          >
            TAPER
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
          {gameState.gameStatus === 'running' 
            ? 'Tapez quand la barre rouge est dans la zone verte!'
            : gameState.gameStatus === 'idle'
            ? 'Cliquez COMMENCER ou appuyez sur ESPACE/ENTRÉE'
            : 'Tapez pour rejouer'
          }
        </p>
        <p className="text-xs mt-2">
          Vitesse: {gameState.ballSpeed.toFixed(1)} rad/s • Zone: {Math.round((cfg.zoneArc * 180) / Math.PI)}°
        </p>
      </div>
    </div>
  );
};