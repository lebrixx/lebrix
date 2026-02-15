import React, { useState, useCallback, useEffect, useRef } from 'react';
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

const MODE_COLORS: Record<string, string> = {
  [ModeID.CLASSIC]: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/40',
  [ModeID.ARC_CHANGEANT]: 'from-blue-500/20 to-blue-600/10 border-blue-500/40',
  [ModeID.SURVIE_60S]: 'from-red-500/20 to-red-600/10 border-red-500/40',
  [ModeID.ZONE_MOBILE]: 'from-purple-500/20 to-purple-600/10 border-purple-500/40',
  [ModeID.ZONE_TRAITRESSE]: 'from-amber-500/20 to-amber-600/10 border-amber-500/40',
  [ModeID.MEMOIRE_EXPERT]: 'from-pink-500/20 to-pink-600/10 border-pink-500/40',
};

const MODE_TEXT_COLORS: Record<string, string> = {
  [ModeID.CLASSIC]: 'text-emerald-400',
  [ModeID.ARC_CHANGEANT]: 'text-blue-400',
  [ModeID.SURVIE_60S]: 'text-red-400',
  [ModeID.ZONE_MOBILE]: 'text-purple-400',
  [ModeID.ZONE_TRAITRESSE]: 'text-amber-400',
  [ModeID.MEMOIRE_EXPERT]: 'text-pink-400',
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
  
  // Extended reel: repeat modes many times for smooth scrolling
  const reelItems = React.useMemo(() => {
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

  const ITEM_HEIGHT = 72; // px per slot item

  const spin = useCallback(() => {
    if (isSpinning || !canSpin || eligibleModes.length === 0) return;
    
    setIsSpinning(true);
    setShowResult(false);
    setResult(null);
    
    // Pick random winner
    const winnerIndex = Math.floor(Math.random() * eligibleModes.length);
    const winner = eligibleModes[winnerIndex];
    
    // Target position: land on winner somewhere in the middle of the reel
    const targetReelIndex = 30 + winnerIndex; // land in the later part of reel
    const targetOffset = targetReelIndex * ITEM_HEIGHT;
    
    const SPIN_DURATION = 4000; // 4 seconds
    startTimeRef.current = performance.now();
    
    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / SPIN_DURATION, 1);
      
      // Ease out cubic for slot machine feel
      const eased = 1 - Math.pow(1 - progress, 3);
      
      setScrollOffset(eased * targetOffset);
      
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Animation done
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
      <DialogContent className="bg-button-bg border-wheel-border max-w-sm overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Star className="w-5 h-5 text-secondary" />
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Bonus Quotidien x2
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {/* Description */}
          <p className="text-text-muted text-sm text-center">
            Lance la machine pour doubler tes coins dans un mode pendant 24h !
          </p>

          {/* Slot Machine Window */}
          <div className="relative w-full max-w-[250px]">
            {/* Machine frame */}
            <div className="relative border-2 border-primary/40 rounded-xl bg-background/80 overflow-hidden"
              style={{ height: `${ITEM_HEIGHT * 3}px` }}
            >
              {/* Highlight center row */}
              <div 
                className="absolute left-0 right-0 z-10 border-y-2 border-secondary/60 bg-secondary/10 pointer-events-none"
                style={{ top: ITEM_HEIGHT, height: ITEM_HEIGHT }}
              />
              
              {/* Gradient overlays for depth */}
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background/90 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/90 to-transparent z-10 pointer-events-none" />
              
              {/* Scrolling reel */}
              <div 
                className="absolute left-0 right-0"
                style={{ 
                  transform: `translateY(${ITEM_HEIGHT - scrollOffset}px)`,
                }}
              >
                {reelItems.map((mode, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-4 border-b border-wheel-border/30`}
                    style={{ height: ITEM_HEIGHT }}
                  >
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${MODE_COLORS[mode] || ''} border`}>
                      {getModeIcon(mode, 'w-6 h-6')}
                    </div>
                    <span className={`font-bold text-sm ${MODE_TEXT_COLORS[mode] || 'text-text-primary'}`}>
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
                <Sparkles className="w-5 h-5 text-secondary animate-pulse" />
                <span className="text-secondary font-bold text-lg">x2 COINS</span>
                <Sparkles className="w-5 h-5 text-secondary animate-pulse" />
              </div>
              <div className="flex items-center justify-center gap-2">
                {getModeIcon(result, 'w-5 h-5')}
                <span className={`font-bold ${MODE_TEXT_COLORS[result]}`}>
                  {cfgModes[result].name}
                </span>
              </div>
              <Badge variant="outline" className="border-secondary text-secondary text-xs">
                Actif jusqu'à minuit
              </Badge>
            </div>
          )}

          {/* Already active message */}
          {!canSpin && !showResult && (
            <div className="text-center space-y-1">
              <p className="text-text-muted text-sm">Bonus déjà activé aujourd'hui !</p>
              {result && (
                <Badge variant="outline" className="border-secondary text-secondary">
                  <Star className="w-3 h-3 mr-1" />
                  {cfgModes[result].name} - x2
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
                className="bg-gradient-primary hover:scale-105 transition-all duration-300 shadow-glow-primary"
              >
                {isSpinning ? (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                    Tirage en cours...
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4 mr-2" />
                    Lancer la Machine !
                  </>
                )}
              </Button>
            ) : (
              <Button disabled variant="outline" className="border-wheel-border text-text-muted">
                Reviens demain !
              </Button>
            )}

            <Button
              onClick={onClose}
              disabled={isSpinning}
              variant="ghost"
              className="text-text-muted hover:text-text-primary"
            >
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
