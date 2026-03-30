import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Lightbulb, X } from 'lucide-react';

const TIPS = [
  {
    emoji: '🎯',
    title: 'Timing parfait',
    tip: 'Appuie juste avant que l\'aiguille atteigne la zone verte. Anticipe le mouvement !',
  },
  {
    emoji: '⚡',
    title: 'La vitesse augmente',
    tip: 'Plus ton score monte, plus l\'aiguille accélère. Reste concentré et adapte ton timing.',
  },
  {
    emoji: '🔄',
    title: 'Les changements de direction',
    tip: 'L\'aiguille peut changer de sens ! Garde les yeux sur son mouvement, pas sur la zone.',
  },
  {
    emoji: '🎮',
    title: 'Explore les modes',
    tip: 'Chaque mode de jeu a ses propres règles. Essaie-les tous pour varier le plaisir !',
  },
  {
    emoji: '🏆',
    title: 'Classement hebdo',
    tip: 'Ton meilleur score de la semaine compte pour le classement. Joue régulièrement pour rester au top !',
  },
  {
    emoji: '💰',
    title: 'Gagne des coins',
    tip: 'Chaque partie te rapporte des coins. Utilise-les pour débloquer des thèmes et des modes.',
  },
  {
    emoji: '🎁',
    title: 'Récompenses quotidiennes',
    tip: 'Reviens chaque jour pour récupérer ta récompense gratuite. Les streaks donnent de meilleurs cadeaux !',
  },
  {
    emoji: '🚀',
    title: 'Utilise tes boosts',
    tip: 'Les boosts peuvent t\'aider en partie. Consulte ton inventaire avant de jouer !',
  },
  {
    emoji: '🎡',
    title: 'La roue de la chance',
    tip: 'Tu as un tour gratuit toutes les quelques heures. N\'oublie pas de la faire tourner !',
  },
  {
    emoji: '⭐',
    title: 'Défis quotidiens',
    tip: 'Complète les 2 défis du jour pour gagner des récompenses bonus. Ils changent chaque jour !',
  },
  {
    emoji: '👑',
    title: 'Pass Saison',
    tip: 'Progresse dans le Pass Saison en jouant et en complétant des quêtes pour des récompenses exclusives.',
  },
  {
    emoji: '🧠',
    title: 'Mode Mémoire Expert',
    tip: 'Dans ce mode, la zone disparaît ! Mémorise bien sa position avant qu\'elle ne s\'efface.',
  },
  {
    emoji: '🏃',
    title: 'Mode Survie 60s',
    tip: 'En survie, chaque erreur coûte du temps. Sois précis plutôt que rapide !',
  },
  {
    emoji: '📊',
    title: 'Classement mensuel',
    tip: 'Le classement mensuel cumule tes scores sur tous les modes. Joue varié pour grimper !',
  },
  {
    emoji: '🎨',
    title: 'Personnalise ton jeu',
    tip: 'Débloque des thèmes dans la boutique pour changer l\'apparence du jeu. Trouve ton style !',
  },
];

function getDailyTipIndex(): number {
  const startDate = new Date('2025-01-01').getTime();
  const now = new Date().getTime();
  const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
  return daysSinceStart % TIPS.length;
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
      <DialogContent className="sm:max-w-sm bg-button-bg border-wheel-border p-0 overflow-hidden gap-0 [&>button]:hidden">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/10 px-6 pt-6 pb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 hover:bg-white/10 rounded-full"
          >
            <X className="w-4 h-4 text-text-muted" />
          </Button>

          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-semibold text-primary tracking-wide uppercase">
              Conseil du jour
            </span>
          </div>

          <div className="text-4xl mt-3 mb-2">{tip.emoji}</div>
          <h3 className="text-xl font-bold text-text-primary">{tip.title}</h3>
        </div>

        {/* Tip content */}
        <div className="px-6 py-5">
          <p className="text-text-secondary text-sm leading-relaxed">{tip.tip}</p>
        </div>

        {/* Navigation footer */}
        <div className="px-6 pb-5 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={goPrev}
            className="w-10 h-10 rounded-full hover:bg-primary/10 transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-text-muted" />
          </Button>

          <div className="flex items-center gap-1.5">
            {TIPS.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? 'w-6 h-2 bg-primary'
                    : 'w-2 h-2 bg-text-muted/30'
                }`}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={goNext}
            className="w-10 h-10 rounded-full hover:bg-primary/10 transition-all"
          >
            <ChevronRight className="w-5 h-5 text-text-muted" />
          </Button>
        </div>

        {/* OK button */}
        <div className="px-6 pb-5">
          <Button
            onClick={onClose}
            className="w-full bg-gradient-primary hover:opacity-90 font-semibold"
          >
            Compris ! 👍
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
