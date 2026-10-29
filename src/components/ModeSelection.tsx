import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowUpRight, Clock, Crosshair, AlertTriangle, Lock, Star, Trophy, Gamepad2, Ticket, Rocket, Target, Layers, Circle } from 'lucide-react';
import { cfgModes, ModeType, ModeID, RANKED_MODES, requiresTicket, MODE_UNLOCK_PRICES } from '@/constants/modes';
import { useLanguage, translations } from '@/hooks/useLanguage';
import { SlotMachine } from '@/components/SlotMachine';
import { isBonusActive, canSpinSlotToday, getActiveBonusMode } from '@/utils/dailyBonusMode';
import { getTickets } from '@/utils/ticketSystem';
import { hubCopy, modeArtwork } from './modeSelectionContent';
import luckyStopLogo from '@/assets/lucky-stop-logo.png';

interface ModeSelectionProps {
  currentMode: ModeType;
  gameStatus: 'idle' | 'running' | 'gameover';
  bestScores: Record<string, number>;
  unlockedModes: string[];
  onSelectMode: (mode: ModeType, selectedBoosts?: string[]) => void;
  onBack: () => void;
  onOpenShop: (target?: 'tickets') => void;
  onOpenChallenges?: () => void;
  onOpenReflexGrid?: () => void;
}

export const ModeSelection: React.FC<ModeSelectionProps> = ({
  currentMode,
  gameStatus,
  bestScores,
  unlockedModes,
  onSelectMode,
  onBack,
  onOpenShop,
}) => {
  const isGameRunning = gameStatus === 'running';
  const { language } = useLanguage();
  const t = translations[language];
  const [showSlotMachine, setShowSlotMachine] = useState(false);
  const [bonusMode, setBonusMode] = useState<ModeType | null>(getActiveBonusMode());
  const [tickets, setTickets] = useState<number>(getTickets());
  useEffect(() => { setTickets(getTickets()); }, [currentMode, gameStatus]);
  const canSpin = canSpinSlotToday();
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (canSpin || !bonusMode) return;
    const tick = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 1, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      if (diff <= 0) { setCountdown(''); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [canSpin, bonusMode]);

  const handleBonusActivated = (mode: ModeType) => setBonusMode(mode);

  const copy = hubCopy[language];
  const icons = [Gamepad2, Rocket, Crosshair, Target, Circle, Layers];

  useEffect(() => {
    if (document.querySelector('link[data-mode-hub-fonts]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600&family=Russo+One&display=swap';
    link.dataset.modeHubFonts = 'true';
    document.head.appendChild(link);
  }, []);

  return (
    <section className="games-home">
      <header className="games-header">
        <Button variant="outline" className="hub-back" onClick={onBack}><ArrowLeft />{copy.back}</Button>
        <img className="hub-logo" src={luckyStopLogo} alt="Lucky Stop" />
      </header>
      <div className="games-heading">
        <p className="games-eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <span>{String(RANKED_MODES.length).padStart(2, '0')} {copy.games}</span>
      </div>
      <div className="games-utilities">
        <Button variant="outline" className="hub-bonus" onClick={() => setShowSlotMachine(true)}>
          <Star />{canSpin ? t.bonusX2Available : bonusMode ? `${cfgModes[bonusMode].name} — ${t.bonusX2}` : t.bonusX2}
        </Button>
        {!canSpin && bonusMode && countdown && <span><Clock />{copy.nextSpin} {countdown}</span>}
      </div>
      <SlotMachine isOpen={showSlotMachine} onClose={() => setShowSlotMachine(false)} unlockedModes={unlockedModes} onBonusActivated={handleBonusActivated} />
      {isGameRunning && <div className="games-warning" role="status"><AlertTriangle /><div><p>{t.modeGameInProgressLabel}</p><p>{t.modeGameInProgressDescLabel}</p></div></div>}
      <div className="games-list">
        {RANKED_MODES.map((modeId, idx) => {
          const isLocked = !unlockedModes.includes(modeId);
          const ticketMode = requiresTicket(modeId);
          const needsTickets = ticketMode && tickets === 0;
          const Icon = icons[idx];
          const hasBonus = isBonusActive(modeId) && !isLocked;
          const label = isLocked ? t.unlockWithCoins.replace('{n}', String(MODE_UNLOCK_PRICES[modeId] ?? 0)) : needsTickets ? copy.getTickets : copy.play;
          return (
            <article key={modeId} className={`game-choice ${idx % 2 ? 'choice-alt' : ''}`}>
              <img src={modeArtwork[modeId]} alt="" width={1536} height={768} loading={idx === 0 ? 'eager' : 'lazy'} />
              <div className="choice-shade" />
              <div className="choice-content">
                <div className="choice-top"><span className="choice-number">{String(idx + 1).padStart(2, '0')} / {copy.categories[idx]}</span>
                  <span className="choice-record"><Trophy />{copy.record} {bestScores[modeId] || 0}{hasBonus && <b> · x2</b>}</span>
                </div>
                <h2>{cfgModes[modeId].name}</h2>
                <p>{copy.taglines[idx]}</p>
                <div className="choice-bottom">
                  <span className="choice-info"><Icon /><span>{ticketMode ? `1 ${copy.tickets}` : modeId === ModeID.BRIX_ARENA ? copy.action : copy.solo}
                    {modeId === ModeID.BRIX_RUSH && <small><Lock />{copy.soon}</small>}
                    {ticketMode && <small>{tickets} {copy.available}</small>}
                  </span></span>
                  <Button className="choice-play" disabled={isGameRunning} onClick={() => {
                    if (isLocked) onOpenShop();
                    else if (needsTickets) onOpenShop('tickets');
                    else onSelectMode(modeId);
                  }} aria-label={`${label} · ${cfgModes[modeId].name}`}>
                    {isLocked ? <Lock /> : needsTickets ? <Ticket /> : null}{label}{!isLocked && !needsTickets && <ArrowUpRight />}
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <footer className="games-footer"><span>BRIX PARTY</span><span>{copy.footer}</span></footer>
    </section>
  );
};
