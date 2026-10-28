import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArenaGame } from '@/games/brix-arena/ArenaGame';
import { startGameSession } from '@/utils/scoresApi';

interface Props {
  onBack: () => void;
  onGameOver: (score: number, duration: number) => void;
}

/** Navigation and rankings only: the supplied game owns all play and UI. */
export function BrixArenaGame({ onBack, onGameOver }: Props) {
  const gameOver = useRef(onGameOver);
  gameOver.current = onGameOver;
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600&family=Russo+One&display=swap';
    document.head.appendChild(link);
    return () => link.remove();
  }, []);
  const finish = useCallback((score: number, duration: number) => {
    try {
      const data = JSON.parse(localStorage.getItem('luckyStopGame') || '{}');
      data.bestScore_brix_arena = Math.max(data.bestScore_brix_arena || 0, score);
      data.totalGamesPlayed = (data.totalGamesPlayed || 0) + 1;
      localStorage.setItem('luckyStopGame', JSON.stringify(data));
    } catch { /* Original game continues if storage is unavailable. */ }
    gameOver.current(score, duration);
  }, []);
  return createPortal(<ArenaGame onBack={onBack} onStart={startGameSession} onFinish={finish} />, document.body);
}