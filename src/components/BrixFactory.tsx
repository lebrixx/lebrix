import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Crown, Factory, Play, Trophy } from 'lucide-react';
import { fetchBrixLeaderboard, submitBrixScore, type BrixLeaderboardEntry } from '@/utils/brixFactoryApi';
import { getUsername } from '@/utils/localIdentity';
import { lockPortraitOrientation, unlockOrientation } from '@/utils/orientation';
import menuCubesArt from '@/assets/menu/cubes.png';

const BEST_KEY = 'brix_factory_earnings_best';
const readBest = () => Number(localStorage.getItem(BEST_KEY) || 0) || 0;

export function formatMoney(n: number): string {
  if (!isFinite(n) || n < 1000) return `${Math.floor(Math.max(0, n))} $`;
  const units = ['K', 'M', 'B', 'T', 'Qa', 'Qi'];
  let i = -1;
  while (n >= 1000 && i < units.length - 1) { n /= 1000; i++; }
  return `${n.toFixed(n < 10 ? 2 : n < 100 ? 1 : 0)} ${units[i]} $`;
}

/** Hosts the supplied Ferrum game unchanged (as Brix Factory); bridges exit and lifetime earnings only. */
function BrixFactoryFrame({ onExit }: { onExit: () => void }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const exitRef = useRef(onExit);
  exitRef.current = onExit;

  useEffect(() => {
    unlockOrientation();
    let lastSent = 0;
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frameRef.current?.contentWindow) return;
      const d = e.data as { type?: string; lifetime?: number };
      if (d?.type === 'brixfactory:exit') exitRef.current();
      else if (d?.type === 'brixfactory:score') {
        const v = Math.floor(Number(d.lifetime) || 0);
        if (v > readBest()) localStorage.setItem(BEST_KEY, String(v));
        if (v > lastSent && getUsername()) {
          lastSent = v;
          submitBrixScore({ totalProduced: 0, reactorLevel: 1, storageLevel: 1, amplifierLevel: 1, factoryEarnings: v }).catch(() => {});
        }
      }
    };
    const forward = () => forwardInsets(frameRef.current);
    window.addEventListener('message', onMessage);
    window.addEventListener('resize', forward);
    return () => {
      window.removeEventListener('message', onMessage);
      window.removeEventListener('resize', forward);
      lockPortraitOrientation();
    };
  }, []);

  return createPortal(
    <div className="pointer-events-auto" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#0b1220' }}>
      <iframe
        ref={frameRef}
        src={`${import.meta.env.BASE_URL}games/brix-factory/index.html`}
        title="Brix Factory"
        onLoad={() => forwardInsets(frameRef.current)}
        allow="autoplay; fullscreen"
        style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
      />
    </div>,
    document.body,
  );
}

// Safe-area insets are 0 inside iframes, so forward the host's values (updated on rotation).
function forwardInsets(frame: HTMLIFrameElement | null) {
  const doc = frame?.contentDocument;
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
}

export function BrixFactory({ onBack }: { onBack: () => void }) {
  const [playing, setPlaying] = useState(false);
  const [rows, setRows] = useState<BrixLeaderboardEntry[] | null>(null);
  const [best, setBest] = useState(readBest);
  const me = getUsername();

  const load = (force = false) => {
    fetchBrixLeaderboard(100, { force }).then(setRows).catch(() => setRows([]));
  };
  useEffect(() => { load(); }, []);

  if (playing) {
    return <BrixFactoryFrame onExit={() => { setPlaying(false); setBest(readBest()); load(true); }} />;
  }

  return <AccueilHost best={best} rows={rows} onBack={onBack} onPlay={() => setPlaying(true)} />;
}

const ACCUEIL = `${import.meta.env.BASE_URL}games/brix-factory/accueil/`;
let accueilReady: Promise<void> | null = null;
function loadAccueil() {
  if (!accueilReady) accueilReady = new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = `${ACCUEIL}ecran-accueil.css`;
    document.head.appendChild(link);
    const sc = document.createElement('script');
    sc.src = `${ACCUEIL}ecran-accueil.js`;
    sc.onload = () => resolve(); sc.onerror = reject;
    document.head.appendChild(sc);
  });
  return accueilReady;
}

/** Shows the supplied Brix Factory pre-game screen unchanged; only adds a back-to-menu button. */
function AccueilHost({ best, rows, onBack, onPlay }: { best: number; rows: BrixLeaderboardEntry[] | null; onBack: () => void; onPlay: () => void }) {
  const cb = useRef({ onBack, onPlay, rows });
  cb.current = { onBack, onPlay, rows };
  useEffect(() => {
    let alive = true;
    loadAccueil().then(() => {
      if (!alive) return;
      const w = window as any;
      w.EcranAccueil.ouvrir({
        partie: null,
        gainsAbsence: 0,
        score: best,
        chemin: ACCUEIL,
        classement: {
          fetch: async () => {
            const r = cb.current.rows ?? await fetchBrixLeaderboard(100).catch(() => null);
            if (!r) return null;
            return r.filter((x) => (x.factory_earnings ?? 0) > 0).map((x) => ({ name: x.username, score: x.factory_earnings ?? 0 }));
          },
          submit: async () => {},
        },
        onJouer: () => cb.current.onPlay(),
      });
      const root = document.getElementById('brix-accueil');
      if (root) {
        root.style.pointerEvents = 'auto';
        const b = document.createElement('button');
        b.setAttribute('aria-label', 'Retour au menu');
        b.textContent = '←';
        b.style.cssText = 'position:fixed;z-index:5;top:calc(env(safe-area-inset-top) + 12px);left:calc(env(safe-area-inset-left) + 12px);width:44px;height:44px;border-radius:13px;background:rgba(255,255,255,.96);color:#1d2742;font-size:22px;font-weight:900;box-shadow:0 4px 0 rgba(29,39,66,.2)';
        b.addEventListener('click', (e) => { e.stopPropagation(); w.EcranAccueil.fermer(); cb.current.onBack(); });
        root.appendChild(b);
      }
    });
    return () => { alive = false; (window as any).EcranAccueil?.fermer(); };
  }, [best]);
  useEffect(() => { (window as any).EcranAccueil?.rafraichirClassement?.(); }, [rows]);
  return null;
}
