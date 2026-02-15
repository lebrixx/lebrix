import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, RotateCcw, Clock, AlertTriangle, Brain, Star, Sparkles } from 'lucide-react';
import { ModeType, ModeID, cfgModes } from '@/constants/modes';
import { canSpinSlotToday, activateDailyBonus, getActiveBonusMode, getEligibleModes } from '@/utils/dailyBonusMode';

interface SlotMachineProps {
  isOpen: boolean;
  onClose: () => void;
  unlockedModes: string[];
  onBonusActivated: (mode: ModeType) => void;
}

const getModeIcon = (modeId: ModeType, size = 'w-8 h-8') => {
  switch (modeId) {
    case ModeID.CLASSIC: return <Target className={size} />;
    case ModeID.ARC_CHANGEANT: return <RotateCcw className={size} />;
    case ModeID.SURVIE_60S: return <Clock className={size} />;
    case ModeID.ZONE_MOBILE: return <RotateCcw className={size} style={{ transform: 'rotate(90deg)' }} />;
    case ModeID.ZONE_TRAITRESSE: return <AlertTriangle className={size} />;
    case ModeID.MEMOIRE_EXPERT: return <Brain className={size} />;
    default: return <Target className={size} />;
  }
};

const MODE_ICON_COLORS: Record<string, string> = {
  [ModeID.CLASSIC]: 'text-success',
  [ModeID.ARC_CHANGEANT]: 'text-primary',
  [ModeID.SURVIE_60S]: 'text-danger',
  [ModeID.ZONE_MOBILE]: 'text-secondary',
  [ModeID.ZONE_TRAITRESSE]: 'text-secondary-glow',
  [ModeID.MEMOIRE_EXPERT]: 'text-primary-glow',
};

export const SlotMachine: React.FC<SlotMachineProps> = ({
  isOpen,
  onClose,
  unlockedModes,
  onBonusActivated,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [canSpin, setCanSpin] = useState(true);
  const [result, setResult] = useState<ModeType | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const animRef = useRef<number>();
  const startTimeRef = useRef(0);
  
  const eligibleModes = getEligibleModes(unlockedModes);
  
  const reelItems = useMemo(() => {
    const items: ModeType[] = [];
    for (let i = 0; i < 40; i++) {
      items.push(eligibleModes[i % eligibleModes.length]);
    }
    return items;
  }, [eligibleModes]);

  useEffect(() => {
    if (isOpen) {
      const active = getActiveBonusMode();
      setCanSpin(canSpinSlotToday());
      setResult(active);
      setShowResult(!!active);
      setScrollOffset(0);
    }
  }, [isOpen]);

  const ITEM_HEIGHT = 72;

  const spin = useCallback(() => {
    if (isSpinning || !canSpin || eligibleModes.length === 0) return;
    
    setIsSpinning(true);
    setShowResult(false);
    setResult(null);
    
    const winnerIndex = Math.floor(Math.random() * eligibleModes.length);
    const winner = eligibleModes[winnerIndex];
    const targetReelIndex = 30 + winnerIndex;
    const targetOffset = targetReelIndex * ITEM_HEIGHT;
    
    const SPIN_DURATION = 3500;
    startTimeRef.current = performance.now();
    
    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / SPIN_DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      
      setScrollOffset(eased * targetOffset);
      
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        setResult(winner);
        setShowResult(true);
        setCanSpin(false);
        activateDailyBonus(winner);
        onBonusActivated(winner);
      }
    };
    
    animRef.current = requestAnimationFrame(animate);
  }, [isSpinning, canSpin, eligibleModes, onBonusActivated]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSpinning && onClose()}>
      <DialogContent className="bg-game-dark border border-wheel-border/50 max-w-xs overflow-hidden rounded-2xl p-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-2">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold text-text-primary">
              Bonus Quotidien
            </DialogTitle>
          </DialogHeader>
          <p className="text-text-muted text-xs text-center mt-1">
            Lance la machine pour doubler tes coins dans un mode pendant 24h
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 px-6 pb-6">
          {/* Slot Machine Window */}
          <div className="relative w-full">
            {/* Machine frame */}
            <div 
              className="relative border border-wheel-border/40 rounded-xl bg-game-darker overflow-hidden"
              style={{ height: `${ITEM_HEIGHT * 3}px` }}
            >
              {/* Center row highlight */}
              <div 
                className="absolute left-0 right-0 z-10 pointer-events-none"
                style={{ top: ITEM_HEIGHT, height: ITEM_HEIGHT }}
              >
                <div className="absolute inset-0 border-y border-primary/30 bg-primary/5" />
                {/* Side arrows */}
                <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-4 bg-primary/40 rounded-r" />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-4 bg-primary/40 rounded-l" />
              </div>
              
              {/* Gradient overlays */}
              <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-game-darker to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-game-darker to-transparent z-10 pointer-events-none" />
              
              {/* Scrolling reel */}
              <div 
                className="absolute left-0 right-0"
                style={{ transform: `translateY(${ITEM_HEIGHT - scrollOffset}px)` }}
              >
                {reelItems.map((mode, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-5"
                    style={{ height: ITEM_HEIGHT }}
                  >
                    <div className={`${MODE_ICON_COLORS[mode] || 'text-primary'}`}>
                      {getModeIcon(mode, 'w-5 h-5')}
                    </div>
                    <span className="font-semibold text-sm text-text-primary">
                      {cfgModes[mode].name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Result */}
          {showResult && result && (
            <div className="animate-scale-in text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-secondary" />
                <span className="text-secondary font-bold">x2 COINS</span>
                <Sparkles className="w-4 h-4 text-secondary" />
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className={MODE_ICON_COLORS[result]}>
                  {getModeIcon(result, 'w-4 h-4')}
                </div>
                <span className="font-semibold text-sm text-text-primary">
                  {cfgModes[result].name}
                </span>
              </div>
              <Badge variant="outline" className="border-wheel-border text-text-muted text-xs">
                Actif jusqu'à minuit
              </Badge>
            </div>
          )}

          {/* Already active */}
          {!canSpin && !showResult && (
            <div className="text-center space-y-2">
              <p className="text-text-muted text-sm">Bonus déjà activé aujourd'hui</p>
              {result && (
                <Badge variant="outline" className="border-secondary/50 text-secondary text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  {cfgModes[result].name} — x2
                </Badge>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col gap-2 w-full">
            {canSpin ? (
              <Button
                onClick={spin}
                disabled={isSpinning}
                className="w-full bg-gradient-primary text-game-dark font-bold transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSpinning ? (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                    Tirage en cours…
                  </>
                ) : (
                  'Lancer le tirage'
                )}
              </Button>
            ) : (
              <Button disabled variant="outline" className="w-full border-wheel-border text-text-muted">
                Reviens demain
              </Button>
            )}

            <Button
              onClick={onClose}
              disabled={isSpinning}
              variant="ghost"
              size="sm"
              className="text-text-muted hover:text-text-primary text-xs"
            >
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
