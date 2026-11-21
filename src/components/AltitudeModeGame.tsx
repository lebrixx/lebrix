import { useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import AltitudeGame from '@/games/altitude/AltitudeGame';
import { startGameSession } from '@/utils/scoresApi';
import { recordAltitudeResult } from '@/utils/altitudeProgress';
import type { BoostType } from '@/types/boosts';
import { emitBoostFx } from '@/utils/runBoosts';
import { RunBoostFxLayer, RunBoostPicker, useRunBoostSelection } from '@/components/boosts/RunBoosts';

/** The supplied Altitude game owns every visual; only navigation, scores and run boosts are bridged. */
export function AltitudeModeGame({ onBack, onGameOver, onRunBoosts }: { onBack: () => void; onGameOver: (score: number, duration: number) => void; onRunBoosts?: (boosts: BoostType[]) => void }) {
  const boosts = useRunBoostSelection();
  const runBoostsRef = useRef(onRunBoosts);
  runBoostsRef.current = onRunBoosts;
  const takeBoosts = useCallback(() => {
    boosts.setOpen(false);
    const used = boosts.take();
    runBoostsRef.current?.(used);
    return used;
  }, [boosts.take, boosts.setOpen]);
  return createPortal(
    <div className="pointer-events-auto fixed inset-0 z-[9999]">
      <AltitudeGame
        onBackToMenu={onBack}
        onStart={() => startGameSession()}
        onGameOver={(score, ms) => { recordAltitudeResult(score); onGameOver(score, Math.round(ms / 1000)); }}
        onOpenBoosts={() => boosts.setOpen(true)}
        takeBoosts={takeBoosts}
        armedBoosts={boosts.selected.length}
        onBoostFx={(kind) => { if (kind === 'revive') emitBoostFx({ kind }); }}
      />
      <RunBoostFxLayer theme="altitude" zIndex={70} />
      <RunBoostPicker theme="altitude" zIndex={80} open={boosts.open} selected={boosts.selected} onChange={boosts.setSelected} onClose={() => boosts.setOpen(false)} />
    </div>, document.body,
  );
}
