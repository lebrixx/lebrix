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

  const ranked = (rows ?? []).filter((r) => (r.factory_earnings ?? 0) > 0);
  const myIndex = ranked.findIndex((r) => me && r.username.toLowerCase() === me.toLowerCase());
  const podium = ranked.slice(0, 3);
  const medal = ['text-amber-300', 'text-slate-200', 'text-orange-400'];

  return (
    <div className="min-h-full flex flex-col px-4 pb-28 text-foreground">
      <div className="flex items-center gap-3 pt-2">
        <button type="button" onClick={onBack} aria-label="Retour" className="w-11 h-11 rounded-2xl bg-card/70 border border-primary/30 flex items-center justify-center active:scale-95 transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black tracking-wide">BRIX FACTORY</h1>
      </div>

      {/* Hero */}
      <div className="relative mt-4 rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/25 via-card/80 to-secondary/20 p-5 overflow-hidden shadow-[0_10px_40px_hsl(var(--primary)/0.25)]">
        <img src={menuCubesArt} alt="" aria-hidden className="absolute -right-4 -top-2 w-36 opacity-90 animate-[float_4s_ease-in-out_infinite]" draggable={false} />
        <div className="flex items-center gap-2 text-secondary text-xs font-bold uppercase tracking-widest"><Factory className="w-4 h-4" /> Usine</div>
        <p className="mt-2 max-w-[62%] text-sm text-muted-foreground leading-snug">Construis ton empire industriel : machines, énergie, camions et recherche.</p>
        <div className="mt-4 flex gap-3">
          <div className="rounded-2xl bg-background/50 border border-primary/20 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Ton record</div>
            <div className="font-black text-lg">{formatMoney(best)}</div>
          </div>
          <div className="rounded-2xl bg-background/50 border border-primary/20 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Ton rang</div>
            <div className="font-black text-lg">{myIndex >= 0 ? `#${myIndex + 1}` : '—'}</div>
          </div>
        </div>
        <button type="button" onClick={() => setPlaying(true)} className="mt-5 w-full h-14 rounded-2xl bg-gradient-to-r from-secondary to-primary text-primary-foreground font-black text-lg tracking-widest flex items-center justify-center gap-2 shadow-[0_8px_24px_hsl(var(--secondary)/0.4)] active:scale-[0.97] transition animate-pulse">
          <Play className="w-6 h-6" fill="currentColor" /> JOUER
        </button>
      </div>

      {/* Leaderboard */}
      <div className="mt-6 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-amber-300" />
        <h2 className="font-black tracking-wide">CLASSEMENT</h2>
        <span className="ml-auto text-xs text-muted-foreground">Gains totaux</span>
      </div>

      {rows === null ? (
        <div className="mt-6 text-center text-muted-foreground text-sm">Chargement…</div>
      ) : ranked.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-primary/20 bg-card/60 p-5 text-center text-sm text-muted-foreground">Sois le premier à entrer dans le classement !</div>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-3 gap-2 items-end">
            {[1, 0, 2].map((i) => podium[i] && (
              <div key={i} className={`rounded-2xl border border-primary/25 bg-card/70 p-2 text-center ${i === 0 ? 'pb-5 pt-4' : 'pb-3'}`}>
                <Crown className={`mx-auto w-6 h-6 ${medal[i]}`} fill="currentColor" />
                <div className="mt-1 text-xs font-bold truncate">{podium[i].username}</div>
                <div className="text-[11px] text-secondary font-black">{formatMoney(podium[i].factory_earnings ?? 0)}</div>
              </div>
            ))}
          </div>
          <ol className="mt-3 space-y-2">
            {ranked.slice(3, 50).map((r, i) => {
              const mine = me && r.username.toLowerCase() === me.toLowerCase();
              return (
                <li key={r.device_id} className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${mine ? 'border-secondary/60 bg-secondary/15' : 'border-primary/15 bg-card/60'}`}>
                  <span className="w-7 text-center text-sm font-black text-muted-foreground">{i + 4}</span>
                  <span className="flex-1 truncate text-sm font-semibold">{r.username}</span>
                  <span className="text-sm font-black">{formatMoney(r.factory_earnings ?? 0)}</span>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}
