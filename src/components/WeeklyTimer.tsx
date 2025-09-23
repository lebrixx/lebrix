import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { getTimeUntilNextWeek } from '@/utils/weeklyUtils';

export const WeeklyTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilNextWeek());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeUntilNextWeek());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center gap-2 px-3 py-2 bg-button-bg border border-wheel-border rounded-lg">
      <Clock className="w-4 h-4 text-secondary" />
      <span className="text-text-secondary text-sm font-medium">
        Nouveau classement dans: 
        <span className="text-secondary ml-1">
          {timeLeft.days > 0 && `${timeLeft.days}j `}
          {String(timeLeft.hours).padStart(2, '0')}:
          {String(timeLeft.minutes).padStart(2, '0')}:
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
      </span>
    </div>
  );
};