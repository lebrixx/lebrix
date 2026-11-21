import { useCallback, useEffect, useRef, useState, type CSSProperties, type SyntheticEvent } from "react";
import { Check, X, Zap } from 'lucide-react';
import { BOOSTS, type BoostType } from '@/types/boosts';
import { useLanguage } from '@/hooks/useLanguage';
import { BOOST_FX_EVENT, RUN_BOOST_ORDER, consumeRunBoosts, getBoostStock, keepOwnedBoosts, type RunBoostFx } from '@/utils/runBoosts';

/* ------------------------------------------------------------------ */
/* Thèmes : chaque mode garde son identité visuelle                     */
/* ------------------------------------------------------------------ */
export type RunBoostTheme = 'rush' | 'assaut' | 'arena' | 'chrono' | 'altitude';

type Palette = {
  scrim: string; panel: string; border: string; accent: string; accentInk: string;
  text: string; muted: string; card: string; font: string; title: string; radius: number; titleCase?: 'uppercase';
};

const PALETTES: Record<RunBoostTheme, Palette> = {
  rush: {
    scrim: 'rgba(8,14,10,.72)', panel: 'linear-gradient(180deg,#1d2b1f,#121a14)', border: '#3d5a3f', accent: '#ffd23f', accentInk: '#1c1500',
    text: '#f4f7ee', muted: '#a9b9a4', card: 'rgba(255,255,255,.05)', font: "'Chakra Petch', system-ui, sans-serif", title: "'Russo One', system-ui, sans-serif", radius: 18, titleCase: 'uppercase',
  },
  assaut: {
    scrim: 'rgba(3,5,14,.78)', panel: 'linear-gradient(180deg,#121521,#08090f)', border: 'rgba(240,214,110,.24)', accent: '#f0d66e', accentInk: '#1a1504',
    text: '#eef3ff', muted: '#93a0bd', card: 'rgba(255,255,255,.04)', font: "'Work Sans', system-ui, sans-serif", title: "'Work Sans', system-ui, sans-serif", radius: 14, titleCase: 'uppercase',
  },
  arena: {
    scrim: 'rgba(12,8,4,.78)', panel: 'linear-gradient(160deg,#2a2116,#15100a)', border: 'rgba(214,170,92,.5)', accent: '#e0a84a', accentInk: '#1d1205',
    text: '#f6ead2', muted: '#bfa982', card: 'rgba(255,220,160,.05)', font: "'Alegreya Sans', system-ui, sans-serif", title: "'Cinzel', serif", radius: 20, titleCase: 'uppercase',
  },
  chrono: {
    scrim: 'rgba(7,8,13,.8)', panel: 'linear-gradient(180deg,rgba(24,24,34,.96),rgba(10,11,17,.98))', border: 'rgba(227,197,141,.35)', accent: '#E3C58D', accentInk: '#14110b',
    text: '#eceae4', muted: 'rgba(236,234,228,.6)', card: 'rgba(255,255,255,.04)', font: "'Sora', system-ui, sans-serif", title: "'Sora', system-ui, sans-serif", radius: 26, titleCase: 'uppercase',
  },
  altitude: {
    scrim: 'rgba(5,3,20,.55)', panel: 'rgba(255,255,255,.1)', border: 'rgba(255,255,255,.22)', accent: '#ffffff', accentInk: '#140c33',
    text: '#ffffff', muted: 'rgba(255,255,255,.7)', card: 'rgba(255,255,255,.07)', font: "system-ui, -apple-system, 'Segoe UI', sans-serif", title: "system-ui, -apple-system, sans-serif", radius: 30, titleCase: 'uppercase',
  },
};

