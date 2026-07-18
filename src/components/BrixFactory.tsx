import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  ArrowLeft,
  Factory,
  Zap,
  Package,
  Sparkles,
  Gift,
  Trophy,
  RefreshCw,
  Hammer,
  Flame,
  Info,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  BrixFactoryState,
  loadState,
  saveState,
  applyOfflineProduction,
  productionPerSec,
  productionPerMin,
  storageCapacity,
  reactorCost,
  storageCost,
  amplifierCost,
  amplifierMult,
  reactorRate,
  dailyBonusStatus,
  claimDailyBonus,
  formatBrix,
  formatDuration,
} from '@/utils/brixFactoryState';
import { fetchBrixLeaderboard, submitBrixScore, BrixLeaderboardEntry } from '@/utils/brixFactoryApi';
import { getDeviceId, getUsername } from '@/utils/localIdentity';
import { UsernameModal } from '@/components/UsernameModal';

interface BrixFactoryProps {
  onBack: () => void;
}

export const BrixFactory: React.FC<BrixFactoryProps> = ({ onBack }) => {
  const { toast } = useToast();
  const [state, setState] = useState<BrixFactoryState>(() => loadState());
  const [, setTick] = useState(0);
  const [leaderboard, setLeaderboard] = useState<BrixLeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(false);
  const [lbError, setLbError] = useState<string | null>(null);
  const [lbOpen, setLbOpen] = useState(false);
  const [showUsername, setShowUsername] = useState(false);
  const lastSubmitRef = useRef(0);
  const harvestFlashRef = useRef<HTMLDivElement | null>(null);

  // Offline gain on mount
  useEffect(() => {
    const initial = loadState();
    const { state: next, gained } = applyOfflineProduction(initial);
    setState(next);
    saveState(next);
    if (gained >= 1) {
      toast({
        title: '🏭 Production hors-ligne',
        description: `Ton usine a produit ${formatBrix(gained)} Brix pendant ton absence.`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live loop
  useEffect(() => {
    const id = window.setInterval(() => {
      setState((s) => {
        const cap = storageCapacity(s.storageLevel);
        const gain = productionPerSec(s);
        const stored = Math.min(cap, s.stored + gain);
        const next = { ...s, stored, lastTick: Date.now() };
        saveState(next);
        return next;
      });
      setTick((t) => t + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onHide = () => saveState({ ...state, lastTick: Date.now() });
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onHide);
    };
  }, [state]);

  const loadLeaderboard = async (force = false) => {
    setLbLoading(true);
    setLbError(null);
    try {
      const rows = await fetchBrixLeaderboard(50, { force });
      setLeaderboard(rows);
    } catch (e: any) {
      setLbError(e?.message ?? 'Erreur');
    } finally {
      setLbLoading(false);
    }
  };


  const uploadScore = async (s: BrixFactoryState) => {
    const now = Date.now();
    if (now - lastSubmitRef.current < 15000) return;
    if (!getUsername()) return;
    lastSubmitRef.current = now;
    await submitBrixScore({
      totalProduced: s.totalProduced,
      reactorLevel: s.reactorLevel,
      storageLevel: s.storageLevel,
      amplifierLevel: s.amplifierLevel,
    });
  };

  const cap = storageCapacity(state.storageLevel);
  const pctStorage = cap > 0 ? Math.min(100, (state.stored / cap) * 100) : 0;
  const storageFull = state.stored >= cap - 0.05;
  const ppMin = productionPerMin(state);

  const handleHarvest = () => {
    const gained = state.stored;
    if (gained <= 0) return;
    const next: BrixFactoryState = {
      ...state,
      brix: state.brix + gained,
      totalProduced: state.totalProduced + gained,
      stored: 0,
      lastTick: Date.now(),
    };
    setState(next);
    saveState(next);
    if (harvestFlashRef.current) {
      harvestFlashRef.current.classList.remove('animate-ping');
      void harvestFlashRef.current.offsetWidth;
      harvestFlashRef.current.classList.add('animate-ping');
    }
    if (!getUsername()) setShowUsername(true);
    else uploadScore(next);
  };

  const buyReactor = () => {
    const cost = reactorCost(state.reactorLevel);
    if (state.brix < cost) return;
    const next = { ...state, brix: state.brix - cost, reactorLevel: state.reactorLevel + 1 };
    setState(next);
    saveState(next);
  };
  const buyStorage = () => {
    const cost = storageCost(state.storageLevel);
    if (state.brix < cost) return;
    const next = { ...state, brix: state.brix - cost, storageLevel: state.storageLevel + 1 };
    setState(next);
    saveState(next);
  };
  const buyAmplifier = () => {
    const cost = amplifierCost(state.amplifierLevel);
    if (state.brix < cost) return;
    const next = { ...state, brix: state.brix - cost, amplifierLevel: state.amplifierLevel + 1 };
    setState(next);
    saveState(next);
  };

  const bonus = dailyBonusStatus(state);
  const handleClaimBonus = () => {
    if (!bonus.available) return;
    const next = claimDailyBonus(state);
    setState(next);
    saveState(next);
    toast({ title: '🎁 Bonus quotidien', description: `+${formatBrix(bonus.amount)} Brix (jour ${bonus.streak})` });
    if (!getUsername()) setShowUsername(true);
    else uploadScore(next);
  };

  const deviceId = getDeviceId();
  const myRank = leaderboard.findIndex((r) => r.device_id === deviceId);

  const openLeaderboard = () => {
    setLbOpen(true);
    loadLeaderboard();
  };

  if (lbOpen) {
    return (
      <div className="relative min-h-screen text-text-primary overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(120% 80% at 50% -10%, hsl(var(--secondary) / 0.35) 0%, transparent 55%), radial-gradient(80% 60% at 0% 100%, hsl(var(--primary) / 0.25) 0%, transparent 60%), linear-gradient(180deg, hsl(240 30% 6%) 0%, hsl(240 25% 4%) 100%)',
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-[0.08] mix-blend-screen"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--secondary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--secondary)) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          }}
        />

        <div className="max-w-md mx-auto px-4 pt-6 pb-16 flex flex-col gap-5">
          {/* Header */}
          <div className="relative w-full flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLbOpen(false)}
              className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-white/5 backdrop-blur border border-white/10 hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-[0.35em] text-text-muted">Brix Factory</span>
              <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                <Trophy className="w-5 h-5 text-secondary" /> CLASSEMENT
              </h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => loadLeaderboard(true)}
              disabled={lbLoading}
              className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-white/5 backdrop-blur border border-white/10 hover:bg-white/10"
            >
              <RefreshCw className={`w-4 h-4 ${lbLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Podium */}
          {leaderboard.length > 0 && (
            <div className="grid grid-cols-3 gap-2 items-end mt-2">
              {[1, 0, 2].map((idx) => {
                const row = leaderboard[idx];
                if (!row) return <div key={idx} />;
                const heights = ['h-20', 'h-28', 'h-16'];
                const colors = [
                  'from-slate-300/40 to-slate-500/10 text-slate-100',
                  'from-yellow-300/50 to-yellow-600/10 text-yellow-200',
                  'from-amber-600/40 to-amber-800/10 text-amber-300',
                ];
                const map = { 0: 1, 1: 0, 2: 2 } as Record<number, number>;
                const pos = map[idx];
                return (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <div className="text-lg">{idx === 0 ? '🥈' : idx === 1 ? '🥇' : '🥉'}</div>
                    <span className="text-xs font-bold truncate max-w-full">{row.username}</span>
                    <span className="text-[11px] font-bold text-secondary tabular-nums">
                      {formatBrix(row.total_brix_produced)}
                    </span>
                    <div
                      className={`w-full rounded-t-xl border border-white/10 bg-gradient-to-t ${colors[pos]} ${heights[pos]} flex items-start justify-center pt-1 font-black`}
                    >
                      #{idx + 1}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* List */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            {lbError && <p className="text-xs text-danger">Impossible de charger le classement.</p>}
            {!lbError && lbLoading && leaderboard.length === 0 && (
              <p className="text-xs text-text-muted text-center py-8">Chargement…</p>
            )}
            {!lbError && !lbLoading && leaderboard.length === 0 && (
              <p className="text-xs text-text-muted text-center py-8">Sois le premier à figurer au classement.</p>
            )}
            {leaderboard.length > 0 && (
              <ul className="divide-y divide-white/5">
                {leaderboard.slice(3).map((row, i) => {
                  const rank = i + 4;
                  const isMe = row.device_id === deviceId;
                  return (
                    <li
                      key={row.device_id}
                      className={`flex items-center justify-between py-2.5 px-2 text-sm rounded-md ${
                        isMe ? 'bg-primary/10 border border-primary/30' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-text-muted">
                          {rank}
                        </span>
                        <span className="truncate font-medium">{row.username}</span>
                        {isMe && (
                          <Badge variant="outline" className="border-primary text-primary text-[9px] px-1 py-0">
                            Toi
                          </Badge>
                        )}
                      </div>
                      <span className="font-bold text-primary tabular-nums">
                        {formatBrix(row.total_brix_produced)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {myRank >= 0 && (
            <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-primary/80">Ton rang</span>
              <span className="font-black text-primary">#{myRank + 1}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-text-primary overflow-hidden">
      {/* Atmospheric background */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(120% 80% at 50% -10%, hsl(var(--primary) / 0.35) 0%, transparent 55%), radial-gradient(80% 60% at 100% 100%, hsl(var(--secondary) / 0.25) 0%, transparent 60%), linear-gradient(180deg, hsl(240 30% 6%) 0%, hsl(240 25% 4%) 100%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.08] mix-blend-screen"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
        }}
      />

      <div className="max-w-md mx-auto px-4 pt-6 pb-16 flex flex-col gap-5">
        {/* Top bar */}
        <div className="flex flex-col items-center">
          <div className="relative w-full flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-white/5 backdrop-blur border border-white/10 hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>

            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-[0.35em] text-text-muted">Idle Reactor</span>
              <h1 className="text-xl font-black tracking-tight">
                BRIX <span className="text-primary">FACTORY</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-9 px-4 rounded-full bg-white/5 backdrop-blur border border-white/10 hover:bg-white/10 text-text-primary text-xs font-bold uppercase tracking-widest"
                >
                  <Info className="w-4 h-4 mr-1.5" />
                  Info
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[hsl(240_28%_7%)] border-white/10 text-text-primary max-w-sm">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary" /> Comment jouer
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 text-sm text-text-secondary mt-2">
                  <p>
                    <span className="text-text-primary font-semibold">Brix Factory</span> est un mode idle : ton
                    réacteur produit des Brix en continu, même hors-ligne (dans la limite du stockage).
                  </p>
                  <div>
                    <p className="text-text-primary font-semibold mb-1">Comment progresser</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><span className="text-primary">Récolter</span> vide le stockage et crédite ton solde.</li>
                      <li><span className="text-primary">Réacteur</span> : augmente la cadence de production.</li>
                      <li><span className="text-primary">Stockage</span> : agrandit la capacité (évite la saturation).</li>
                      <li><span className="text-primary">Amplificateur</span> : multiplie toute ta production.</li>
                      <li><span className="text-primary">Bonus quotidien</span> : reviens chaque jour pour un boost.</li>
                    </ul>
                  </div>
                  <p className="text-xs text-text-muted">
                    Astuce : monte le stockage assez tôt pour ne rien perdre pendant tes absences, puis investis dans
                    l'amplificateur pour un vrai palier de progression.
                  </p>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              onClick={openLeaderboard}
              className="h-9 px-4 rounded-full bg-gradient-to-r from-secondary to-primary text-white font-bold text-xs uppercase tracking-widest shadow-[0_6px_20px_-8px_hsl(var(--primary))] hover:opacity-90 relative"
            >
              <Trophy className="w-4 h-4 mr-1.5" />
              Classement
              {myRank >= 0 && myRank < 10 && (
                <span className="ml-2 text-[10px] font-bold bg-black/30 rounded-full px-1.5 py-0.5">
                  #{myRank + 1}
                </span>
              )}
            </Button>
          </div>
        </div>



        {/* Wallet card */}
        <div className="relative rounded-2xl p-5 border border-white/10 overflow-hidden bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-sm">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/30 blur-3xl" />
          <div className="relative flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Solde</div>
              <div className="text-4xl font-black tabular-nums bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                {formatBrix(state.brix)}
              </div>
              <div className="text-xs text-text-muted mt-1">Brix</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-text-muted mb-1 flex items-center gap-1 justify-end">
                <Zap className="w-3 h-3 text-secondary" /> Cadence
              </div>
              <div className="text-lg font-bold text-secondary tabular-nums">{ppMin.toFixed(2)}/min</div>
              <div className="text-[10px] text-text-muted mt-1">
                Total produit : <span className="text-text-secondary">{formatBrix(state.totalProduced)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Compact core: pulse + storage + harvest */}
        <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
              <span
                className="absolute inset-0 rounded-full bg-primary/30 animate-ping"
                style={{ animationDuration: '2.4s' }}
              />
              <span className="relative w-3 h-3 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-text-muted">Cœur du réacteur</div>
              <div className="text-sm font-semibold text-text-primary">
                {ppMin < 0.01 ? '≈ 0.00' : ppMin.toFixed(3)} <span className="text-text-muted font-normal">Brix / min</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-text-muted">Stock</div>
              <div className="text-sm font-bold tabular-nums text-secondary">
                {state.stored.toFixed(2)}
                <span className="text-text-muted font-normal"> / {cap}</span>
              </div>
            </div>
          </div>

          <div className="relative h-2 rounded-full bg-white/5 overflow-hidden border border-white/10">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
              style={{
                width: `${pctStorage}%`,
                background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)))',
                boxShadow: '0 0 12px hsl(var(--primary) / 0.5)',
              }}
            />
            {storageFull && <div className="absolute inset-0 animate-pulse bg-danger/20" />}
            <div ref={harvestFlashRef} className="absolute inset-0 bg-secondary/40 opacity-0" />
          </div>

          {storageFull && (
            <p className="text-[11px] text-danger flex items-center gap-1 -mt-2">
              <Flame className="w-3 h-3" /> Stockage saturé — récolte pour relancer.
            </p>
          )}

          <Button
            onClick={handleHarvest}
            disabled={state.stored <= 0}
            className="w-full h-12 text-sm font-bold uppercase tracking-widest bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] hover:bg-[position:100%_0] transition-[background-position] duration-700 disabled:opacity-40 disabled:from-white/10 disabled:to-white/10 shadow-[0_8px_30px_-10px_hsl(var(--primary)/0.6)]"
          >
            <Hammer className="w-4 h-4 mr-2" />
            Récolter{state.stored > 0 ? ` · ${state.stored.toFixed(2)}` : ''}
          </Button>
        </div>


        {/* Daily bonus */}
        <button
          onClick={handleClaimBonus}
          disabled={!bonus.available}
          className={`group relative w-full rounded-2xl p-4 border text-left transition-all ${
            bonus.available
              ? 'border-secondary/40 bg-gradient-to-r from-secondary/15 to-primary/10 hover:from-secondary/25 hover:to-primary/20 cursor-pointer'
              : 'border-white/10 bg-white/[0.03] cursor-default'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                bonus.available ? 'bg-secondary/30 text-secondary' : 'bg-white/5 text-text-muted'
              }`}
            >
              <Gift className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold flex items-center gap-2">
                Bonus quotidien
                {bonus.streak > 1 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-mono">
                    J{bonus.streak}
                  </span>
                )}
              </div>
              <div className="text-xs text-text-muted mt-0.5">
                {bonus.available
                  ? `Récupère +${formatBrix(bonus.amount)} Brix`
                  : `Revient dans ${formatDuration(bonus.nextIn)}`}
              </div>
            </div>
            {bonus.available && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Ouvrir →</span>
            )}
          </div>
        </button>

        {/* Upgrades */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em] flex items-center gap-2">
              <Sparkles className="w-3 h-3" /> Modules
            </h2>
            <span className="text-[10px] text-text-muted">Améliore ton usine</span>
          </div>
          <div className="space-y-2">
            <UpgradeRow
              icon={<Zap className="w-5 h-5" />}
              accent="from-primary/30 to-primary/10"
              title="Réacteur"
              level={state.reactorLevel}
              current={`${(reactorRate(state.reactorLevel) * 60).toFixed(2)}/min`}
              next={`${(reactorRate(state.reactorLevel + 1) * 60).toFixed(2)}/min`}
              cost={reactorCost(state.reactorLevel)}
              brix={state.brix}
              onBuy={buyReactor}
            />
            <UpgradeRow
              icon={<Package className="w-5 h-5" />}
              accent="from-secondary/30 to-secondary/10"
              title="Stockage"
              level={state.storageLevel}
              current={formatBrix(storageCapacity(state.storageLevel))}
              next={formatBrix(storageCapacity(state.storageLevel + 1))}
              cost={storageCost(state.storageLevel)}
              brix={state.brix}
              onBuy={buyStorage}
            />
            <UpgradeRow
              icon={<Sparkles className="w-5 h-5" />}
              accent="from-fuchsia-500/30 to-fuchsia-500/10"
              title="Amplificateur"
              level={state.amplifierLevel}
              current={`×${amplifierMult(state.amplifierLevel).toFixed(2)}`}
              next={`×${amplifierMult(state.amplifierLevel + 1).toFixed(2)}`}
              cost={amplifierCost(state.amplifierLevel)}
              brix={state.brix}
              onBuy={buyAmplifier}
            />
          </div>
        </div>
      </div>

      <UsernameModal
        isOpen={showUsername}
        onClose={() => setShowUsername(false)}
        onUsernameSet={() => {
          setShowUsername(false);
          uploadScore(state);
        }}
      />
    </div>
  );
};

interface UpgradeRowProps {
  icon: React.ReactNode;
  accent: string;
  title: string;
  level: number;
  current: string;
  next: string;
  cost: number;
  brix: number;
  onBuy: () => void;
}

const UpgradeRow: React.FC<UpgradeRowProps> = ({ icon, accent, title, level, current, next, cost, brix, onBuy }) => {
  const canAfford = brix >= cost;
  return (
    <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-3 flex items-center gap-3 overflow-hidden">
      <div className={`absolute inset-y-0 left-0 w-24 bg-gradient-to-r ${accent} opacity-60 pointer-events-none`} />
      <div className="relative w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-text-primary">
        {icon}
      </div>
      <div className="relative flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">{title}</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-text-muted">
            Lv{level}
          </span>
        </div>
        <div className="text-[11px] text-text-muted mt-0.5 truncate">
          {current} <span className="opacity-40">→</span>{' '}
          <span className="text-secondary font-medium">{next}</span>
        </div>
      </div>
      <Button
        size="sm"
        onClick={onBuy}
        disabled={!canAfford}
        className={
          canAfford
            ? 'bg-gradient-to-br from-primary to-secondary hover:opacity-90 text-white font-bold tabular-nums shadow-[0_6px_20px_-8px_hsl(var(--primary))]'
            : 'bg-white/5 text-text-muted border border-white/10 cursor-not-allowed tabular-nums'
        }
      >
        {formatBrix(cost)}
      </Button>
    </div>
  );
};
