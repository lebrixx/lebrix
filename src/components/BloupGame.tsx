import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { startGameSession } from '@/utils/scoresApi';
import { consumeTicket } from '@/utils/ticketSystem';
import { recordBloupResult } from '@/utils/bloupProgress';
import { useLanguage, translations } from '@/hooks/useLanguage';
import { toast } from 'sonner';

/** The supplied game owns all visuals, controls, physics and audio. */
export function BloupGame({ onBack, onGameOver }: { onBack: () => void; onGameOver: (score: number, duration: number) => void }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const finishRef = useRef(onGameOver);
  const backRef = useRef(onBack);
  const { language } = useLanguage();
  finishRef.current = onGameOver;
  backRef.current = onBack;

  useEffect(() => {
    let activeRun: string | null = null;
    const onMessage = (e: MessageEvent) => {
      const frame = frameRef.current?.contentWindow;
      if (!frame || e.source !== frame || e.origin !== window.location.origin) return;
      const data = e.data;
      if (data?.type === 'bloup:request-start' && typeof data.runId === 'string') {
        if (activeRun) return;
        const allowed = consumeTicket();
        if (allowed) { activeRun = data.runId; startGameSession(); }
        else toast.error(translations[language].noTicket, { description: translations[language].noTicketDesc });
        frame.postMessage({ type: 'bloup:start-response', runId: data.runId, allowed }, window.location.origin);
      } else if (data?.type === 'bloup:over' && activeRun && data.runId === activeRun) {
        activeRun = null;
        const score = Number(data.score);
        const duration = Number(data.duration);
        if (!Number.isSafeInteger(score) || score < 0 || !Number.isFinite(duration) || duration < 0) return;
        recordBloupResult(score);
        finishRef.current(score, duration);
      } else if (data?.type === 'bloup:exit') backRef.current();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [language]);

  const forwardInsets = () => {
    const root = frameRef.current?.contentDocument?.documentElement;
    if (!root) return;
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;visibility:hidden;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
    document.body.appendChild(probe);
    const cs = getComputedStyle(probe);
    for (const [name, value] of [['top', cs.paddingTop], ['right', cs.paddingRight], ['bottom', cs.paddingBottom], ['left', cs.paddingLeft]]) root.style.setProperty(`--host-safe-${name}`, value);
    probe.remove();
    frameRef.current?.focus();
  };

  return createPortal(
    <div className="pointer-events-auto fixed inset-0 z-[9999] overflow-hidden overscroll-none touch-none bg-background">
      <iframe ref={frameRef} src={`${import.meta.env.BASE_URL}games/bloup/index.html`} title="Bloup" allow="autoplay; fullscreen" onLoad={forwardInsets} className="block h-full w-full border-0" />
    </div>, document.body,
  );
}