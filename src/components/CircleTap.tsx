import React, { useEffect } from 'react';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useSound } from '@/hooks/useSound';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface CircleTapProps {
  theme: string;
  customization?: {
    background: string;
    circle: string;
    effect: string;
  };
}

export const CircleTap: React.FC<CircleTapProps> = ({ theme, customization }) => {
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

  // Sons basés sur le résultat avec combo
  useEffect(() => {
    if (gameState.lastResult === 'success') {
      playSuccess(gameState.comboCount);
    } else if (gameState.showResult && gameState.lastResult === 'failure') {
      playFailure();
    }
  }, [gameState.lastResult, gameState.showResult, gameState.comboCount, playSuccess, playFailure]);

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

  // Couleur du cercle basée sur la personnalisation
  const getCircleColor = () => {
    if (customization?.circle === 'circle-neon') return '#00ffff';
    if (customization?.circle === 'circle-fire') return '#ff4444';
    if (customization?.circle === 'circle-gold') return '#ffd700';
    return '#4ee1a0'; // Défaut
  };

  // Style de l'arrière-plan basé sur la personnalisation
  const getBackgroundStyle = () => {
    if (customization?.background === 'bg-space') return { background: 'linear-gradient(135deg, #0a0a2e, #16213e)' };
    if (customization?.background === 'bg-sunset') return { background: 'linear-gradient(135deg, #ff7e5f, #feb47b)' };
    if (customization?.background === 'bg-forest') return { background: 'linear-gradient(135deg, #134e5e, #71b280)' };
    return {};
  };

  return (
    <div 
      className={`min-h-screen flex flex-col items-center justify-center p-4 ${theme} animate-animated-gradient`}
      style={getBackgroundStyle()}
    >
      {/* HUD - Score en gros et best score */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="text-8xl font-bold text-primary mb-2 drop-shadow-lg animate-pulse-glow">
          {gameState.currentScore}
        </div>
        <div className="text-text-secondary text-xl font-semibold">
          Meilleur: {gameState.bestScore}
        </div>
        <div className="text-text-muted text-sm mt-2">
          Coins: {gameState.coins} • Niveau: {gameState.level}
        </div>
      </div>

      {/* Conteneur du jeu */}
      <div className="relative mb-8">
        {/* Cercle principal (anneau) */}
        <svg
          width={cfg.radius * 2 + 80}
          height={cfg.radius * 2 + 80}
          className={`drop-shadow-2xl ${gameState.successFlash ? 'animate-circle-flash' : ''}`}
          onClick={handleTap}
          style={{ cursor: gameState.gameStatus === 'running' ? 'pointer' : 'default' }}
        >
          {/* Cercle de base avec glow */}
          <circle
            cx={cfg.radius + 40}
            cy={cfg.radius + 40}
            r={cfg.radius}
            fill="none"
            stroke="hsl(var(--ring))"
            strokeWidth="12"
            className="opacity-90"
            style={{
              filter: 'drop-shadow(0 0 5px hsl(var(--ring) / 0.5))',
            }}
          />

          {/* Zone verte (arc de succès) avec glow visible et pulsation subtile */}
          <path
            d={`M ${cfg.radius + 40 + Math.cos((zoneStartDeg - 90) * Math.PI / 180) * cfg.radius} ${cfg.radius + 40 + Math.sin((zoneStartDeg - 90) * Math.PI / 180) * cfg.radius}
                A ${cfg.radius} ${cfg.radius} 0 ${zoneArcDeg > 180 ? 1 : 0} 1 
                ${cfg.radius + 40 + Math.cos((zoneStartDeg + zoneArcDeg - 90) * Math.PI / 180) * cfg.radius} ${cfg.radius + 40 + Math.sin((zoneStartDeg + zoneArcDeg - 90) * Math.PI / 180) * cfg.radius}`}
            fill="none"
            stroke={getCircleColor()}
            strokeWidth="20"
            className="drop-shadow-lg animate-pulse-zone"
            style={{
              filter: `drop-shadow(0 0 25px ${getCircleColor()}) drop-shadow(0 0 50px ${getCircleColor()})`,
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

          {/* Trail dynamique de la bille */}
          {gameState.gameStatus === 'running' && (
            <>
              {/* Trail principal */}
              <g transform={`translate(${cfg.radius + 40}, ${cfg.radius + 40}) rotate(${(gameState.ballAngle * 180) / Math.PI - 90})`}>
                <rect
                  x={cfg.radius - 20}
                  y={-2}
                  width={25}
                  height={4}
                  fill="#FF4444"
                  className="opacity-40 animate-trail-fade"
                />
              </g>
              {/* Trail secondaire (retardé) */}
              <g transform={`translate(${cfg.radius + 40}, ${cfg.radius + 40}) rotate(${(gameState.ballAngle * 180) / Math.PI - 100})`}>
                <rect
                  x={cfg.radius - 15}
                  y={-1}
                  width={15}
                  height={2}
                  fill="#FF4444"
                  className="opacity-20 animate-trail-fade"
                />
              </g>
            </>
          )}

          {/* Effet de particules au succès */}
          {gameState.successParticles && (
            <g transform={`translate(${cfg.radius + 40 + ballX}, ${cfg.radius + 40 + ballY})`}>
              {[...Array(6)].map((_, i) => (
                <circle
                  key={i}
                  cx={Math.cos(i * Math.PI / 3) * 15}
                  cy={Math.sin(i * Math.PI / 3) * 15}
                  r={3}
                  fill={getCircleColor()}
                  className="animate-particle-burst"
                  style={{ animationDelay: `${i * 20}ms` }}
                />
              ))}
            </g>
          )}
        </svg>

        {/* Overlay des résultats - Seulement Game Over */}
        {gameState.showResult && gameState.lastResult === 'failure' && (
          <div className="absolute inset-0 flex items-center justify-center z-30">
            <div className="px-6 py-3 rounded-full text-white font-bold text-xl animate-scale-in bg-gradient-danger shadow-glow-danger">
              PARTIE TERMINÉE
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