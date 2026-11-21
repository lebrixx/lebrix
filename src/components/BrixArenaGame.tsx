import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArenaGame } from '@/games/brix-arena/ArenaGame';
import { startGameSession } from '@/utils/scoresApi';
import type { BoostType } from '@/types/boosts';
import { RunBoostFxLayer, RunBoostPicker, useRunBoostSelection } from '@/components/boosts/RunBoosts';

interface Props {
  onBack: () => void;
  onGameOver: (score: number, duration: number) => void;
  onRunBoosts?: (boosts: BoostType[]) => void;
}

/** Navigation and rankings only: the supplied game owns all play and UI. */
export function BrixArenaGame({ onBack, onGameOver, onRunBoosts }: Props) {
  const boosts = useRunBoostSelection();
  const runBoostsRef = useRef(onRunBoosts);
  runBoostsRef.current = onRunBoosts;
  const takeBoosts = useCallback(() => {
    boosts.setOpen(false);
    const used = boosts.take();
    runBoostsRef.current?.(used);
    return used;
  }, [boosts.take, boosts.setOpen]);
  const gameOver = useRef(onGameOver);
  gameOver.current = onGameOver;
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Alegreya+Sans:wght@400;500;700;800&family=Cinzel:wght@600;700;900&family=Chakra+Petch:wght@400;500;600&family=Russo+One&display=swap';
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
  return createPortal(
    <ArenaGame
      onBack={onBack} onStart={startGameSession} onFinish={finish}
      takeBoosts={takeBoosts} onOpenBoosts={() => boosts.setOpen(true)} armedBoosts={boosts.selected}
      overlay={<>
        <RunBoostFxLayer theme="arena" zIndex={90} />
        <RunBoostPicker theme="arena" zIndex={95} open={boosts.open} selected={boosts.selected} onChange={boosts.setSelected} onClose={() => boosts.setOpen(false)} />
      </>}
    />,
    document.body,
  );
}