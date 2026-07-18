import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Factory, Zap, Package, Sparkles, Gift, Trophy, RefreshCw, Hammer } from 'lucide-react';
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
  const [tick, setTick] = useState(0);
  const [leaderboard, setLeaderboard] = useState<BrixLeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(false);
  const [lbError, setLbError] = useState<string | null>(null);
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

  // Live production loop (1s)
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

  // Save on unmount / visibility change
  useEffect(() => {
    const onHide = () => saveState({ ...state, lastTick: Date.now() });
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onHide);
    };
  }, [state]);

  // Leaderboard
  const loadLeaderboard = async () => {
    setLbLoading(true);
    setLbError(null);
    try {
      const rows = await fetchBrixLeaderboard(50);
      setLeaderboard(rows);
    } catch (e: any) {
      setLbError(e?.message ?? 'Erreur');
    } finally {
      setLbLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const uploadScore = async (s: BrixFactoryState) => {
    const now = Date.now();
    if (now - lastSubmitRef.current < 15000) return; // throttle 15s
    if (!getUsername()) return;
    lastSubmitRef.current = now;
    const res = await submitBrixScore({
      totalProduced: s.totalProduced,
      reactorLevel: s.reactorLevel,
      storageLevel: s.storageLevel,
      amplifierLevel: s.amplifierLevel,
    });
    if (res.success) {
      loadLeaderboard();
    }
  };

  const cap = storageCapacity(state.storageLevel);
  const pctStorage = cap > 0 ? Math.min(100, (state.stored / cap) * 100) : 0;
  const storageFull = state.stored >= cap - 0.5;
  const ppMin = productionPerMin(state);

  const handleHarvest = () => {
    const gained = Math.floor(state.stored);
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
    // Flash
    if (harvestFlashRef.current) {
      harvestFlashRef.current.classList.remove('animate-ping');
      // reflow
      void harvestFlashRef.current.offsetWidth;
      harvestFlashRef.current.classList.add('animate-ping');
    }
    if (!getUsername()) {
      setShowUsername(true);
    } else {
      uploadScore(next);
    }
  };

  const buyReactor = () => {
    const cost = reactorCost(state.reactorLevel);
    if (state.brix < cost) return;
    const next = { ...state, brix: state.brix - cost, reactorLevel: state.reactorLevel + 1 };
    setState(next); saveState(next);
  };
  const buyStorage = () => {
    const cost = storageCost(state.storageLevel);
    if (state.brix < cost) return;
    const next = { ...state, brix: state.brix - cost, storageLevel: state.storageLevel + 1 };
    setState(next); saveState(next);
  };
  const buyAmplifier = () => {
    const cost = amplifierCost(state.amplifierLevel);
    if (state.brix < cost) return;
    const next = { ...state, brix: state.brix - cost, amplifierLevel: state.amplifierLevel + 1 };
    setState(next); saveState(next);
  };

  const bonus = dailyBonusStatus(state);
  const handleClaimBonus = () => {
    if (!bonus.available) return;
    const next = claimDailyBonus(state);
    setState(next); saveState(next);
    toast({ title: '🎁 Bonus quotidien', description: `+${formatBrix(bonus.amount)} Brix (jour ${bonus.streak})` });
    if (!getUsername()) setShowUsername(true);
    else uploadScore(next);
  };

  const deviceId = getDeviceId();
  const myRank = leaderboard.findIndex((r) => r.device_id === deviceId);

  return (
    <div className="min-h-screen bg-gradient-game text-text-primary flex flex-col p-4 pt-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="sm" onClick={onBack} className="border-wheel-border">
          <ArrowLeft className="w-4 h-4 mr-1" /> Menu
        </Button>
        <div className="flex items-center gap-2">
          <Factory className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">Brix Factory</h1>
        </div>
        <div className="w-16" />
      </div>

      {/* Stats */}
      <Card className="p-4 bg-wheel-segment/50 border-wheel-border mb-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-text-muted text-xs">Brix</div>
            <div className="text-2xl font-bold text-primary">{formatBrix(state.brix)}</div>
          </div>
          <div className="text-right">
            <div className="text-text-muted text-xs flex items-center justify-end gap-1"><Zap className="w-3 h-3" /> Production</div>
            <div className="text-lg font-semibold text-secondary">{ppMin.toFixed(1)} / min</div>
          </div>
          <div>
            <div className="text-text-muted text-xs">Total produit</div>
            <div className="font-semibold">{formatBrix(state.totalProduced)}</div>
          </div>
          <div className="text-right">
            <div className="text-text-muted text-xs">Stockage</div>
            <div className="font-semibold">{formatBrix(state.stored)} / {formatBrix(cap)}</div>
          </div>
        </div>
      </Card>

      {/* Reactor visual + harvest */}
      <Card className="p-6 bg-wheel-segment/40 border-wheel-border mb-4 relative overflow-hidden">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
            <div className="absolute inset-3 rounded-full bg-primary/30 blur-md animate-pulse" style={{ animationDelay: '150ms' }} />
            <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-primary via-secondary to-primary shadow-2xl shadow-primary/50 flex items-center justify-center">
              <Factory className="w-12 h-12 text-white" />
            </div>
            <div ref={harvestFlashRef} className="absolute inset-0 rounded-full bg-secondary/40 opacity-0" />
          </div>
          <div className="w-full">
            <Progress value={pctStorage} className="h-3" />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>{Math.floor(pctStorage)}%</span>
              {storageFull && <span className="text-danger font-semibold">Stockage plein !</span>}
            </div>
          </div>
          <Button
            onClick={handleHarvest}
            disabled={state.stored < 1}
            className="w-full h-14 text-lg bg-gradient-primary hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            <Hammer className="w-5 h-5 mr-2" />
            Récolter {state.stored >= 1 ? formatBrix(state.stored) : ''}
          </Button>
          {storageFull && (
            <p className="text-xs text-danger text-center">
              Récolte tes Brix pour relancer la production.
            </p>
          )}
        </div>
      </Card>

      {/* Upgrades */}
      <div className="mb-4">
        <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Améliorations
        </h2>
        <div className="space-y-2">
          <UpgradeRow
            icon={<Zap className="w-5 h-5" />}
            title="Réacteur"
            level={state.reactorLevel}
            current={`+${(reactorRate(state.reactorLevel) * 60).toFixed(1)} Brix/min`}
            next={`+${(reactorRate(state.reactorLevel + 1) * 60).toFixed(1)} Brix/min`}
            cost={reactorCost(state.reactorLevel)}
            brix={state.brix}
            onBuy={buyReactor}
          />
          <UpgradeRow
            icon={<Package className="w-5 h-5" />}
            title="Stockage"
            level={state.storageLevel}
            current={`${formatBrix(storageCapacity(state.storageLevel))}`}
            next={`${formatBrix(storageCapacity(state.storageLevel + 1))}`}
            cost={storageCost(state.storageLevel)}
            brix={state.brix}
            onBuy={buyStorage}
          />
          <UpgradeRow
            icon={<Sparkles className="w-5 h-5" />}
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

      {/* Daily bonus */}
      <Card className="p-4 bg-wheel-segment/40 border-wheel-border mb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-secondary" />
            <div>
              <div className="font-semibold text-sm">Bonus quotidien</div>
              <div className="text-xs text-text-muted">
                {bonus.available
                  ? `Récupère +${formatBrix(bonus.amount)} Brix (jour ${bonus.streak})`
                  : `Prochain bonus dans ${formatDuration(bonus.nextIn)}`}
              </div>
            </div>
          </div>
          <Button size="sm" disabled={!bonus.available} onClick={handleClaimBonus} className="bg-secondary hover:bg-secondary/90">
            Récupérer
          </Button>
        </div>
      </Card>

      {/* Leaderboard */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
          <Trophy className="w-4 h-4" /> Classement
        </h2>
        <Button size="sm" variant="ghost" onClick={loadLeaderboard} disabled={lbLoading}>
          <RefreshCw className={`w-4 h-4 ${lbLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      <Card className="p-3 bg-wheel-segment/40 border-wheel-border">
        {lbError && <p className="text-xs text-danger">Impossible de charger le classement.</p>}
        {!lbError && lbLoading && leaderboard.length === 0 && (
          <p className="text-xs text-text-muted text-center py-4">Chargement…</p>
        )}
        {!lbError && !lbLoading && leaderboard.length === 0 && (
          <p className="text-xs text-text-muted text-center py-4">Sois le premier à figurer au classement !</p>
        )}
        {leaderboard.length > 0 && (
          <ul className="divide-y divide-wheel-border/50 max-h-80 overflow-y-auto">
            {leaderboard.map((row, i) => {
              const isMe = row.device_id === deviceId;
              return (
                <li
                  key={row.device_id}
                  className={`flex items-center justify-between py-2 px-1 text-sm ${isMe ? 'bg-primary/10 rounded' : ''}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-6 text-xs font-bold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-text-muted'}`}>
                      #{i + 1}
                    </span>
                    <span className="truncate">{row.username}</span>
                    {isMe && <Badge variant="outline" className="border-primary text-primary text-[10px] px-1 py-0">Toi</Badge>}
                  </div>
                  <span className="font-semibold text-primary">{formatBrix(row.total_brix_produced)}</span>
                </li>
              );
            })}
          </ul>
        )}
        {myRank >= 0 && (
          <p className="text-xs text-text-muted mt-2 text-center">Ton rang : #{myRank + 1}</p>
        )}
      </Card>

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
  title: string;
  level: number;
  current: string;
  next: string;
  cost: number;
  brix: number;
  onBuy: () => void;
}

const UpgradeRow: React.FC<UpgradeRowProps> = ({ icon, title, level, current, next, cost, brix, onBuy }) => {
  const canAfford = brix >= cost;
  return (
    <Card className="p-3 bg-wheel-segment/40 border-wheel-border">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-sm">{title}</div>
            <Badge variant="outline" className="text-[10px]">Lv{level}</Badge>
          </div>
          <div className="text-xs text-text-muted truncate">
            {current} → <span className="text-secondary">{next}</span>
          </div>
        </div>
        <Button
          size="sm"
          onClick={onBuy}
          disabled={!canAfford}
          className={canAfford ? 'bg-primary hover:bg-primary/90' : 'bg-wheel-segment/50 text-text-muted cursor-not-allowed'}
        >
          {formatBrix(cost)}
        </Button>
      </div>
    </Card>
  );
};
