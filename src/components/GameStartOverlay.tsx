import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Zap, Trophy, X } from 'lucide-react';
import { BOOSTS, BoostType } from '@/types/boosts';
import { useBoosts } from '@/hooks/useBoosts';
import { ModeType, ModeID } from '@/constants/modes';

export interface GameRule {
  icon: React.ReactNode;
  title: string;
  desc: React.ReactNode;
  accent?: 'default' | 'highlight' | 'danger';
}

interface GameStartOverlayProps {
  title: string;
  /** Tailwind classes applied to the gradient text title */
  titleGradient?: string;
  bestLabel?: string;
  bestValue: string | number;
  rules: GameRule[];
  currentMode?: ModeType;
  selectedBoosts: BoostType[];
  onSelectedBoostsChange: (b: BoostType[]) => void;
  onStart: () => void;
  hideBoosts?: boolean;
}

export const GameStartOverlay: React.FC<GameStartOverlayProps> = ({
  title,
  titleGradient = 'from-cyan-300 via-fuchsia-300 to-pink-300',
  bestLabel = 'Record',
  bestValue,
  rules,
  currentMode,
  selectedBoosts,
  onSelectedBoostsChange,
  onStart,
  hideBoosts = false,
}) => {
  const [showBoostPicker, setShowBoostPicker] = useState(false);
  const { getBoostCount } = useBoosts();

  const isBoostAvailable = (boostId: BoostType): boolean => {
    if (currentMode === ModeID.MEMOIRE_EXPERT) return false;
    if (currentMode === 'arc_changeant' && (boostId === 'shield' || boostId === 'start_20')) return false;
    return true;
  };

  const toggle = (id: BoostType) => {
    if (!isBoostAvailable(id)) return;
    onSelectedBoostsChange(
      selectedBoosts.includes(id)
        ? selectedBoosts.filter(b => b !== id)
        : [...selectedBoosts, id]
    );
  };

  return (
    <>
      {!showBoostPicker && (
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-start p-4 pt-2 gap-4 animate-fade-in"
          onClick={onStart}
          style={{ cursor: 'pointer' }}
        >
          {/* Titre + record */}
          <div className="w-full max-w-md text-center">
            <h2 className={`text-3xl font-extrabold mb-1 bg-gradient-to-r ${titleGradient} bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(232,121,249,0.4)]`}>
              {title}
            </h2>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-wheel-border">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] uppercase tracking-wider text-text-muted">{bestLabel}</span>
              <span className="text-sm font-bold tabular-nums text-amber-300">{bestValue}</span>
            </div>
          </div>

          {/* Règles */}
          <div className="w-full max-w-sm space-y-1.5 text-left">
            {rules.map((r, i) => (
              <div
                key={i}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl backdrop-blur-sm ${
                  r.accent === 'highlight'
                    ? 'bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-400/40'
                    : r.accent === 'danger'
                    ? 'bg-black/55 border border-pink-400/40'
                    : 'bg-black/55 border border-wheel-border/60'
                }`}
              >
                <div className="shrink-0">{r.icon}</div>
                <div className="text-[11px] text-text-secondary">
                  <span className="font-bold text-text-primary">{r.title}</span>
                  {' '}— {r.desc}
                </div>
              </div>
            ))}
          </div>

          {/* Bouton boost + libellé */}
          {!hideBoosts && (
            <div className="w-full max-w-md flex items-center justify-center gap-3 mt-6">
              <Button
                onClick={(e) => { e.stopPropagation(); setShowBoostPicker(true); }}
                variant="outline"
                className="relative border-primary/40 bg-primary/10 backdrop-blur-sm hover:bg-primary/20 hover:border-primary/60 hover:scale-105 transition-all duration-300 shadow-[0_0_12px_hsl(var(--primary)/0.25)] shrink-0"
              >
                <Zap className="w-5 h-5 mr-2 text-primary" />
                Boosts
                {selectedBoosts.length > 0 && (
                  <Badge className="ml-2 bg-primary text-primary-foreground border-0 h-5 px-1.5">
                    {selectedBoosts.length}
                  </Badge>
                )}
              </Button>
              <div className="text-xs text-text-primary font-semibold leading-tight max-w-[170px] drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                Équipe des bonus pour booster ta partie
              </div>
            </div>
          )}

          {/* Tap to play */}
          <div className="text-center select-none mt-10">
            <div className="text-xl font-bold text-primary animate-pulse flex items-center gap-2">
              <Play className="w-5 h-5 fill-primary" />
              Touche l'écran pour jouer
            </div>
          </div>
        </div>
      )}

      {showBoostPicker && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
          onClick={() => setShowBoostPicker(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-wheel-border bg-button-bg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-wheel-border">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-text-primary">Sélectionne tes boosts</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowBoostPicker(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4 space-y-2.5 max-h-[60vh] overflow-y-auto">
              {Object.values(BOOSTS).map(boost => {
                const count = getBoostCount(boost.id);
                const available = isBoostAvailable(boost.id);
                const selected = selectedBoosts.includes(boost.id);
                const disabled = count === 0 || !available;
                return (
                  <button
                    key={boost.id}
                    disabled={disabled}
                    onClick={() => toggle(boost.id)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                      disabled
                        ? 'opacity-40 cursor-not-allowed border-wheel-border bg-black/20'
                        : selected
                        ? 'border-primary bg-primary/15 scale-[0.99]'
                        : 'border-wheel-border bg-black/30 hover:border-primary/50'
                    }`}
                  >
                    <div className="text-3xl">{boost.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-primary text-sm">{boost.name}</span>
                        <Badge variant="secondary" className="text-[10px]">x{count}</Badge>
                      </div>
                      <div className="text-[11px] text-text-muted leading-tight mt-0.5">{boost.description}</div>
                      {!available && (
                        <div className="text-[10px] text-red-400 mt-0.5">Indisponible dans ce mode</div>
                      )}
                    </div>
                    {selected && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <div className="w-2 h-2 rounded-full bg-game-dark" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="p-4 border-t border-wheel-border">
              <Button
                onClick={() => setShowBoostPicker(false)}
                className="w-full bg-gradient-primary py-5 font-bold"
              >
                Valider
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
