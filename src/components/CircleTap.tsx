import React, { useEffect } from 'react';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useSound } from '@/hooks/useSound';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw, Volume2, VolumeX, ArrowLeft } from 'lucide-react';
import { THEMES } from '@/constants/themes';
import { ModeType } from '@/constants/modes';

interface CircleTapProps {
  theme: string;
  currentMode: ModeType;
  onBack?: () => void;
  customization?: {
    background: string;
    circle: string;
    effect: string;
  };
  onGameOver?: (score: number) => void;
}

export const CircleTap: React.FC<CircleTapProps> = ({ theme, customization, onBack, currentMode, onGameOver }) => {
  const { gameState, startGame, onTap, resetGame, cfg } = useGameLogic(currentMode);
  const { playClick, playSuccess, playFailure, toggleMute, isMuted } = useSound();

  // Resolve current theme definition for visuals (background, bar, success zone)
  const themeDef = THEMES.find((t) => t.id === theme) || THEMES[0];
  const zoneColor = themeDef.preview.successZone;
  const barColor = themeDef.preview.circle;
  const backgroundCss = themeDef.preview.background;

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

  // Notify parent on game over with final score
  useEffect(() => {
    if (gameState.gameStatus === 'gameover' && gameState.currentScore > 0) {
      onGameOver?.(gameState.currentScore);
    }
  }, [gameState.gameStatus, gameState.currentScore, onGameOver]);

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
  const zoneArcDeg = (gameState.zoneArc * 180) / Math.PI;

  // Couleur du cercle basée sur la personnalisation
  const getCircleColor = () => zoneColor;

  // Style de l'arrière-plan basé sur la palette sélectionnée
  const getBackgroundStyle = () => ({ background: backgroundCss });

  return (
    <div 
      className={`min-h-screen flex flex-col items-center justify-center p-4 ${theme}`}
      style={getBackgroundStyle()}
    >
      {/* Bouton retour au menu */}
      {onBack && (
        <Button
          onClick={onBack}
          variant="outline"
          className="absolute top-4 left-4 border-wheel-border hover:bg-button-hover z-10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Menu
        </Button>
      )}

      {/* HUD - Score en gros et best score */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="text-8xl font-bold text-primary mb-2 drop-shadow-lg">
          {gameState.currentScore}
        </div>
        <div className="text-text-secondary text-xl font-semibold">
          Meilleur: {gameState.bestScore}
        </div>
        <div className="text-text-muted text-sm mt-2">
          Coins: {gameState.coins} • Niveau: {gameState.level}
          {gameState.currentMode === 'survie_60s' && gameState.timeLeft && (
            <span className="ml-2 text-red-400 font-bold">⏱ {Math.ceil(gameState.timeLeft)}s</span>
          )}
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
          {/* Cercle de base avec glow */}
          <circle
            cx={cfg.radius + 40}
            cy={cfg.radius + 40}
            r={cfg.radius}
            fill="none"
            stroke={barColor}
            strokeWidth="12"
            className="opacity-90"
            style={{
              filter: `drop-shadow(0 0 5px ${barColor})`,
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
            className="drop-shadow-lg"
            style={{
              filter: `drop-shadow(0 0 25px ${getCircleColor()}) drop-shadow(0 0 50px ${getCircleColor()})`,
            }}
          />

          {/* Deuxième zone verte pour le mode survie */}
          {gameState.currentMode === 'survie_60s' && (
            <path
              d={`M ${cfg.radius + 40 + Math.cos((zoneStartDeg + 180 - 90) * Math.PI / 180) * cfg.radius} ${cfg.radius + 40 + Math.sin((zoneStartDeg + 180 - 90) * Math.PI / 180) * cfg.radius}
                  A ${cfg.radius} ${cfg.radius} 0 ${zoneArcDeg > 180 ? 1 : 0} 1 
                  ${cfg.radius + 40 + Math.cos((zoneStartDeg + 180 + zoneArcDeg - 90) * Math.PI / 180) * cfg.radius} ${cfg.radius + 40 + Math.sin((zoneStartDeg + 180 + zoneArcDeg - 90) * Math.PI / 180) * cfg.radius}`}
              fill="none"
              stroke={getCircleColor()}
              strokeWidth="20"
              className="drop-shadow-lg opacity-80"
              style={{
                filter: `drop-shadow(0 0 25px ${getCircleColor()}) drop-shadow(0 0 50px ${getCircleColor()})`,
              }}
            />
          )}

          {/* Bille - Barre rouge qui dépasse */}
          <g transform={`translate(${cfg.radius + 40}, ${cfg.radius + 40}) rotate(${(gameState.ballAngle * 180) / Math.PI - 90})`}>
            {/* Barre rouge principale qui dépasse */}
            <rect
              x={cfg.radius - 15}
              y={-3}
              width={30}
              height={6}
              fill={barColor}
              className="drop-shadow-lg"
              style={{
                filter: `drop-shadow(0 0 10px ${barColor}) drop-shadow(0 0 20px ${barColor})`,
              }}
            />
            
            {/* Centre de la bille pour l'animation */}
            <circle
              cx={cfg.radius}
              cy={0}
              r={8}
              fill={barColor}
              className=""
              style={{
                filter: `drop-shadow(0 0 8px ${barColor})`,
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
                  fill={barColor}
                  className="opacity-40"
                />
              </g>
              {/* Trail secondaire (retardé) */}
              <g transform={`translate(${cfg.radius + 40}, ${cfg.radius + 40}) rotate(${(gameState.ballAngle * 180) / Math.PI - 100})`}>
                <rect
                  x={cfg.radius - 15}
                  y={-1}
                  width={15}
                  height={2}
                  fill={barColor}
                  className="opacity-20"
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
                  className=""
                />
              ))}
            </g>
          )}
          {/* Chrono au centre pour le mode survie */}
          {gameState.currentMode === 'survie_60s' && gameState.timeLeft && (
            <text
              x={cfg.radius + 40}
              y={cfg.radius + 40}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="24"
              fontWeight="bold"
              className="drop-shadow-lg"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.8))',
              }}
            >
              {Math.ceil(gameState.timeLeft)}
            </text>
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
          Vitesse: {gameState.ballSpeed.toFixed(1)} rad/s • Zone: {Math.round((gameState.zoneArc * 180) / Math.PI)}°
        </p>
      </div>
    </div>
  );
};
