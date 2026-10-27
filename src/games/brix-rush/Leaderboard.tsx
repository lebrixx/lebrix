import { Trophy, Skull } from "lucide-react";
import { toMeters } from "./world";

export type ScoreRow = { id: string; name: string; hue: number; x: number; best: number; dead: boolean; me: boolean };

export function Leaderboard({ rows }: { rows: ScoreRow[] }) {
  const sorted = [...rows].sort((a, b) => b.x - a.x);
  return (
    <aside className="game-board" aria-label="Classement en direct">
      <div className="game-board-heading">
        <Trophy size={15} className="brix-primary" aria-hidden="true" />
        <h2>Classement</h2>
        <span className="game-live-dot" aria-label="En direct" />
      </div>
      <div className="game-board-columns" aria-hidden="true">
        <span>Joueur</span><span>Actuel</span><span>Record</span>
      </div>
      <ol>
        {sorted.map((r, i) => (
          <li key={r.id} className={`runner-row ${r.me ? "runner-row-me" : ""}`}>
            <span className={`runner-rank ${i === 0 ? "runner-rank-first" : ""}`}>{i + 1}</span>
            <span className="runner-dot" style={{ ["--hue" as string]: r.hue }} />
            <span className="runner-name" title={r.name}>
              <span className="runner-name-label">{r.name}</span>
              {r.me && <small>toi</small>}
              {r.dead && <Skull size={12} className="brix-danger shrink-0" aria-label="Écrasé" />}
            </span>
            <span className="runner-score" aria-label={`Score actuel : ${toMeters(r.x)}`}>{toMeters(r.x)}</span>
            <span className="runner-score runner-best" aria-label={`Meilleur score : ${toMeters(r.best)}`}>{toMeters(r.best)}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}