import React, { useEffect, useState } from 'react';
import { useLanguage, translations } from '@/hooks/useLanguage';

interface ReviveUsedFlashProps {
  triggerKey: number;
}

export const ReviveUsedFlash: React.FC<ReviveUsedFlashProps> = ({ triggerKey }) => {
  const [visible, setVisible] = useState(false);
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    if (triggerKey <= 0) return;
    setVisible(true);
    const timeout = window.setTimeout(() => setVisible(false), 1100);
    return () => window.clearTimeout(timeout);
  }, [triggerKey]);

  if (!visible) return null;

  return (
    <div
      key={triggerKey}
      className="absolute left-1/2 top-[42%] z-30 -translate-x-1/2 pointer-events-none animate-scale-in"
    >
      <div className="flex items-center gap-2 rounded-full border border-rose-300/70 bg-rose-500/25 px-5 py-2.5 shadow-lg shadow-rose-500/25 backdrop-blur-md">
        <span className="text-2xl">❤️‍🔥</span>
        <span className="whitespace-nowrap text-sm font-extrabold uppercase tracking-wide text-rose-100">
          {(t as any).reviveBoostUsed || 'Seconde chance !'}
        </span>
      </div>
    </div>
  );
};
