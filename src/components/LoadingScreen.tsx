import { useEffect, useState } from "react";
import crownUrl from "@/assets/loader/crown.png";
import titleUrl from "@/assets/loader/title.png";
import "./LoadingScreen.css";

type Props = {
  /** Progression 0 → 100 */
  progress: number;
  /** Passe à true quand tout est chargé : l'écran fait un fondu puis disparaît */
  done: boolean;
  /** Appelé à la fin du fondu de sortie */
  onFinished?: () => void;
};

export default function LoadingScreen({ progress, done, onFinished }: Props) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!done) return;
    const t1 = setTimeout(() => setExiting(true), 250);
    const t2 = setTimeout(() => onFinished?.(), 250 + 650);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [done, onFinished]);

  const pct = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div
      className={`ls-loader${exiting ? " ls-exit" : ""}`}
      role="progressbar"
      aria-label="Chargement de Lucky Stop"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
    >
      <div className="ls-rays" />
      <div className="ls-glow" />

      <div className="ls-logo">
        <div className="ls-crown-wrap">
          <div className="ls-float">
            <img className="ls-crown" src={crownUrl} alt="" draggable={false} />
            <div className="ls-shine ls-shine--crown" />
          </div>
        </div>
        <div className="ls-title-wrap">
          <img className="ls-title" src={titleUrl} alt="Lucky Stop" draggable={false} />
          <div className="ls-shine" />
        </div>
        <span className="ls-sparkle" />
        <span className="ls-sparkle" />
        <span className="ls-sparkle" />
        <span className="ls-sparkle" />
        <span className="ls-sparkle" />
      </div>

      <div className="ls-progress">
        <div className="ls-bar">
          <div className="ls-bar-fill" style={{ width: `${Math.max(pct, 4)}%` }} />
        </div>
        <div className="ls-label">{pct < 100 ? `Chargement… ${pct}%` : "C'est parti !"}</div>
      </div>
    </div>
  );
}