/* ------------------------------------------------------------------ */
/* Textes                                                               */
/* ------------------------------------------------------------------ */
type Lang = 'fr' | 'en' | 'es';
const COPY: Record<Lang, {
  title: string; sub: string; validate: string; none: string; owned: string; on: string; boosts: string;
  names: Record<BoostType, string>; desc: Record<BoostType, string>;
  fx: { shield: string; revive: string; start: string; converter: string };
}> = {
  fr: {
    title: 'Boosts', sub: 'Activés au lancement de la prochaine partie', validate: 'Valider', none: 'Tu n’as aucun boost. Gagne-en avec la roue, les défis et la boutique.',
    owned: 'en stock', on: 'Actif', boosts: 'Boosts',
    names: { shield: 'Bouclier', revive: 'Seconde chance', start_20: 'Départ à 20', bigger_zone: 'Convertisseur' },
    desc: {
      shield: 'Encaisse automatiquement ton prochain choc.',
      revive: 'Quand tu perds, tu repars aussitôt là où tu étais.',
      start_20: 'Commence la partie avec 20 points.',
      bigger_zone: 'Fin de partie : +1 pièce tous les 3 points.',
    },
    fx: { shield: 'Bouclier !', revive: 'Seconde chance !', start: '+20 au départ', converter: '+{n} pièces' },
  },
  en: {
    title: 'Boosts', sub: 'Activated when your next run starts', validate: 'Confirm', none: 'You have no boosts. Earn some from the wheel, challenges and shop.',
    owned: 'owned', on: 'On', boosts: 'Boosts',
    names: { shield: 'Shield', revive: 'Second chance', start_20: 'Start at 20', bigger_zone: 'Converter' },
    desc: {
      shield: 'Automatically absorbs your next hit.',
      revive: 'When you lose, you instantly continue where you were.',
      start_20: 'Start the run with 20 points.',
      bigger_zone: 'End of run: +1 coin every 3 points.',
    },
    fx: { shield: 'Shield!', revive: 'Second chance!', start: '+20 head start', converter: '+{n} coins' },
  },
  es: {
    title: 'Boosts', sub: 'Se activan al empezar la próxima partida', validate: 'Validar', none: 'No tienes boosts. Consíguelos con la ruleta, los retos y la tienda.',
    owned: 'en stock', on: 'Activo', boosts: 'Boosts',
    names: { shield: 'Escudo', revive: 'Segunda oportunidad', start_20: 'Salida en 20', bigger_zone: 'Convertidor' },
    desc: {
      shield: 'Absorbe automáticamente tu próximo golpe.',
      revive: 'Cuando pierdes, sigues al instante donde estabas.',
      start_20: 'Empieza la partida con 20 puntos.',
      bigger_zone: 'Fin de partida: +1 moneda cada 3 puntos.',
    },
    fx: { shield: '¡Escudo!', revive: '¡Segunda oportunidad!', start: '+20 de salida', converter: '+{n} monedas' },
  },
};

export function useRunBoostCopy() {
  const { language } = useLanguage();
  return COPY[(language as Lang)] ?? COPY.fr;
}

/* ------------------------------------------------------------------ */
/* Sélection                                                            */
/* ------------------------------------------------------------------ */
export function useRunBoostSelection() {
  const [selected, setSelected] = useState<BoostType[]>([]);
  const [open, setOpen] = useState(false);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  // Si l'inventaire change (achat, autre écran), on retire ce qui n'est plus possédé.
  useEffect(() => {
    const sync = () => setSelected(prev => {
      const next = keepOwnedBoosts(prev);
      return next.length === prev.length ? prev : next;
    });
    window.addEventListener('boostsInventoryUpdate', sync);
    return () => window.removeEventListener('boostsInventoryUpdate', sync);
  }, []);

  /** Consomme la sélection au lancement d'une partie et la vide. */
  const take = useCallback((): BoostType[] => {
    const used = consumeRunBoosts(selectedRef.current);
    selectedRef.current = [];
    setSelected([]);
    return used;
  }, []);

  return { selected, setSelected, open, setOpen, take };
}

export const boostIcon = (id: BoostType) => BOOSTS[id].icon;

