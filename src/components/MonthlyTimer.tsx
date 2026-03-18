import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

export const MonthlyTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
      const diff = nextMonth.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Nouveau mois !');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}j ${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const now = new Date();
  const monthName = now.toLocaleDateString('fr-FR', { month: 'long' });

  return (
    <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 border-primary/30 bg-primary/5">
      <Calendar className="w-3.5 h-3.5 text-primary" />
      <span className="text-xs text-text-secondary capitalize">{monthName}</span>
      <span className="text-xs text-primary font-mono font-bold">{timeLeft}</span>
    </Badge>
  );
};
