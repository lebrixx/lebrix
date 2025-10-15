import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, RotateCcw, Target, AlertTriangle, Lock, ShoppingBag, Brain } from 'lucide-react';
import { cfgModes, ModeType, ModeID } from '@/constants/modes';

interface ModeSelectionProps {
  currentMode: ModeType;
  gameStatus: 'idle' | 'running' | 'gameover';
  bestScores: Record<string, number>;
  unlockedModes: string[];
  onSelectMode: (mode: ModeType) => void;
  onBack: () => void;
  onOpenShop: () => void;
}

const getModeIcon = (modeId: ModeType) => {
  switch (modeId) {
    case ModeID.CLASSIC:
      return <Target className="w-8 h-8" />;
    case ModeID.ARC_CHANGEANT:
      return <RotateCcw className="w-8 h-8" />;
    case ModeID.SURVIE_60S:
      return <Clock className="w-8 h-8" />;
    case ModeID.ZONE_MOBILE:
      return <RotateCcw className="w-8 h-8" style={{ transform: 'rotate(90deg)' }} />;
    case ModeID.ZONE_TRAITRESSE:
      return <AlertTriangle className="w-8 h-8" />;
    case ModeID.MEMOIRE_EXPERT:
      return <Brain className="w-8 h-8" />;
    default:
      return <Target className="w-8 h-8" />;
  }
};

export const ModeSelection: React.FC<ModeSelectionProps> = ({
  currentMode,
  gameStatus,
  bestScores,
  unlockedModes,
  onSelectMode,
  onBack,
  onOpenShop
}) => {
  const isGameRunning = gameStatus === 'running';

  return (
    <div className="min-h-screen bg-gradient-game flex flex-col items-center p-4 pt-12">
      {/* Header */}
      <div className="w-full max-w-4xl mb-8">
        <Button
          onClick={onBack}
          variant="outline"
          className="mb-6 border-wheel-border hover:bg-button-hover"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au Menu
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            SÉLECTION DU MODE
          </h1>
          <div className="flex items-center justify-center gap-2">
            <span className="text-text-secondary">Mode actuel:</span>
            <Badge variant="outline" className="border-primary text-primary">
              {cfgModes[currentMode].name}
            </Badge>
          </div>
        </div>
      </div>

      {/* Warning if game is running */}
      {isGameRunning && (
        <div className="w-full max-w-4xl mb-6">
          <Card className="bg-danger/10 border-danger p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-danger flex-shrink-0" />
              <div>
                <p className="text-danger font-medium">Partie en cours</p>
                <p className="text-text-muted text-sm">Termine ta partie actuelle pour changer de mode.</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Mode Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {Object.entries(cfgModes).map(([modeId, config]) => {
          const isCurrentMode = modeId === currentMode;
          const isLocked = !unlockedModes.includes(modeId);
          const canSelect = !isGameRunning && !isLocked;

          return (
            <Card
              key={modeId}
              className={`
                relative overflow-hidden border-2 transition-all duration-300
                ${isCurrentMode 
                  ? 'border-primary bg-primary/5 shadow-glow-primary' 
                  : isLocked
                    ? 'border-danger/50 bg-button-bg/50'
                    : 'border-wheel-border bg-button-bg hover:border-primary/50'
                }
                ${!isLocked && !isGameRunning ? 'hover:scale-105' : ''}
              `}
            >
              {/* Locked Badge */}
              {isLocked && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-danger/90 text-white border-danger">
                    <Lock className="w-3 h-3 mr-1" />
                    Verrouillé
                  </Badge>
                </div>
              )}
              <div className="p-6">
                {/* Mode Icon & Name */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`
                    p-3 rounded-full 
                    ${isCurrentMode ? 'bg-primary text-game-dark' : 'bg-wheel-segment text-primary'}
                  `}>
                    {getModeIcon(modeId as ModeType)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text-primary">
                      {config.name}
                    </h3>
                    {isCurrentMode && (
                      <Badge variant="secondary" className="mt-1">
                        Équipé
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-text-secondary mb-6 leading-relaxed">
                  {config.desc}
                </p>

                {/* Mode Features */}
                <div className="space-y-2 mb-6">
                  {config.survival && (
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                      <Clock className="w-4 h-4" />
                      <span>Durée: {config.survivalTime}s</span>
                    </div>
                  )}
                  {config.variableArc && (
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                      <RotateCcw className="w-4 h-4" />
                      <span>Arc variable</span>
                    </div>
                  )}
                  {config.keepMovingZone && (
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                      <Target className="w-4 h-4" />
                      <span>Zone mobile</span>
                    </div>
                  )}
                </div>

                {/* Best Score */}
                <div className="mb-4 p-3 bg-wheel-segment/20 rounded-lg border border-wheel-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">Meilleur Score:</span>
                    <Badge variant="outline" className="border-primary text-primary">
                      {bestScores[modeId] || 0}
                    </Badge>
                  </div>
                </div>

                {/* Select Button */}
                {isLocked ? (
                  <Button
                    onClick={onOpenShop}
                    className="w-full bg-danger hover:bg-danger/90 transition-all"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Acheter en Boutique
                  </Button>
                ) : (
                  <Button
                    onClick={() => onSelectMode(modeId as ModeType)}
                    disabled={!canSelect}
                    className={`
                      w-full transition-all duration-300
                      ${isCurrentMode 
                        ? 'bg-primary hover:bg-primary/90' 
                        : 'bg-gradient-primary hover:scale-105'
                      }
                    `}
                  >
                    {isCurrentMode ? 'Jouer maintenant' : 'Choisir ce Mode'}
                  </Button>
                )}
              </div>

              {/* Current Mode Indicator */}
              {isCurrentMode && (
                <div className="absolute top-4 right-4">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center">
        <p className="text-text-muted text-sm">
          Les meilleurs scores sont sauvegardés séparément pour chaque mode
        </p>
      </div>
    </div>
  );
};