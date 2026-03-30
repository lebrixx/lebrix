import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Lightbulb, X } from 'lucide-react';

const TIPS = [
  {
    emoji: '🏆',
    title: '2 classements',
    tip: 'Classement par mode (hebdo) + classement global mensuel depuis l\'accueil !',
  },
  {
    emoji: '📡',
    title: 'Joue en ligne',
    tip: 'Sans internet, tes scores ne sont pas sauvegardés en ligne.',
  },
  {
    emoji: '🚀',
    title: 'Utilise tes boosts',
    tip: 'Sélectionne des boosts avant chaque partie pour maximiser ton score.',
  },
  {
    emoji: '👑',
    title: 'Cosmétiques de pseudo',
    tip: 'Débloque des couleurs et effets de pseudo dans le Pass Saison !',
  },
  {
    emoji: '⭐',
    title: 'Défis quotidiens & globaux',
    tip: 'Complète 2 défis/jour + des défis globaux par paliers pour gagner des récompenses.',
  },
  {
    emoji: '🎯',
    title: 'Défi Précision',
    tip: 'N\'oublie pas le défi précision dans les défis, prouve que tu es le plus précis !',
  },
  {
    emoji: '🎁',
    title: 'Bonus quotidiens',
    tip: 'Chaque jour : roue de la chance, roulette x2 pour les modes et récompenses journalières à récupérer !',
  },
];

function getLaunchTipIndex(): number {
  const key = 'ls_tip_launch_index';
  const current = parseInt(localStorage.getItem(key) || '0', 10);
  const index = current % TIPS.length;
  // Advance for next launch
  localStorage.setItem(key, String(current + 1));
  return index;
}

interface DailyTipProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyTip: React.FC<DailyTipProps> = ({ isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(getDailyTipIndex());

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(getDailyTipIndex());
    }
  }, [isOpen]);

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % TIPS.length);
  };

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + TIPS.length) % TIPS.length);
  };

  const tip = TIPS[currentIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[340px] rounded-3xl bg-gradient-to-b from-button-bg to-button-bg/95 border border-primary/20 shadow-[0_8px_40px_hsl(var(--primary)/0.15),0_0_0_1px_hsl(var(--wheel-border)/0.3)] p-0 overflow-hidden gap-0 [&>button]:hidden mx-auto">
        {/* Decorative top bar */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-primary" />

        {/* Header */}
        <div className="relative px-6 pt-5 pb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 hover:bg-primary/10 rounded-full"
          >
            <X className="w-3.5 h-3.5 text-text-muted" />
          </Button>

          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary/25 to-secondary/15 flex items-center justify-center shadow-[inset_0_1px_2px_hsl(var(--primary)/0.2)]">
              <Lightbulb className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <span className="text-xs font-bold text-primary/80 tracking-widest uppercase">
                Conseil du jour
              </span>
              <div className="text-[10px] text-text-muted">
                {currentIndex + 1} / {TIPS.length}
              </div>
            </div>
          </div>

          {/* Emoji + Title */}
          <div className="bg-gradient-to-br from-primary/8 to-secondary/5 rounded-2xl p-4 border border-primary/10">
            <div className="text-4xl mb-2">{tip.emoji}</div>
            <h3 className="text-lg font-bold text-text-primary leading-tight">{tip.title}</h3>
          </div>
        </div>

        {/* Tip content */}
        <div className="px-6 pb-4">
          <p className="text-text-secondary text-[13px] leading-relaxed">{tip.tip}</p>
        </div>

        {/* Navigation */}
        <div className="px-6 pb-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={goPrev}
            className="w-9 h-9 rounded-full hover:bg-primary/10 transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-text-muted" />
          </Button>

          <div className="flex items-center gap-2">
            {TIPS.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? 'w-7 h-2 bg-gradient-to-r from-primary to-secondary shadow-[0_0_8px_hsl(var(--primary)/0.4)]'
                    : 'w-2 h-2 bg-text-muted/25'
                }`}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={goNext}
            className="w-9 h-9 rounded-full hover:bg-primary/10 transition-all"
          >
            <ChevronRight className="w-5 h-5 text-text-muted" />
          </Button>
        </div>

        {/* OK button */}
        <div className="px-6 pb-5">
          <Button
            onClick={onClose}
            className="w-full rounded-2xl bg-gradient-primary hover:opacity-90 font-semibold py-5 shadow-[0_4px_16px_hsl(var(--primary)/0.3)]"
          >
            Compris ! 👍
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
