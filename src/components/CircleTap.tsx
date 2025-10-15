import React, { useEffect, useState } from 'react';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useSound } from '@/hooks/useSound';
import { useBoosts } from '@/hooks/useBoosts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, RotateCcw, Volume2, VolumeX, ArrowLeft, Video, Zap, Ticket } from 'lucide-react';
import { THEMES } from '@/constants/themes';
import { ModeType } from '@/constants/modes';
import { BOOSTS, BoostType } from '@/types/boosts';
import { PostGameBoostMenu } from './PostGameBoostMenu';
import { getTickets } from '@/utils/ticketSystem';
import { ModeID } from '@/constants/modes';
import { useToast } from '@/hooks/use-toast';

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
  selectedBoosts?: BoostType[];
  totalGamesPlayed?: number;
}

export const CircleTap: React.FC<CircleTapProps> = ({ 
  theme, 
  customization, 
  onBack, 
  currentMode, 
  onGameOver,
  selectedBoosts = [],
  totalGamesPlayed = 0 
}) => {
  const { gameState, startGame, onTap, resetGame, reviveGame, cfg } = useGameLogic(currentMode);
  const { playClick, playSuccess, playFailure, toggleMute, isMuted } = useSound();
  const [showBoostMenu, setShowBoostMenu] = useState(false);
  const { inventory, getBoostCount } = useBoosts();
  const [currentTickets, setCurrentTickets] = useState(getTickets());
  const { toast } = useToast();
  
  // Mettre à jour les tickets quand le gameState change
  useEffect(() => {
    setCurrentTickets(getTickets());
  }, [gameState.gameStatus]);

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
        if (gameState.gameStatus === 'idle') {
          startGame([]);
        } else {
          onTap();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onTap, gameState.gameStatus, startGame]);

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
    if (gameState.gameStatus === 'idle') {
      // Mode expert : vérifier les tickets avant de démarrer
      if (currentMode === ModeID.MEMOIRE_EXPERT && currentTickets <= 0) {
        toast({
          title: "Pas de ticket !",
          description: "Achète des tickets dans la boutique pour jouer au mode Expert.",
          variant: "destructive",
        });
        return;
      }
      startGame([]);
    } else {
      onTap();
    }
  };

  const handleReset = () => {
    playClick();
    resetGame();
  };
  
  const handleRevive = () => {
    // TODO: Intégrer AdMob ici
    // Pour l'instant, on fait juste revive sans pub
    reviveGame();
  };

  const handleBoostMenuOpen = () => {
    setShowBoostMenu(true);
  };

  const handleBoostMenuClose = () => {
    setShowBoostMenu(false);
  };

  const handleRestartWithBoosts = (boosts: BoostType[]) => {
    setShowBoostMenu(false);
    
    // Mode expert : vérifier les tickets avant de démarrer
    if (currentMode === ModeID.MEMOIRE_EXPERT && currentTickets <= 0) {
      toast({
        title: "Pas de ticket !",
        description: "Achète des tickets dans la boutique pour jouer au mode Expert.",
        variant: "destructive",
      });
      return;
    }
    
    if (gameState.gameStatus === 'gameover') {
      resetGame();
      // Petit délai pour laisser l'animation de reset se faire
      setTimeout(() => startGame(boosts), 100);
    } else {
      // En idle, on démarre directement
      startGame(boosts);
    }
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
          className="absolute top-32 left-4 border-wheel-border hover:bg-button-hover z-10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Menu
        </Button>
      )}

      {/* HUD - Score en gros et best score */}
      <div className="text-center mb-8 animate-fade-in mt-16">
        <div className="text-6xl font-bold text-primary mb-2 drop-shadow-lg">
          {gameState.currentScore}
        </div>
        <div className="text-text-secondary text-lg font-semibold">
          Meilleur: {gameState.bestScore}
        </div>
        <div className="text-text-muted text-sm mt-2">
          Coins: {gameState.coins} • Niveau: {gameState.level}
          {gameState.currentMode === 'survie_60s' && gameState.timeLeft && (
            <span className="ml-2 text-red-400 font-bold">⏱ {Math.ceil(gameState.timeLeft)}s</span>
          )}
        </div>
        
        
        {/* Boosts actifs */}
        {gameState.activeBoosts.length > 0 && (
          <div className="flex gap-2 justify-center mt-3">
            {gameState.activeBoosts.map(boostId => {
              const boost = BOOSTS[boostId];
              return (
                <Badge 
                  key={boostId}
                  variant="secondary"
                  className="bg-primary/20 text-primary border border-primary/50 px-3 py-1"
                >
                  {boost.icon} {boost.name}
                </Badge>
              );
            })}
          </div>
        )}
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

          {/* Zone verte (arc de succès) - Seulement pour les modes non-traîtresse */}
          {gameState.currentMode !== 'zone_traitresse' && (
            <path
              d={`M ${cfg.radius + 40 + Math.cos((zoneStartDeg - 90) * Math.PI / 180) * cfg.radius} ${cfg.radius + 40 + Math.sin((zoneStartDeg - 90) * Math.PI / 180) * cfg.radius}
                  A ${cfg.radius} ${cfg.radius} 0 ${zoneArcDeg > 180 ? 1 : 0} 1 
                  ${cfg.radius + 40 + Math.cos((zoneStartDeg + zoneArcDeg - 90) * Math.PI / 180) * cfg.radius} ${cfg.radius + 40 + Math.sin((zoneStartDeg + zoneArcDeg - 90) * Math.PI / 180) * cfg.radius}`}
              fill="none"
              stroke={getCircleColor()}
              strokeWidth="20"
              className={`drop-shadow-lg ${gameState.currentMode === 'memoire_expert' && !gameState.memoryZoneVisible ? 'opacity-0' : ''}`}
              style={{
                filter: `drop-shadow(0 0 25px ${getCircleColor()}) drop-shadow(0 0 50px ${getCircleColor()})`,
              }}
            />
          )}

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

          {/* Zones multiples pour le mode zone traîtresse */}
          {gameState.currentMode === 'zone_traitresse' && gameState.multipleZones && (
            <>
              {gameState.multipleZones.map((zone, index) => {
                // Convertir en degrés pour le SVG
                const startDeg = (zone.start * 180) / Math.PI;
                const arcDeg = (zone.arc * 180) / Math.PI;
                
                // La zone piégée est légèrement plus sombre
                const isTrap = index === gameState.trapZoneIndex;
                const opacity = isTrap ? 0.7 : 0.9;
                
                // Calculer les coordonnées de début et fin de l'arc
                const startX = cfg.radius + 40 + Math.cos((startDeg - 90) * Math.PI / 180) * cfg.radius;
                const startY = cfg.radius + 40 + Math.sin((startDeg - 90) * Math.PI / 180) * cfg.radius;
                const endX = cfg.radius + 40 + Math.cos((startDeg + arcDeg - 90) * Math.PI / 180) * cfg.radius;
                const endY = cfg.radius + 40 + Math.sin((startDeg + arcDeg - 90) * Math.PI / 180) * cfg.radius;
                
                // Large arc flag (1 si l'arc est > 180°, sinon 0)
                const largeArcFlag = arcDeg > 180 ? 1 : 0;
                
                return (
                  <path
                    key={index}
                    d={`M ${startX} ${startY} A ${cfg.radius} ${cfg.radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`}
                    fill="none"
                    stroke={getCircleColor()}
                    strokeWidth="20"
                    className="drop-shadow-lg"
                    style={{
                      filter: `drop-shadow(0 0 25px ${getCircleColor()}) drop-shadow(0 0 50px ${getCircleColor()})`,
                      opacity,
                    }}
                  />
                );
              })}
            </>
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
          <div className="text-center w-full">
            <div className="flex flex-col gap-3 mb-3">
              {/* En mode expert, afficher les tickets au lieu du bouton boost */}
              {currentMode === ModeID.MEMOIRE_EXPERT ? (
                <div className="flex items-center justify-center gap-2 bg-button-bg border-2 border-primary rounded-lg px-6 py-3">
                  <Ticket className="w-6 h-6 text-primary" />
                  <span className="text-primary font-bold text-xl">{currentTickets}</span>
                  <span className="text-text-muted text-sm">ticket{currentTickets > 1 ? 's' : ''}</span>
                </div>
              ) : (
                <Button
                  onClick={handleBoostMenuOpen}
                  variant="outline"
                  className="border-wheel-border hover:bg-button-hover hover:scale-105 transition-all duration-300"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Boosts
                </Button>
              )}
              {gameState.gameStatus === 'gameover' && (
                <Button
                  onClick={handleRevive}
                  variant="outline"
                  className="border-wheel-border hover:bg-button-hover hover:scale-105 transition-all duration-300 text-sm"
                  disabled={true} // Désactivé pour l'instant (pas de pub)
                >
                  <Video className="w-4 h-4 mr-2" />
                  Revivre via pub
                </Button>
              )}
            </div>
            <div 
              className="text-2xl font-bold text-primary mb-2 cursor-pointer select-none animate-pulse"
              onClick={handleTap}
            >
              🎯 Tape sur l'écran
            </div>
          </div>
        ) : null}

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

      {/* Post-Game Boost Menu */}
      {showBoostMenu && (
        <PostGameBoostMenu
          onStartGame={handleRestartWithBoosts}
          onCancel={handleBoostMenuClose}
          currentMode={currentMode}
        />
      )}

      {/* Instructions */}
      <div className="text-center mt-8 text-text-muted animate-fade-in">
        {gameState.currentMode === 'zone_traitresse' && gameState.gameStatus === 'idle' && (
          <p className="text-sm font-bold text-red-400 mb-2 animate-pulse">
            ⚠️ Attention : une des zones est un piège. Choisis bien…
          </p>
        )}
        <p className="text-sm">
          {gameState.gameStatus === 'running' 
            ? gameState.currentMode === 'zone_traitresse'
              ? 'Évite la zone piégée !'
              : 'Tapez quand la barre rouge est dans la zone verte!'
            : gameState.gameStatus === 'idle'
            ? 'Tapez sur l\'écran pour commencer ou appuyez sur ESPACE/ENTRÉE'
            : ''
          }
        </p>
        <p className="text-xs mt-2">
          Vitesse: {gameState.ballSpeed.toFixed(1)} rad/s • Zone: {Math.round((gameState.zoneArc * 180) / Math.PI)}°
        </p>
      </div>
    </div>
  );
};
