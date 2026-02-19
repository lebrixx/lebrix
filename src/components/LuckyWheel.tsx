import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tv, RotateCcw, Gift, Coins, Ticket, Diamond, Sparkles } from 'lucide-react';
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
      const rewarded = await showRewardedAd('ticket');
      if (!rewarded) {
        return;
      }
    }
    
    setIsSpinning(true);
    setShowResult(false);
    
    const { segmentIndex, segment } = spinWheel();
    const targetRotation = calculateRotationAngle(segmentIndex);
    
    setRotation(prev => prev + targetRotation);
    
    if (isFree) {
      markFreeSpinUsed();
      setCanFreeSpin(false);
      scheduleWheelNotification();
    }
    
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
      <DialogContent className="bg-game-darker/95 backdrop-blur-xl border-primary/20 max-w-sm shadow-[0_0_60px_hsl(var(--primary)/0.15),0_0_120px_hsl(var(--secondary)/0.08)]">
        <DialogHeader>
          <DialogTitle className="text-center flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-secondary" />
              <span className="bg-gradient-primary bg-clip-text text-transparent text-lg font-black tracking-wide">
                {t.luckyWheelTitle}
              </span>
              <Sparkles className="w-4 h-4 text-secondary" />
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4 py-2">
          {/* Roue */}
          <div className="relative w-64 h-64">
            {/* Halo ambient derrière la roue */}
            <div className="absolute -inset-4 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
            
            {/* Pointeur premium */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
              <div className="relative">
                <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[24px] border-l-transparent border-r-transparent border-t-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[14px] border-l-transparent border-r-transparent border-t-white/30" />
              </div>
            </div>
            
            {/* Anneau extérieur premium - double bordure */}
            <div className="absolute inset-0 rounded-full border-[3px] border-primary/40 shadow-[0_0_30px_hsl(var(--primary)/0.2),inset_0_0_20px_hsl(var(--primary)/0.1)]" />
            <div className="absolute inset-[3px] rounded-full border border-white/10" />
            
            {/* Petits points lumineux autour de la roue */}
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * 15) * Math.PI / 180;
              const x = 50 + 49 * Math.cos(angle);
              const y = 50 + 49 * Math.sin(angle);
              return (
                <div
                  key={i}
                  className={`absolute w-1.5 h-1.5 rounded-full ${i % 3 === 0 ? 'bg-primary/60' : 'bg-white/20'}`}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)',
                    boxShadow: i % 3 === 0 ? '0 0 4px hsl(var(--primary) / 0.5)' : 'none',
                  }}
                />
              );
            })}
            
            {/* Roue principale */}
            <div 
              className="absolute inset-3 rounded-full overflow-hidden"
              style={{ 
                transform: `rotate(${rotation}deg)`,
                transition: 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)',
              }}
            >
              <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-lg">
                <defs>
                  {WHEEL_SEGMENTS.map((segment, index) => (
                    <radialGradient key={`grad-${index}`} id={`seg-grad-${index}`} cx="50%" cy="50%" r="50%">
                      <stop offset="20%" stopColor={segment.color} stopOpacity="0.6" />
                      <stop offset="100%" stopColor={segment.color} stopOpacity="1" />
                    </radialGradient>
                  ))}
                </defs>
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
                  const textX = 100 + 58 * Math.cos(midAngle);
                  const textY = 100 + 58 * Math.sin(midAngle);
                  const textRotation = startAngle + segmentAngle / 2 + 90;
                  
                  return (
                    <g key={segment.id}>
                      <path
                        d={`M 100 100 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={`url(#seg-grad-${index})`}
                        stroke="hsl(var(--game-darker))"
                        strokeWidth="0.8"
                      />
                      {/* Ligne de séparation subtile */}
                      <line
                        x1="100" y1="100"
                        x2={x1} y2={y1}
                        stroke="white"
                        strokeWidth="0.3"
                        opacity="0.15"
                      />
                      <text
                        x={textX}
                        y={textY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                        className="fill-white font-black"
                        style={{ 
                          fontSize: segment.label.length > 2 ? '9px' : '15px',
                          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
                        }}
                      >
                        {segment.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            
            {/* Centre de la roue - premium */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-game-darker via-game-dark to-game-darker border-2 border-primary/40 shadow-[0_0_20px_hsl(var(--primary)/0.3)] flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center shadow-inner">
                  <Gift className="w-5 h-5 text-white drop-shadow-sm" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Résultat */}
          {showResult && lastReward && (
            <div className="animate-scale-in text-center">
              <p className="text-text-muted text-xs mb-1 uppercase tracking-widest">{t.youWon}</p>
              <div className="flex items-center justify-center gap-2 text-xl font-black text-secondary drop-shadow-[0_0_8px_hsl(var(--secondary)/0.4)]">
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
                className="bg-gradient-primary hover:scale-[1.03] transition-all duration-300 shadow-[0_0_20px_hsl(var(--primary)/0.3)] font-bold tracking-wide"
              >
                <RotateCcw className={`w-4 h-4 mr-2 ${isSpinning ? 'animate-spin' : ''}`} />
                {t.freeSpin}
              </Button>
            ) : (
              <Button
                onClick={() => handleSpin(false)}
                disabled={isSpinning || !isReady()}
                variant="outline"
                className="border-secondary/40 text-secondary hover:bg-secondary/10 hover:border-secondary/60 transition-all duration-300"
              >
                <Tv className="w-4 h-4 mr-2" />
                {t.watchAdToSpin}
              </Button>
            )}
            
            <Button
              onClick={onClose}
              disabled={isSpinning}
              variant="ghost"
              className="text-text-muted hover:text-text-primary text-xs"
            >
              {t.close}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
