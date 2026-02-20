import React, { useEffect, useState, useMemo } from 'react';
import { useGameLogic } from '@/hooks/useGameLogic';
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
import { useRewardedAd } from '@/hooks/useRewardedAd';
import { useLanguage, translations } from '@/hooks/useLanguage';
import { Capacitor } from '@capacitor/core';
interface CircleTapProps {
  theme: string;
  currentMode: ModeType;
  onBack?: () => void;
  customization?: {
    background: string;
    circle: string;
    effect: string;
  };
  onGameOver?: (score: number, gameDuration: number) => void;
  selectedBoosts?: BoostType[];
  totalGamesPlayed?: number;
  isSoundMuted?: boolean;
  onToggleSound?: () => void;
  playClick?: () => void;
  playSuccess?: (comboCount?: number) => void;
  playFailure?: () => void;
  onBoostUsed?: () => void;
}

export const CircleTap: React.FC<CircleTapProps> = ({ 
  theme, 
  customization, 
  onBack, 
  currentMode, 
  onGameOver,
  selectedBoosts = [],
  totalGamesPlayed = 0,
  isSoundMuted = false,
  onToggleSound = () => {},
  playClick = () => {},
  playSuccess = () => {},
  playFailure = () => {},
  onBoostUsed = () => {}
}) => {
  const { gameState, startGame, onTap, resetGame, reviveGame, cfg } = useGameLogic(currentMode);
  const [showBoostMenu, setShowBoostMenu] = useState(false);
  const { inventory, getBoostCount } = useBoosts();
  const [currentTickets, setCurrentTickets] = useState(getTickets());
  const { showRewardedAd, isShowing, isReady, getCooldown } = useRewardedAd();
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const { toast } = useToast();
  const [reviveUsed, setReviveUsed] = useState(false);
  const { language } = useLanguage();
  const t = translations[language];

  // Mettre à jour le chrono chaque seconde
  useEffect(() => {
    const updateCooldown = () => {
      setCooldownRemaining(getCooldown());
    };

    // Mise à jour initiale
    updateCooldown();

    // Mettre à jour chaque seconde
    const interval = setInterval(updateCooldown, 1000);

    return () => clearInterval(interval);
  }, [getCooldown]);

  // Mettre à jour les tickets quand le gameState change
  useEffect(() => {
    setCurrentTickets(getTickets());
  }, [gameState.gameStatus]);

  // Réinitialiser le flag revive quand une nouvelle partie commence
  useEffect(() => {
    if (gameState.gameStatus === 'running') {
      setReviveUsed(false);
    }
  }, [gameState.gameStatus]);

  // Resolve current theme definition for visuals (background, bar, success zone)
  const themeDef = THEMES.find((t) => t.id === theme) || THEMES[0];
  const zoneColor = themeDef.preview.successZone;
  const barColor = themeDef.preview.circle;
  const backgroundCss = themeDef.preview.background;

  // Android a des problèmes de rendu avec les drop-shadow multiples sur SVG
  const isAndroid = useMemo(() => Capacitor.getPlatform() === 'android', []);
  
  // Filtres SVG adaptés à la plateforme (désactivés sur Android pour éviter les reflets)
  const getZoneFilter = (color: string) => {
    if (isAndroid) {
      return 'none'; // Aucun filtre sur Android = aucun reflet
    }
    return `drop-shadow(0 0 25px ${color}) drop-shadow(0 0 50px ${color})`;
  };
  
  const getBarFilter = (color: string) => {
    if (isAndroid) {
      return 'none'; // Aucun filtre sur Android
    }
    return `drop-shadow(0 0 10px ${color}) drop-shadow(0 0 20px ${color})`;
  };

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

  // Notify parent on game over with final score and game duration
  useEffect(() => {
    if (gameState.gameStatus === 'gameover' && gameState.currentScore > 0) {
      const gameDuration = gameState.gameStartTime > 0 
        ? (Date.now() - gameState.gameStartTime) / 1000 
        : 0;
      onGameOver?.(gameState.currentScore, gameDuration);
    }
  }, [gameState.gameStatus, gameState.currentScore, gameState.gameStartTime, onGameOver]);

  const handleTap = () => {
    playClick();
    if (gameState.gameStatus === 'idle') {
      // Mode expert : vérifier les tickets avant de démarrer
      if (currentMode === ModeID.MEMOIRE_EXPERT && currentTickets <= 0) {
        toast({
          title: t.noTicket,
          description: t.noTicketDesc,
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
  
  const handleRevive = async () => {
    if (reviveUsed) {
      toast({
        title: t.reviveUsed,
        description: t.reviveUsedDesc,
        variant: 'destructive',
      });
      return;
    }

    const success = await showRewardedAd('revive');
    
    if (success) {
      toast({
        title: t.reviveActivated,
        description: t.reviveActivatedDesc,
      });
      setReviveUsed(true);
      reviveGame();
    }
  };

  const handleBoostMenuOpen = () => {
    setShowBoostMenu(true);
  };

  const handleBoostMenuClose = () => {
    setShowBoostMenu(false);
  };

  const handleRestartWithBoosts = (boosts: BoostType[]) => {
    setShowBoostMenu(false);
    
    // Notifier la quête "utiliser un boost" si des boosts sont sélectionnés
    if (boosts.length > 0) {
      onBoostUsed();
    }
    
    if (gameState.gameStatus === 'gameover') {
      resetGame();
      startGame(boosts);
    } else {
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

  // Gestionnaire de tap sur l'écran entier (hors boutons)
  const handleScreenTap = (e: React.MouseEvent | React.TouchEvent) => {
    // Ne pas déclencher si on clique sur un bouton ou élément interactif
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]') || target.closest('a')) {
      return;
    }
    handleTap();
  };

  return (
    <div 
      className={`circle-tap-game min-h-screen flex flex-col items-center justify-center p-4 ${theme}`}
      style={{ ...getBackgroundStyle(), cursor: gameState.gameStatus === 'running' ? 'pointer' : 'default' }}
      onClick={handleScreenTap}
      onTouchEnd={(e) => {
        // Pour mobile, empêcher le double-tap zoom et gérer le tap
        if (gameState.gameStatus === 'running') {
          e.preventDefault();
          handleScreenTap(e);
        }
      }}
    >
      {/* Bouton retour au menu - visible uniquement hors partie */}
      {onBack && (gameState.gameStatus === 'idle' || gameState.gameStatus === 'gameover') && (
        <Button
          onClick={onBack}
          variant="outline"
          className="absolute top-12 left-4 border-wheel-border hover:bg-button-hover z-10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.backToMenu}
        </Button>
      )}

      {/* HUD - Score en gros et best score */}
      <div className="text-center mb-8 animate-fade-in mt-16">
        <div className="text-6xl font-bold text-primary mb-2 drop-shadow-lg">
          {gameState.currentScore}
        </div>
        <div className="text-text-secondary text-lg font-semibold">
          {t.bestScore}: {gameState.bestScore}
        </div>
        <div className="text-text-muted text-sm mt-2">
          {t.coins}: {gameState.coins} • {t.level}: {gameState.level}
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
      <div className="game-circle relative mb-8">
        {/* Cercle principal (anneau) */}
        <svg
          width={cfg.radius * 2 + 80}
          height={cfg.radius * 2 + 80}
          className={`${isAndroid ? '' : 'drop-shadow-2xl'} max-w-full h-auto`}
          style={{ cursor: 'inherit' }}
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
              filter: isAndroid ? 'none' : `drop-shadow(0 0 5px ${barColor})`,
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
              className={`${isAndroid ? '' : 'drop-shadow-lg'} ${gameState.currentMode === 'memoire_expert' && !gameState.memoryZoneVisible ? 'opacity-0' : ''}`}
              style={{
                filter: getZoneFilter(getCircleColor()),
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
              className={`${isAndroid ? '' : 'drop-shadow-lg'} opacity-80`}
              style={{
                filter: getZoneFilter(getCircleColor()),
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
                    className={isAndroid ? '' : 'drop-shadow-lg'}
                    style={{
                      filter: getZoneFilter(getCircleColor()),
                      opacity,
                    }}
                  />
                );
              })}
            </>
          )}


          {/* Curseur - Barre rouge qui tourne */}
          <g transform={`translate(${cfg.radius + 40}, ${cfg.radius + 40}) rotate(${(gameState.ballAngle * 180) / Math.PI - 90})`}>
            <rect
              x={cfg.radius - 15}
              y={-3}
              width={30}
              height={6}
              fill={barColor}
              rx={3}
              className={isAndroid ? '' : 'drop-shadow-lg'}
              style={{
                filter: getBarFilter(barColor),
              }}
            />
          </g>

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
              {t.gameOver}
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
                  <span className="text-text-muted text-sm">{currentTickets > 1 ? t.tickets : t.ticket}</span>
                </div>
              ) : (
                <Button
                  onClick={handleBoostMenuOpen}
                  variant="outline"
                  className="relative border-primary/40 bg-primary/5 hover:bg-primary/15 hover:border-primary/60 hover:scale-105 transition-all duration-300 shadow-[0_0_8px_hsl(var(--primary)/0.15)]"
                >
                  <span className="absolute inset-0 rounded-md bg-gradient-to-r from-primary/10 via-transparent to-primary/10 pointer-events-none" />
                  <Zap className="w-5 h-5 mr-2 text-primary" />
                  {t.boosts}
                </Button>
              )}
              {gameState.gameStatus === 'gameover' && (
                <Button
                  onClick={handleRevive}
                  variant="outline"
                  className="border-wheel-border hover:bg-button-hover hover:scale-105 transition-all duration-300 text-sm"
                  disabled={!isReady() || isShowing || cooldownRemaining > 0 || reviveUsed}
                >
                  <Video className="w-4 h-4 mr-2" />
                  {reviveUsed ? t.reviveUsed : t.reviveByAd}
                  {cooldownRemaining > 0 && !reviveUsed && (
                    <span className="ml-1 text-xs">({cooldownRemaining}s)</span>
                  )}
                </Button>
              )}
            </div>
            <div 
              className="text-2xl font-bold text-primary mb-2 cursor-pointer select-none animate-pulse"
              onClick={handleTap}
            >
              🎯 {t.tapOnScreen}
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
          onClick={onToggleSound}
          variant="outline"
          size="lg"
          className="border-wheel-border hover:bg-button-hover hover:scale-105 transition-all duration-300"
        >
          {isSoundMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
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
            {t.trapWarning}
          </p>
        )}
        <p className="text-sm">
          {gameState.gameStatus === 'running' 
            ? gameState.currentMode === 'zone_traitresse'
              ? t.avoidTrap
              : t.tapInGreenZone
            : gameState.gameStatus === 'idle'
            ? t.tapToStartGame
            : ''
          }
        </p>
        <p className="text-xs mt-2">
          {t.speedLabel}: {gameState.ballSpeed.toFixed(1)} rad/s • {t.zoneLabel}: {Math.round((gameState.zoneArc * 180) / Math.PI)}°
        </p>
      </div>
    </div>
  );
};
