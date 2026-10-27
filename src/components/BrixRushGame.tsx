import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Car, Fence } from 'lucide-react';
import { RunnerGame } from '@/games/brix-rush/RunnerGame';
import { GameHUD } from '@/components/GameHUD';
import { GameStartOverlay } from '@/components/GameStartOverlay';
import { GameOverActions } from '@/components/GameOverActions';
import { ShieldUsedFlash } from '@/components/ShieldUsedFlash';
import { ReviveUsedFlash } from '@/components/ReviveUsedFlash';
import { ModeID } from '@/constants/modes';
import { BoostType } from '@/types/boosts';
import { useLanguage, translations } from '@/hooks/useLanguage';
import { useInGameCoins } from '@/hooks/useInGameCoins';
import { startGameSession, resetSubmissionAfterRevive } from '@/utils/scoresApi';

interface Props {
  onBack?: () => void;
  onGameOver?: (score: number, duration: number) => void;
  isSoundMuted?: boolean;
  onToggleSound?: () => void;
  playSuccess?: () => void;
  playFailure?: () => void;
  selectedBoosts?: string[];
  onSetBoosts?: (boosts: BoostType[]) => void;
  coins?: number;
  onEarnCoin?: (amount: number) => void;
}

export function BrixRushGame({ onBack, onGameOver, isSoundMuted, onToggleSound, playSuccess, playFailure, selectedBoosts, onSetBoosts, coins = 0, onEarnCoin }: Props) {
  const { language } = useLanguage();
  const t = translations[language];
  const [phase, setPhase] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => {
    try { return JSON.parse(localStorage.getItem('luckyStopGame') || '{}').bestScore_brix_rush || 0; }
    catch { return 0; }
  });
  const [menuBoosts, setMenuBoosts] = useState<BoostType[]>((selectedBoosts || []) as BoostType[]);
  useEffect(() => { setMenuBoosts((selectedBoosts || []) as BoostType[]); }, [selectedBoosts]);
  const [boostPicker, setBoostPicker] = useState(false);
  const [run, setRun] = useState({ key: 0, initialCol: 0, graceMs: 0, shield: false });
  const [shieldFlash, setShieldFlash] = useState(0);
  const [reviveFlash, setReviveFlash] = useState(0);
  const reviveArmed = useRef(false);
  const startedAt = useRef(0);
  const elapsedAtDeath = useRef(0);
  const lastScore = useRef(0);
  const coinsDisplay = useInGameCoins(coins, phase === 'playing', onEarnCoin);

  const start = useCallback(() => {
    const initialCol = menuBoosts.includes('start_20') ? 20 : 0;
    lastScore.current = initialCol;
    setScore(initialCol);
    reviveArmed.current = menuBoosts.includes('revive');
    startedAt.current = Date.now();
    elapsedAtDeath.current = 0;
    startGameSession();
    onSetBoosts?.(menuBoosts);
    setRun(previous => ({ key: previous.key + 1, initialCol, graceMs: initialCol > 0 ? 2000 : 0, shield: menuBoosts.includes('shield') }));
    setPhase('playing');
  }, [menuBoosts, onSetBoosts]);

  const revive = useCallback(() => {
    resetSubmissionAfterRevive();
    startedAt.current = Date.now() - elapsedAtDeath.current * 1000;
    setRun(previous => ({ key: previous.key + 1, initialCol: lastScore.current, graceMs: 2000, shield: false }));
    setPhase('playing');
    setReviveFlash(previous => previous + 1);
  }, []);

  const die = useCallback((finalScore: number) => {
    lastScore.current = finalScore;
    elapsedAtDeath.current = Math.max(0, (Date.now() - startedAt.current) / 1000);
    if (reviveArmed.current) {
      reviveArmed.current = false;
      revive();
      return;
    }
    setScore(finalScore);
    playFailure?.();
    try {
      const saved = JSON.parse(localStorage.getItem('luckyStopGame') || '{}');
      const nextBest = Math.max(saved.bestScore_brix_rush || 0, finalScore);
      saved.bestScore_brix_rush = nextBest;
      localStorage.setItem('luckyStopGame', JSON.stringify(saved));
      setBest(nextBest);
    } catch { /* Storage unavailable */ }
    setPhase('gameover');
    onGameOver?.(finalScore, elapsedAtDeath.current);
  }, [onGameOver, playFailure, revive]);

  const handleScore = useCallback((next: number) => {
    lastScore.current = Math.max(lastScore.current, next);
    setScore(previous => Math.max(previous, next));
    playSuccess?.();
  }, [playSuccess]);

  return (
    <div className="brix-game">
      {phase !== 'gameover' && <GameHUD score={score} coins={coinsDisplay} onBack={onBack} isSoundMuted={isSoundMuted} onToggleSound={onToggleSound} />}
      <div className="brix-playfield">
        {phase === 'playing' && <RunnerGame key={run.key} initialCol={run.initialCol} graceMs={run.graceMs} shield={run.shield} onShieldUsed={() => setShieldFlash(previous => previous + 1)} onScore={handleScore} onDie={die} />}
        <ShieldUsedFlash triggerKey={shieldFlash} />
        <ReviveUsedFlash triggerKey={reviveFlash} />
        {phase === 'menu' && <div className="brix-start"><GameStartOverlay title="Brix Rush" bestValue={best} currentMode={ModeID.BRIX_RUSH} selectedBoosts={menuBoosts} onSelectedBoostsChange={setMenuBoosts} defaultBoostsOpen={boostPicker} onStart={start} rules={[
          { icon: <ArrowRight className="h-4 w-4 text-primary" />, title: t.brixCross, desc: t.brixCrossDesc },
          { icon: <Car className="h-4 w-4 text-danger" />, title: t.brixDodge, desc: t.brixDodgeDesc, accent: 'danger' },
          { icon: <Fence className="h-4 w-4 text-success" />, title: t.brixFences, desc: t.brixFencesDesc },
        ]} /></div>}
        {phase === 'gameover' && <GameOverActions onMenu={() => onBack?.()} onReplay={start} onOpenBoosts={() => { setBoostPicker(true); setPhase('menu'); }} onRevive={revive} score={score} best={best} mode={ModeID.BRIX_RUSH} />}
      </div>
    </div>
  );
}