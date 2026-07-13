import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { useLanguage, translations } from '@/hooks/useLanguage';

export const MonthlyTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState('');
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
      const diff = nextMonth.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft(t.newMonthLabel);
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
  }, [t.newMonthLabel]);

  const locale = language === 'es' ? 'es-ES' : language === 'en' ? 'en-US' : 'fr-FR';
  const now = new Date();
  const monthName = now.toLocaleDateString(locale, { month: 'long' });

  return (
    <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 border-primary/30 bg-primary/5">
      <Calendar className="w-3.5 h-3.5 text-primary" />
      <span className="text-xs text-text-secondary capitalize">{monthName}</span>
      <span className="text-xs text-primary font-mono font-bold">{timeLeft}</span>
    </Badge>
  );
};
