import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tv, RotateCcw, Gift, Coins, Ticket, Diamond } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage, translations } from '@/hooks/useLanguage';
import { useRewardedAd } from '@/hooks/useRewardedAd';
import { useBoosts } from '@/hooks/useBoosts';
import { addTickets } from '@/utils/ticketSystem';
import { addDiamonds } from '@/utils/seasonPass';
import { scheduleWheelNotification } from '@/utils/notifications';
import { 
  WHEEL_SEGMENTS, 
  canSpinFree, 
  markFreeSpinUsed, 
  spinWheel, 
  calculateRotationAngle,
  WheelSegment 
} from '@/utils/luckyWheel';

interface LuckyWheelProps {
  isOpen: boolean;
  onClose: () => void;
  onCoinsWon: (amount: number) => void;
}

export const LuckyWheel: React.FC<LuckyWheelProps> = ({ isOpen, onClose, onCoinsWon }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const { toast } = useToast();
  const { showRewardedAd, isReady } = useRewardedAd();
  const { addBoost } = useBoosts();
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [canFreeSpin, setCanFreeSpin] = useState(canSpinFree());
  const [lastReward, setLastReward] = useState<WheelSegment | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  // Vérifier le tour gratuit quand le dialog s'ouvre
  useEffect(() => {
    if (isOpen) {
      setCanFreeSpin(canSpinFree());
      setShowResult(false);
      setLastReward(null);
    }
  }, [isOpen]);
  
  const giveReward = useCallback((segment: WheelSegment) => {
    const reward = segment.reward;
    console.log('[LuckyWheel] Giving reward:', reward);
    
    if (reward.type === 'coins') {
      onCoinsWon(reward.amount);
      toast({
        title: "🎉 " + (t.youWon || "Tu as gagné :"),
        description: `${reward.amount} ${t.coins}`,
      });
    } else if (reward.type === 'boost') {
      addBoost(reward.boostId);
      const boostNames: Record<string, string> = {
        shield: t.shield || 'Bouclier',
        bigger_zone: t.biggerZone || 'Zone +',
        start_20: t.start20 || 'Départ +20',
      };
      toast({
        title: "🎉 " + (t.youWon || "Tu as gagné :"),
        description: boostNames[reward.boostId] || 'Boost',
      });
    } else if (reward.type === 'tickets') {
      addTickets(reward.amount);
      toast({
        title: "🎉 " + (t.youWon || "Tu as gagné :"),
        description: `${reward.amount} ${t.tickets}`,
      });
    } else if (reward.type === 'diamonds') {
      addDiamonds(reward.amount);
      toast({
        title: "🎉 " + (t.youWon || "Tu as gagné :"),
        description: `${reward.amount} 💎`,
      });
    }
    
    setLastReward(segment);
    setShowResult(true);
  }, [onCoinsWon, addBoost, toast, t]);
  
  const handleSpin = useCallback(async (isFree: boolean) => {
    if (isSpinning) return;
    
    if (!isFree) {
      // Regarder une pub - utiliser 'ticket' comme type existant
      const rewarded = await showRewardedAd('ticket');
      if (!rewarded) {
        return;
      }
    }
    
    setIsSpinning(true);
    setShowResult(false);
    
    // Déterminer le résultat
    const { segmentIndex, segment } = spinWheel();
    const targetRotation = calculateRotationAngle(segmentIndex);
    
    // Appliquer la rotation
    setRotation(prev => prev + targetRotation);
    
    // Marquer le tour gratuit comme utilisé et programmer la notification pour demain
    if (isFree) {
      markFreeSpinUsed();
      setCanFreeSpin(false);
      // Programmer la notification pour quand la roue sera à nouveau disponible
      scheduleWheelNotification();
    }
    
    // Attendre la fin de l'animation (5 secondes)
    setTimeout(() => {
      setIsSpinning(false);
      giveReward(segment);
    }, 5200);
  }, [isSpinning, showRewardedAd, giveReward]);
  
  const getRewardText = (segment: WheelSegment): string => {
    const reward = segment.reward;
    if (reward.type === 'coins') {
      return `${reward.amount} ${t.coins}`;
    } else if (reward.type === 'boost') {
      const boostNames: Record<string, string> = {
        shield: t.shield,
        bigger_zone: t.biggerZone,
        start_20: t.start20,
      };
      return boostNames[reward.boostId] || 'Boost';
    } else if (reward.type === 'tickets') {
      return `${reward.amount} ${t.tickets}`;
    } else if (reward.type === 'diamonds') {
      return `${reward.amount} 💎`;
    }
    return '';
  };
  
  const segmentAngle = 360 / WHEEL_SEGMENTS.length;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSpinning && onClose()}>
      <DialogContent className="bg-button-bg border-wheel-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-primary text-center flex items-center justify-center gap-2">
            <Gift className="w-5 h-5 text-secondary" />
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              {t.luckyWheelTitle}
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4 py-4">
          {/* Roue */}
          <div className="relative w-64 h-64">
            {/* Pointeur */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20">
              <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-primary drop-shadow-lg" />
            </div>
            
            {/* Cercle extérieur décoratif */}
            <div className="absolute inset-0 rounded-full border-4 border-primary/30 shadow-glow-primary" />
            
            {/* Roue principale */}
            <div 
              className="absolute inset-2 rounded-full overflow-hidden"
              style={{ 
                transform: `rotate(${rotation}deg)`,
                transition: 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)',
              }}
            >
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {WHEEL_SEGMENTS.map((segment, index) => {
                  const startAngle = index * segmentAngle - 90;
                  const endAngle = startAngle + segmentAngle;
                  const startRad = (startAngle * Math.PI) / 180;
                  const endRad = (endAngle * Math.PI) / 180;
                  
                  const x1 = 100 + 100 * Math.cos(startRad);
                  const y1 = 100 + 100 * Math.sin(startRad);
                  const x2 = 100 + 100 * Math.cos(endRad);
                  const y2 = 100 + 100 * Math.sin(endRad);
                  
                  const largeArc = segmentAngle > 180 ? 1 : 0;
                  
                  const midAngle = (startAngle + segmentAngle / 2) * Math.PI / 180;
                  const textX = 100 + 60 * Math.cos(midAngle);
                  const textY = 100 + 60 * Math.sin(midAngle);
                  const textRotation = startAngle + segmentAngle / 2 + 90;
                  
                  return (
                    <g key={segment.id}>
                      <path
                        d={`M 100 100 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={segment.color}
                        stroke="hsl(var(--background))"
                        strokeWidth="1"
                        className={index % 2 === 0 ? 'opacity-90' : 'opacity-100'}
                      />
                      <text
                        x={textX}
                        y={textY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                        className="fill-white font-bold text-sm"
                        style={{ fontSize: segment.label.length > 2 ? '10px' : '16px' }}
                      >
                        {segment.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            
            {/* Centre de la roue */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-gradient-primary border-2 border-white/20 shadow-lg flex items-center justify-center">
                <Gift className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          {/* Résultat */}
          {showResult && lastReward && (
            <div className="animate-scale-in text-center">
              <p className="text-text-muted text-sm mb-1">{t.youWon}</p>
              <div className="flex items-center justify-center gap-2 text-xl font-bold text-secondary">
                {lastReward.reward.type === 'coins' && <Coins className="w-6 h-6" />}
                {lastReward.reward.type === 'tickets' && <Ticket className="w-6 h-6" />}
                {lastReward.reward.type === 'diamonds' && <Diamond className="w-6 h-6" />}
                <span>{getRewardText(lastReward)}</span>
              </div>
            </div>
          )}
          
          {/* Boutons */}
          <div className="flex flex-col gap-2 w-full">
            {canFreeSpin ? (
              <Button
                onClick={() => handleSpin(true)}
                disabled={isSpinning}
                className="bg-gradient-primary hover:scale-105 transition-all duration-300 shadow-glow-primary"
              >
                <RotateCcw className={`w-4 h-4 mr-2 ${isSpinning ? 'animate-spin' : ''}`} />
                {t.freeSpin}
              </Button>
            ) : (
              <Button
                onClick={() => handleSpin(false)}
                disabled={isSpinning || !isReady()}
                variant="outline"
                className="border-secondary text-secondary hover:bg-secondary/10"
              >
                <Tv className="w-4 h-4 mr-2" />
                {t.watchAdToSpin}
              </Button>
            )}
            
            <Button
              onClick={onClose}
              disabled={isSpinning}
              variant="ghost"
              className="text-text-muted hover:text-text-primary"
            >
              {t.close}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};