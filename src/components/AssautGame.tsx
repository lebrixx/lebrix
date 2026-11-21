import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AssautGame as OriginalAssaut } from '@/games/assaut/AssautGame';
import '@/games/assaut/styles.css';
import { startGameSession } from '@/utils/scoresApi';
import type { BoostType } from '@/types/boosts';
import { emitBoostFx } from '@/utils/runBoosts';
import { RunBoostFxLayer, RunBoostPicker, useRunBoostSelection } from '@/components/boosts/RunBoosts';

export function AssautGame({ onBack, onGameOver, onRunBoosts }: { onBack: () => void; onGameOver: (score: number, duration: number) => void; onRunBoosts?: (boosts: BoostType[]) => void }) {
  const finishRef = useRef(onGameOver);
  finishRef.current = onGameOver;
  const runBoostsRef = useRef(onRunBoosts);
  runBoostsRef.current = onRunBoosts;
  const boosts = useRunBoostSelection();
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
  const takeBoosts = useCallback(() => {
    boosts.setOpen(false);
    const used = boosts.take();
    runBoostsRef.current?.(used);
    return used;
  }, [boosts.take, boosts.setOpen]);
  return createPortal(
    <>
      <OriginalAssaut
        onBack={onBack} onStart={startGameSession} onFinish={finish}
        takeBoosts={takeBoosts} onOpenBoosts={() => boosts.setOpen(true)} armedBoosts={boosts.selected}
        onBoostFx={(kind) => { if (kind === 'revive') emitBoostFx({ kind }); }}
      />
      <div className="pointer-events-none fixed inset-0 z-[60]">
        <RunBoostFxLayer theme="assaut" />
        <div className="pointer-events-auto">
          <RunBoostPicker theme="assaut" open={boosts.open} selected={boosts.selected} onChange={boosts.setSelected} onClose={() => boosts.setOpen(false)} />
        </div>
      </div>
    </>,
    document.body,
  );
}
