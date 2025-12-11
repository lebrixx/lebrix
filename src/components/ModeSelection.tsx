import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Clock, RotateCcw, Target, AlertTriangle, Lock, ShoppingBag, Brain, Play, Zap } from 'lucide-react';
import { cfgModes, ModeType, ModeID } from '@/constants/modes';
import { useLanguage, translations } from '@/hooks/useLanguage';
import { BOOSTS, BoostType } from '@/types/boosts';
import { useBoosts } from '@/hooks/useBoosts';

interface ModeSelectionProps {
  currentMode: ModeType;
  gameStatus: 'idle' | 'running' | 'gameover';
  bestScores: Record<string, number>;
  unlockedModes: string[];
  onSelectMode: (mode: ModeType, selectedBoosts?: BoostType[]) => void;
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
  const [showBoostDialog, setShowBoostDialog] = useState(false);
  const [selectedModeForGame, setSelectedModeForGame] = useState<ModeType | null>(null);
  const [selectedBoosts, setSelectedBoosts] = useState<BoostType[]>([]);
  const { getBoostCount } = useBoosts();
  const { language } = useLanguage();
  const t = translations[language];

  // Fonction pour vérifier si un boost est disponible pour ce mode
  const isBoostAvailable = (boostId: BoostType, mode: ModeType): boolean => {
    if (mode === ModeID.MEMOIRE_EXPERT) return false;
    if (boostId === 'bigger_zone' && (mode === 'zone_traitresse' || mode === 'survie_60s')) return false;
    return true;
  };

  const availableBoosts = Object.values(BOOSTS).filter(boost => getBoostCount(boost.id) > 0);

  const toggleBoost = (boostId: BoostType) => {
    if (!selectedModeForGame || !isBoostAvailable(boostId, selectedModeForGame)) return;
    setSelectedBoosts(prev => 
      prev.includes(boostId) ? prev.filter(id => id !== boostId) : [...prev, boostId]
    );
  };

  const handlePlayClick = (modeId: ModeType) => {
    setSelectedModeForGame(modeId);
    setSelectedBoosts([]);
    setShowBoostDialog(true);
  };

  const handleStartGame = () => {
    if (selectedModeForGame) {
      onSelectMode(selectedModeForGame, selectedBoosts);
    }
    setShowBoostDialog(false);
  };

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
                    onClick={() => handlePlayClick(modeId as ModeType)}
                    disabled={!canSelect}
                    className={`
                      w-full transition-all duration-300
                      ${isCurrentMode 
                        ? 'bg-primary hover:bg-primary/90' 
                        : 'bg-gradient-primary hover:scale-105'
                      }
                    `}
                  >
                    <Zap className="w-4 h-4 mr-2" />
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

      {/* Boost Selection Dialog */}
      <Dialog open={showBoostDialog} onOpenChange={setShowBoostDialog}>
        <DialogContent className="bg-button-bg border-wheel-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              {t.selectBoosts}
            </DialogTitle>
          </DialogHeader>

          {availableBoosts.length === 0 || (selectedModeForGame === ModeID.MEMOIRE_EXPERT) ? (
            <div className="text-center py-4">
              <p className="text-text-secondary mb-4">
                {selectedModeForGame === ModeID.MEMOIRE_EXPERT 
                  ? t.unavailableMode || "Boosts non disponibles dans ce mode"
                  : t.noBoostsAvailable}
              </p>
              <Button
                onClick={handleStartGame}
                className="bg-gradient-primary hover:scale-105 transition-all duration-300"
              >
                <Play className="w-4 h-4 mr-2" />
                {t.startWithoutBoost}
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableBoosts.map(boost => {
                  const isSelected = selectedBoosts.includes(boost.id);
                  const count = getBoostCount(boost.id);
                  const isLocked = selectedModeForGame ? !isBoostAvailable(boost.id, selectedModeForGame) : false;
                  
                  return (
                    <Card
                      key={boost.id}
                      onClick={() => toggleBoost(boost.id)}
                      className={`
                        p-3 transition-all duration-300 relative
                        ${isLocked 
                          ? 'opacity-50 cursor-not-allowed' 
                          : isSelected 
                            ? 'bg-primary/20 border-primary border-2 cursor-pointer' 
                            : 'bg-wheel-segment/20 border-wheel-border hover:border-primary/50 cursor-pointer'
                        }
                      `}
                    >
                      {isLocked && (
                        <div className="absolute top-2 right-2 bg-red-500/80 rounded-full p-1">
                          <Lock className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{boost.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-text-primary font-bold text-sm">{boost.name}</h3>
                            <Badge variant="secondary" className="text-xs">x{count}</Badge>
                          </div>
                          <p className="text-text-secondary text-xs">{boost.description}</p>
                          {isLocked && <p className="text-xs text-red-400 mt-1">{t.unavailableMode}</p>}
                        </div>
                        {isSelected && !isLocked && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-game-dark" />
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>

              <Button
                onClick={handleStartGame}
                className="w-full bg-gradient-primary hover:scale-105 transition-all duration-300 py-5 text-lg font-bold mt-4"
              >
                <Play className="w-5 h-5 mr-2" />
                {selectedBoosts.length > 0 ? `${t.startGameLabel} (${selectedBoosts.length} boost${selectedBoosts.length > 1 ? 's' : ''})` : t.startGameLabel}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};