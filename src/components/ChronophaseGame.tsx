import { useEffect, useRef } from 'react';
import { currentLang } from '@/i18n/tr';
import type { BoostType } from '@/types/boosts';
import { consumeRunBoosts, emitBoostFx } from '@/utils/runBoosts';
import { RunBoostFxLayer, RunBoostPicker, useRunBoostSelection } from '@/components/boosts/RunBoosts';
import { createPortal } from 'react-dom';
import { startGameSession } from '@/utils/scoresApi';

/** Hosts the supplied standalone Chronophase game; bridges start, score, exit and run boosts. */
export function ChronophaseGame({ onBack, onGameOver, onRunBoosts }: { onBack: () => void; onGameOver: (score: number, duration: number) => void; onRunBoosts?: (boosts: BoostType[]) => void }) {
  const boosts = useRunBoostSelection();
  const runBoostsRef = useRef(onRunBoosts);
  runBoostsRef.current = onRunBoosts;
  const selectedRef = useRef(boosts.selected);
  selectedRef.current = boosts.selected;

  // Le jeu (iframe) connaît en permanence la sélection pour l'appliquer dès le lancement.
  const postArmed = () => {
    frameRef.current?.contentWindow?.postMessage({ type: 'chronophase:armed', boosts: selectedRef.current }, '*');
  };
  useEffect(postArmed, [boosts.selected]);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const finishRef = useRef(onGameOver);
  const backRef = useRef(onBack);
  finishRef.current = onGameOver;
  backRef.current = onBack;

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frameRef.current?.contentWindow) return;
      const data = e.data as { type?: string; score?: number; duration?: number; boosts?: unknown; kind?: string };
      if (data?.type === 'chronophase:start') {
        startGameSession();
        // Consomme ce que le jeu a réellement appliqué (limité à la sélection et au stock).
        const asked = Array.isArray(data.boosts) ? data.boosts.filter((b): b is string => typeof b === 'string' && selectedRef.current.includes(b as BoostType)) : [];
        const used = consumeRunBoosts(asked);
        boosts.setSelected([]);
        boosts.setOpen(false);
        runBoostsRef.current?.(used);
      }
      else if (data?.type === 'chronophase:boosts-open') boosts.setOpen(true);
      else if (data?.type === 'chronophase:boost' && data.kind === 'revive') emitBoostFx({ kind: 'revive' });
      else if (data?.type === 'chronophase:exit') backRef.current();
      else if (data?.type === 'chronophase:over') {
        const score = Math.max(0, Math.floor(Number(data.score) || 0));
        try {
          const saved = JSON.parse(localStorage.getItem('luckyStopGame') || '{}');
          saved.bestScore_chronophase = Math.max(saved.bestScore_chronophase || 0, score);
          saved.totalGamesPlayed = (saved.totalGamesPlayed || 0) + 1;
          localStorage.setItem('luckyStopGame', JSON.stringify(saved));
        } catch { /* keep playing if storage fails */ }
        finishRef.current(score, Number(data.duration) || 0);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Safe-area insets are 0 inside iframes, so forward the host's values.
  const forwardInsets = () => {
    const doc = frameRef.current?.contentDocument;
    if (!doc) return;
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;visibility:hidden;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
    document.body.appendChild(probe);
    const cs = getComputedStyle(probe);
    const root = doc.documentElement.style;
    root.setProperty('--st', cs.paddingTop);
    root.setProperty('--sr', cs.paddingRight);
    root.setProperty('--sb', cs.paddingBottom);
    root.setProperty('--sl', cs.paddingLeft);
    probe.remove();
  };

  return createPortal(
    <div className="pointer-events-auto" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#07080d' }}>
      <iframe
        ref={frameRef}
        src={`${import.meta.env.BASE_URL}games/chronophase/index.html?lang=${currentLang()}`}
        title="Chronophase"
        onLoad={() => { forwardInsets(); postArmed(); }}
        allow="autoplay; fullscreen"
        style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
      />
      <RunBoostFxLayer theme="chrono" />
      <RunBoostPicker theme="chrono" open={boosts.open} selected={boosts.selected} onChange={boosts.setSelected} onClose={() => boosts.setOpen(false)} />
    </div>,
    document.body,
  );
}
