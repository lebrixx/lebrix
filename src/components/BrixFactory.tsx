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
  const isMe = (n: string) => !!me && n.toLowerCase() === me.toLowerCase();
  const myIndex = ranked.findIndex((r) => isMe(r.username));
  const podium = ranked.slice(0, 3);
  const pod = [
    { i: 1, h: 'h-16', ring: 'ring-slate-300/70', tone: 'text-slate-200', label: '2' },
    { i: 0, h: 'h-24', ring: 'ring-amber-300/80', tone: 'text-amber-300', label: '1' },
    { i: 2, h: 'h-12', ring: 'ring-orange-400/70', tone: 'text-orange-400', label: '3' },
  ];

  return (
    <div className="min-h-full flex flex-col px-4 pb-28 text-foreground">
      {/* Header */}
      <div className="flex items-center pt-2">
        <button type="button" onClick={onBack} aria-label="Retour" className="w-11 h-11 rounded-full bg-card/70 border border-border/60 flex items-center justify-center active:scale-95 transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 text-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-secondary">Mode usine</div>
          <h1 className="text-2xl font-black tracking-wider leading-none mt-0.5">BRIX FACTORY</h1>
        </div>
        <div className="w-11" />
      </div>

      {/* Hero */}
      <section className="relative mt-5 rounded-[28px] border border-border/60 bg-card/60 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/30 via-transparent to-transparent" />
        <div className="absolute left-1/2 top-6 -translate-x-1/2 w-48 h-48 rounded-full bg-secondary/25 blur-3xl" />
        <div className="relative flex flex-col items-center px-5 pt-5 pb-5">
          <img src={menuCubesArt} alt="" aria-hidden draggable={false} className="w-40 h-40 object-contain drop-shadow-xl animate-[float_4s_ease-in-out_infinite]" />
          <p className="mt-1 text-center text-sm text-muted-foreground leading-snug max-w-[260px]">
            Bâtis ton empire industriel : machines, énergie, camions et recherche.
          </p>

          <div className="mt-4 grid grid-cols-2 w-full rounded-2xl bg-background/50 border border-border/50 divide-x divide-border/50">
            <div className="py-3 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground"><Factory className="w-3 h-3" /> Record</div>
              <div className="mt-1 font-black text-lg">{formatMoney(best)}</div>
            </div>
            <div className="py-3 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground"><Trophy className="w-3 h-3" /> Rang</div>
              <div className="mt-1 font-black text-lg">{myIndex >= 0 ? `#${myIndex + 1}` : '—'}</div>
            </div>
          </div>

          <button type="button" onClick={() => setPlaying(true)} className="group relative mt-4 w-full h-16 rounded-2xl bg-gradient-to-r from-secondary to-primary text-primary-foreground font-black text-xl tracking-[0.25em] flex items-center justify-center gap-3 shadow-[0_10px_30px_hsl(var(--secondary)/0.45)] active:scale-[0.97] transition overflow-hidden">
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-foreground/25 to-transparent animate-[shimmer_2.8s_ease-in-out_infinite]" />
            <Play className="w-7 h-7 relative" fill="currentColor" /> <span className="relative">JOUER</span>
          </button>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="mt-6 rounded-[28px] border border-border/60 bg-card/60 p-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-300" />
          <h2 className="font-black tracking-wider">CLASSEMENT</h2>
          <span className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground">Gains totaux</span>
        </div>

        {rows === null ? (
          <div className="py-10 text-center text-muted-foreground text-sm">Chargement…</div>
        ) : ranked.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Sois le premier à entrer dans le classement !</div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-3 gap-2 items-end">
              {pod.map(({ i, h, ring, tone, label }) => {
                const r = podium[i];
                if (!r) return <div key={i} />;
                return (
                  <div key={i} className="flex flex-col items-center min-w-0">
                    {i === 0 && <Crown className="w-6 h-6 text-amber-300 mb-1" fill="currentColor" />}
                    <div className={`w-12 h-12 rounded-full bg-background/70 ring-2 ${ring} flex items-center justify-center font-black text-lg ${tone}`}>
                      {r.username.slice(0, 1).toUpperCase()}
                    </div>
                    <div className={`mt-1.5 w-full truncate text-center text-xs font-bold ${isMe(r.username) ? 'text-secondary' : ''}`}>{r.username}</div>
                    <div className="text-[11px] font-black text-secondary">{formatMoney(r.factory_earnings ?? 0)}</div>
                    <div className={`mt-2 w-full ${h} rounded-t-xl bg-gradient-to-b from-primary/40 to-primary/5 border-t border-x border-border/50 flex items-start justify-center pt-1.5 font-black text-2xl ${tone}`}>{label}</div>
                  </div>
                );
              })}
            </div>

            {ranked.length > 3 && (
              <ol className="mt-3 divide-y divide-border/40">
                {ranked.slice(3, 50).map((r, k) => (
                  <li key={r.username} className={`flex items-center gap-3 px-2 py-2.5 ${isMe(r.username) ? 'rounded-xl bg-secondary/15' : ''}`}>
                    <span className="w-7 text-center text-xs font-black text-muted-foreground">{k + 4}</span>
                    <span className="flex-1 truncate text-sm font-semibold">{r.username}</span>
                    <span className="text-sm font-black tabular-nums">{formatMoney(r.factory_earnings ?? 0)}</span>
                  </li>
                ))}
              </ol>
            )}

            {me && myIndex >= 50 && (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-secondary/50 bg-secondary/15 px-2 py-2.5">
                <span className="w-7 text-center text-xs font-black">{myIndex + 1}</span>
                <span className="flex-1 truncate text-sm font-semibold">{me}</span>
                <span className="text-sm font-black">{formatMoney(ranked[myIndex].factory_earnings ?? 0)}</span>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
