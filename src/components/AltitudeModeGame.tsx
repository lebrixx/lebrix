import { createPortal } from 'react-dom';
import AltitudeGame from '@/games/altitude/AltitudeGame';
import { startGameSession } from '@/utils/scoresApi';
import { recordAltitudeResult } from '@/utils/altitudeProgress';

/** The supplied Altitude game owns every visual; only navigation and scores are bridged. */
export function AltitudeModeGame({ onBack, onGameOver }: { onBack: () => void; onGameOver: (score: number, duration: number) => void }) {
  return createPortal(
    <div className="pointer-events-auto fixed inset-0 z-[9999]">
      <AltitudeGame
        onBackToMenu={onBack}
        onStart={() => startGameSession()}
        onGameOver={(score, ms) => { recordAltitudeResult(score); onGameOver(score, Math.round(ms / 1000)); }}
      />
    </div>, document.body,
  );
}