/* ------------------------------------------------------------------ */
/* Bouton générique (les modes peuvent aussi utiliser leurs propres classes) */
/* ------------------------------------------------------------------ */
export function RunBoostBadge({ selected, theme }: { selected: BoostType[]; theme: RunBoostTheme }) {
  const p = PALETTES[theme];
  if (!selected.length) return null;
  return (
    <span style={{ display: 'inline-flex', gap: 2, marginLeft: 6, padding: '1px 6px', borderRadius: 999, background: p.accent, color: p.accentInk, fontSize: '0.8em', lineHeight: 1.5 }}>
      {selected.map(id => <span key={id} aria-hidden>{boostIcon(id)}</span>)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Fenêtre de sélection (rendue dans l'écran du jeu pour hériter de sa rotation) */
/* ------------------------------------------------------------------ */
export function RunBoostPicker({ theme, open, selected, onChange, onClose, zIndex = 80 }: {
  theme: RunBoostTheme; open: boolean; selected: BoostType[]; onChange: (b: BoostType[]) => void; onClose: () => void; zIndex?: number;
}) {
  const p = PALETTES[theme];
  const c = useRunBoostCopy();
  const [, force] = useState(0);
  useEffect(() => {
    const refresh = () => force(n => n + 1);
    window.addEventListener('boostsInventoryUpdate', refresh);
    return () => window.removeEventListener('boostsInventoryUpdate', refresh);
  }, []);
  if (!open) return null;

  const total = RUN_BOOST_ORDER.reduce((s, id) => s + getBoostStock(id), 0);
  const toggle = (id: BoostType) => {
    if (getBoostStock(id) <= 0) return;
    onChange(selected.includes(id) ? selected.filter(b => b !== id) : [...selected, id]);
  };
  const stop = (e: SyntheticEvent) => e.stopPropagation();

  const panel: CSSProperties = {
    width: 'min(400px, 100%)', maxHeight: '100%', overflowY: 'auto', background: p.panel, border: `1px solid ${p.border}`,
    borderRadius: p.radius, color: p.text, fontFamily: p.font, boxShadow: '0 24px 60px rgba(0,0,0,.55)',
    backdropFilter: theme === 'altitude' ? 'blur(22px)' : undefined, WebkitBackdropFilter: theme === 'altitude' ? 'blur(22px)' : undefined,
  };

  return (
    <div
      role="dialog" aria-modal="true" aria-label={c.title}
      className="pointer-events-auto rb-scrim"
      onPointerDown={stop} onTouchStart={stop}
      onClick={(e) => { e.stopPropagation(); onClose(); }}
      style={{ position: 'absolute', inset: 0, zIndex, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: p.scrim, animation: 'rb-fade .18s ease-out' }}
    >
      <style>{RB_CSS}</style>
      <div style={panel} className="rb-panel" onClick={stop}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px 10px' }}>
          <span style={{ width: 34, height: 34, borderRadius: 12, display: 'grid', placeItems: 'center', background: p.accent, color: p.accentInk }}><Zap size={18} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: p.title, fontWeight: 800, fontSize: 18, letterSpacing: '.08em', textTransform: p.titleCase }}>{c.title}</div>
            <div style={{ fontSize: 11, color: p.muted }}>{c.sub}</div>
          </div>
          <button type="button" aria-label="Fermer" onClick={onClose} style={{ width: 34, height: 34, borderRadius: 999, display: 'grid', placeItems: 'center', background: p.card, border: `1px solid ${p.border}`, color: p.text }}><X size={16} /></button>
        </div>
        <div className="rb-list" style={{ padding: '6px 14px 4px', display: 'grid', gap: 8 }}>
          {RUN_BOOST_ORDER.map(id => {
            const stock = getBoostStock(id);
            const on = selected.includes(id);
            const disabled = stock <= 0;
            return (
              <button
                key={id} type="button" disabled={disabled} onClick={() => toggle(id)} aria-pressed={on}
                className="rb-item"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', textAlign: 'left', width: '100%',
                  borderRadius: Math.max(10, p.radius - 8), color: p.text, fontFamily: p.font,
                  background: on ? `color-mix(in srgb, ${p.accent} 18%, transparent)` : p.card,
                  border: `1.5px solid ${on ? p.accent : p.border}`, opacity: disabled ? 0.38 : 1,
                  boxShadow: on ? `0 0 18px color-mix(in srgb, ${p.accent} 35%, transparent)` : 'none',
                }}
              >
                <span style={{ fontSize: 28, lineHeight: 1, width: 34, textAlign: 'center' }}>{BOOSTS[id].icon}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <b style={{ fontSize: 14 }}>{c.names[id]}</b>
                    <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 999, border: `1px solid ${p.border}`, color: p.muted }}>×{stock} {c.owned}</span>
                  </span>
                  <span style={{ display: 'block', fontSize: 11, color: p.muted, marginTop: 2, lineHeight: 1.3 }}>{c.desc[id]}</span>
                </span>
                <span style={{ width: 24, height: 24, borderRadius: 999, flexShrink: 0, display: 'grid', placeItems: 'center', border: `2px solid ${on ? p.accent : p.border}`, background: on ? p.accent : 'transparent', color: p.accentInk }}>
                  {on && <Check size={14} strokeWidth={3} />}
                </span>
              </button>
            );
          })}
          {total === 0 && <p style={{ fontSize: 12, color: p.muted, textAlign: 'center', padding: '6px 4px 0' }}>{c.none}</p>}
        </div>
        <div style={{ padding: 14 }}>
          <button
            type="button" onClick={onClose}
            style={{ width: '100%', padding: '14px 0', borderRadius: Math.max(12, p.radius - 6), background: p.accent, color: p.accentInk, fontFamily: p.title, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase', fontSize: 13, border: 0 }}
          >
            {c.validate}{selected.length ? ` · ${selected.map(boostIcon).join(' ')}` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Effets en jeu : bouclier, seconde chance, départ, convertisseur      */
/* ------------------------------------------------------------------ */
export function RunBoostFxLayer({ theme, zIndex = 70 }: { theme: RunBoostTheme; zIndex?: number }) {
  const p = PALETTES[theme];
  const c = useRunBoostCopy();
  const [fx, setFx] = useState<(RunBoostFx & { id: number }) | null>(null);
  useEffect(() => {
    let timer = 0, n = 0;
    const on = (e: Event) => {
      const detail = (e as CustomEvent<RunBoostFx>).detail;
      if (!detail) return;
      setFx({ ...detail, id: ++n });
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setFx(null), detail.kind === 'converter' ? 2200 : 1300);
    };
    window.addEventListener(BOOST_FX_EVENT, on);
    return () => { window.removeEventListener(BOOST_FX_EVENT, on); window.clearTimeout(timer); };
  }, []);
  if (!fx) return null;
  const icon = fx.kind === 'shield' ? '🛡️' : fx.kind === 'revive' ? '❤️‍🔥' : fx.kind === 'start' ? '🚀' : '💰';
  const text = fx.kind === 'converter' ? c.fx.converter.replace('{n}', String(fx.amount)) : c.fx[fx.kind];
  const tone = fx.kind === 'shield' ? '#5eead4' : fx.kind === 'revive' ? '#fb7185' : fx.kind === 'start' ? p.accent : '#fcd34d';
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex, pointerEvents: 'none', display: 'flex', justifyContent: 'center', alignItems: fx.kind === 'converter' ? 'flex-start' : 'center' }}>
      <style>{RB_CSS}</style>
      {(fx.kind === 'shield' || fx.kind === 'revive') && <div key={`ring-${fx.id}`} className="rb-ring" style={{ borderColor: tone }} />}
      <div
        key={fx.id} className="rb-pop"
        style={{
          animationDuration: fx.kind === 'converter' ? '2.1s' : undefined,
          marginTop: fx.kind === 'converter' ? 'calc(env(safe-area-inset-top) + 84px)' : '-18vh',
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderRadius: 999,
          background: 'rgba(0,0,0,.6)', border: `1.5px solid ${tone}`, color: '#fff', fontFamily: p.title,
          fontWeight: 800, letterSpacing: '.06em', textTransform: p.titleCase, fontSize: 16,
          boxShadow: `0 0 26px color-mix(in srgb, ${tone} 55%, transparent)`, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <span style={{ fontSize: 24 }}>{icon}</span>{text}
      </div>
    </div>
  );
}

/** Petits indicateurs des boosts encore actifs pendant la partie. */
export function RunBoostChips({ armed, theme, style }: { armed: BoostType[]; theme: RunBoostTheme; style?: CSSProperties }) {
  const p = PALETTES[theme];
  if (!armed.length) return null;
  return (
    <div style={{ display: 'flex', gap: 6, pointerEvents: 'none', ...style }}>
      {armed.map(id => (
        <span key={id} className="rb-chip" style={{ width: 30, height: 30, borderRadius: 999, display: 'grid', placeItems: 'center', fontSize: 16, background: 'rgba(0,0,0,.5)', border: `1px solid ${p.accent}`, boxShadow: `0 0 12px color-mix(in srgb, ${p.accent} 40%, transparent)` }}>
          {boostIcon(id)}
        </span>
      ))}
    </div>
  );
}

const RB_CSS = `
@keyframes rb-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes rb-pop { 0% { transform: scale(.6); opacity: 0 } 18% { transform: scale(1.08); opacity: 1 } 30% { transform: scale(1) } 82% { opacity: 1 } 100% { transform: translateY(-14px); opacity: 0 } }
@keyframes rb-ring { 0% { transform: scale(.2); opacity: .9 } 100% { transform: scale(2.6); opacity: 0 } }
.rb-pop { animation: rb-pop 1.25s cubic-bezier(.2,.9,.3,1) forwards; }
.rb-ring { position: absolute; top: 50%; left: 50%; width: 120px; height: 120px; margin: -60px 0 0 -60px; border-radius: 999px; border: 4px solid; animation: rb-ring .7s ease-out forwards; }
.rb-scrim { container-type: size; }
@container (orientation: landscape) and (max-height: 560px) {
  .rb-panel { width: min(700px, 100%) !important; }
  .rb-list { grid-template-columns: 1fr 1fr; }
}
.rb-item { transition: transform .12s, background .15s, border-color .15s; cursor: pointer; }
.rb-item:active:not(:disabled) { transform: scale(.98); }
.rb-item:disabled { cursor: not-allowed; }
@media (prefers-reduced-motion: reduce) { .rb-pop, .rb-ring { animation-duration: .01s; } }
`;
