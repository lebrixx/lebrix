import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AssautGame as OriginalAssaut } from '@/games/assaut/AssautGame';
import '@/games/assaut/styles.css';
import { startGameSession } from '@/utils/scoresApi';

export function AssautGame({ onBack, onGameOver }: { onBack: () => void; onGameOver: (score: number, duration: number) => void }) {
  const finishRef = useRef(onGameOver);
  finishRef.current = onGameOver;
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600;700;800;900&display=swap';
    document.head.appendChild(link);
    return () => link.remove();
  }, []);
  const finish = useCallback((score: number, duration: number) => {
    try {
      const data = JSON.parse(localStorage.getItem('luckyStopGame') || '{}');
      data.bestScore_assaut = Math.max(data.bestScore_assaut || 0, score);
      data.totalGamesPlayed = (data.totalGamesPlayed || 0) + 1;
      localStorage.setItem('luckyStopGame', JSON.stringify(data));
    } catch { /* Preserve gameplay if storage is unavailable. */ }
    finishRef.current(score, duration);
  }, []);
  return createPortal(<OriginalAssaut onBack={onBack} onStart={startGameSession} onFinish={finish} />, document.body);
}