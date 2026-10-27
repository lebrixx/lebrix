import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RunnerGame } from '@/games/brix-rush/RunnerGame';
import { Leaderboard, type ScoreRow } from '@/games/brix-rush/Leaderboard';
import { useIdentity } from '@/games/brix-rush/identity';
import { usePublicLobby, randomCode, useRoom } from '@/games/brix-rush/net';
import { COURSE_SEED, MAX_PLAYERS } from '@/games/brix-rush/world';
import { startGameSession } from '@/utils/scoresApi';
import type { BoostType } from '@/types/boosts';
import { getUsername } from '@/utils/localIdentity';
import { resolveBrixUsername } from '@/games/brix-rush/username';
import brixRushLogo from '@/assets/brix-rush-logo.png';

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

type Room = { code: string; public: boolean; solo: boolean };

export function BrixRushGame({ onBack, onGameOver, onSetBoosts }: Props) {
  const { me, ready } = useIdentity();
  const name = resolveBrixUsername(getUsername());
  const [code, setCode] = useState('');
  const [room, setRoom] = useState<Room | null>(null);
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const { players, status, remote, send, animalsRef } = useRoom(room?.code ?? '', room ? me : null, room?.public ?? false, room?.solo ?? false);
  const findPublicRoom = usePublicLobby(me, room?.public && !room.solo ? room.code : null);
  const gameOver = useRef(onGameOver);
  gameOver.current = onGameOver;
  const ok = !!name && me?.name === name;

  const setBoosts = useRef(onSetBoosts);
  useEffect(() => {
    setBoosts.current?.([]);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600&family=Russo+One&display=swap';
    document.head.appendChild(link);
    return () => { link.remove(); };
  }, []);

  const go = useCallback((next: Room) => {
    const currentName = resolveBrixUsername(getUsername());
    if (!ready || !me || !currentName || me.name !== currentName) return;
    setRows([]);
    startGameSession();
    setRoom(next);
  }, [me, ready]);

  useEffect(() => {
    if (!busy || !ok || !ready) return;
    let active = true;
    findPublicRoom().then(found => {
      if (!active) return;
      go({ code: found ?? randomCode(), public: true, solo: false });
      setBusy(false);
    });
    return () => { active = false; };
  }, [busy, ok, ready, go, findPublicRoom]);

  const death = useCallback((score: number, duration: number) => {
    gameOver.current?.(score, duration);
    startGameSession();
  }, []);

  const menu = useCallback(() => { setRoom(null); setRows([]); }, []);

  return createPortal(
    <div className={`brix-original game-screen${room && status !== 'full' ? ' brix-race' : ''}`}>
      {!room ? <main className="arcade-bg brix-home">
        <Button variant="ghost" className="brix-exit" onClick={onBack} aria-label="Retour à Lucky Stop"><Home /></Button>
        <div className="brix-home-inner">
          <h1 className="flex justify-center"><img src={brixRushLogo} alt="BRIX RUSH" className="h-36 w-full max-w-72 object-contain" /></h1>
          <p className="mt-4 text-center brix-muted">Même ligne de départ. {MAX_PLAYERS} coureurs max. Pas de fin.</p>
          <div className="panel mt-8 space-y-4 p-6">
            <p className="text-sm uppercase brix-muted">Pseudo</p>
            <p className="brix-username">{name ?? 'Pseudo requis'}</p>
            <Button variant="ghost" className="arcade-btn w-full" disabled={!ok || busy || !ready} onClick={() => go({ code: randomCode(), public: true, solo: true })}>Jouer seul</Button>
            <Button variant="ghost" className="arcade-btn arcade-btn-alt w-full" disabled={!ok || busy || !ready} onClick={() => setBusy(true)}>{busy ? "Recherche d’une salle…" : 'Multijoueur'}</Button>
            <div className="brix-friends pt-4">
              <p className="mb-2 text-sm uppercase brix-muted">Entre amis</p>
              <div className="flex gap-2">
                <input aria-label="Code de salle" className="arcade-input uppercase" maxLength={5} value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="CODE" />
                <Button variant="ghost" className="arcade-btn arcade-btn-ghost" disabled={!ok || code.length < 4 || !ready} onClick={() => go({ code, public: false, solo: false })}>Rejoindre</Button>
              </div>
              <Button variant="link" className="brix-private mt-3 w-full text-sm" disabled={!ok || !ready} onClick={() => go({ code: randomCode(), public: false, solo: false })}>Créer une salle privée</Button>
            </div>
          </div>
        </div>
      </main> : status === 'full' ? <main className="arcade-bg brix-full">
        <p className="brix-display text-4xl brix-danger">Salle pleine</p>
        <p className="brix-muted">{MAX_PLAYERS} coureurs sont déjà dans la salle {room.code}.</p>
        <Button variant="ghost" className="arcade-btn" onClick={menu}>Retour</Button>
      </main> : me && <>
        <RunnerGame key={room.code} seed={COURSE_SEED} me={me} remote={remote} send={send} animals={animalsRef} onScores={setRows} onMenu={menu} onDeath={death} />
        <div className="game-hud">
          <Button variant="ghost" className="brix-hud-title brix-display brix-primary text-glow" onClick={menu}>BRIX RUSH</Button>
          <span className="chip">{room.public ? 'Publique' : 'Privée'} · {room.code}</span>
          <span className="chip">{players.length}/{MAX_PLAYERS}{status === 'connecting' ? ' · connexion…' : status === 'error' ? ' · hors ligne' : ''}</span>
        </div>
        <Leaderboard rows={rows} />
      </>}
    </div>, document.body);
}
