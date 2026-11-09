// @ts-nocheck
/**
 * ALTITUDE — jeu de tour à empiler (plaque par plaque)
 * -----------------------------------------------------
 * Composant React autonome : aucun package à installer, aucun asset externe.
 * Contient tout le jeu : 3 styles (Classique, Briques, Néon), fond animé, sons générés,
 * « Parfait » qui agrandissent la plaque, pause, record sauvegardé, écran de fin.
 *
 * Utilisation :
 *   import AltitudeGame from "@/components/AltitudeGame";
 *   <AltitudeGame />                                   // plein écran
 *   <AltitudeGame onBackToMenu={() => navigate("/")} />  // branche le bouton « Retour au menu » de l'écran de fin
 *
 * Le jeu s'affiche en plein écran (position: fixed) au-dessus du reste de la page.
 * Tout le CSS est limité à la classe .altitude-root : il ne touche pas au reste de l'app.
 * Sauvegardes locales (localStorage) : altitude_best, altitude_style, altitude_muted.
 */
import { useEffect, useRef } from "react";

type AltitudeGameProps = {
  /** Appelé par le bouton « Retour au menu » de l'écran de fin (sinon le bouton ne fait rien). */
  onBackToMenu?: () => void;
  /** Lucky Stop bridge: run start / end. */
  onStart?: () => void;
  onGameOver?: (score: number, durationMs: number) => void;
};

export default function AltitudeGame({ onBackToMenu, onStart, onGameOver }: AltitudeGameProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const backRef = useRef(onBackToMenu);
  backRef.current = onBackToMenu;
  const startRef = useRef(onStart); startRef.current = onStart;
  const overRef = useRef(onGameOver); overRef.current = onGameOver;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.innerHTML = ALTITUDE_MARKUP;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const stop = startAltitude(root, { onBackToMenu: () => backRef.current && backRef.current(), onStart: () => startRef.current?.(), onGameOver: (s, d) => overRef.current?.(s, d) });
    return () => {
      stop();
      root.innerHTML = "";
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return (
    <>
      <style>{ALTITUDE_CSS}</style>
      <div ref={rootRef} className="altitude-root" />
    </>
  );
}

/* ============================== STYLES ============================== */
const ALTITUDE_CSS = `
  .altitude-root { --glass: rgba(255,255,255,.08); --stroke: rgba(255,255,255,.18); }
  .altitude-root, .altitude-root * { margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color:transparent; user-select:none; -webkit-user-select:none; }
  .altitude-root { position:fixed; inset:0; z-index:50; width:100%; height:100%; overflow:hidden; touch-action:none; background:#0b0820; color:#fff;
    font-family: -apple-system, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif; }
  .altitude-root canvas { position:fixed; inset:0; display:block; touch-action:none; }

  /* ---------- HUD ---------- */
  .altitude-root #hud { position:fixed; top:max(28px, env(safe-area-inset-top)); left:0; right:0; text-align:center; pointer-events:none;
    transition: opacity .5s, transform .5s; }
  .altitude-root #hud.alt-hidden { opacity:0; transform:translateY(-20px); }
  .altitude-root #score { font-size: clamp(64px, 14vw, 120px); font-weight:200; letter-spacing:-.04em; line-height:1;
    text-shadow: 0 6px 40px rgba(0,0,0,.35); font-variant-numeric: tabular-nums; }
  .altitude-root #score.bump { animation: alt-bump .35s cubic-bezier(.2,1.6,.4,1); }
  @keyframes alt-bump { 0%{transform:scale(1.18)} 100%{transform:scale(1)} }
  .altitude-root #alt { margin-top:6px; font-size:12px; letter-spacing:.35em; text-transform:uppercase; opacity:.65; font-weight:500; }

  .altitude-root #combo { position:fixed; top:34%; left:0; right:0; text-align:center; pointer-events:none; opacity:0;
    font-weight:800; font-size: clamp(22px,5vw,34px); letter-spacing:.3em; text-transform:uppercase;
    background: linear-gradient(90deg,#fff,#ffe9a8,#fff); -webkit-background-clip:text; background-clip:text; color:transparent;
    filter: drop-shadow(0 0 18px rgba(255,230,160,.65)); }
  .altitude-root #combo.show { animation: alt-pop 1s cubic-bezier(.2,.9,.3,1) forwards; }
  @keyframes alt-pop {
    0% { opacity:0; transform: translateY(14px) scale(.7); letter-spacing:.1em; }
    18% { opacity:1; transform: translateY(0) scale(1.08); }
    35% { transform: scale(1); letter-spacing:.3em; }
    75% { opacity:1; }
    100% { opacity:0; transform: translateY(-26px) scale(1); }
  }

  /* ---------- Overlays ---------- */
  .altitude-root .overlay { position:fixed; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;
    transition: opacity .6s ease, transform .6s ease; }
  .altitude-root .overlay.alt-hidden { opacity:0; pointer-events:none; transform: scale(1.04); }
  .altitude-root .overlay.alt-hidden * { pointer-events:none !important; }

  .altitude-root #menu { justify-content:flex-start; padding-top: 14vh; pointer-events:none; }
  .altitude-root .eyebrow { font-size:11px; letter-spacing:.6em; opacity:.6; font-weight:600; margin-bottom:14px; text-indent:.6em; }
  .altitude-root h1 { font-size: clamp(54px, 13vw, 110px); font-weight:800; letter-spacing:.12em; text-indent:.12em; line-height:.95;
    background: linear-gradient(180deg,#ffffff 0%, rgba(255,255,255,.55) 100%); -webkit-background-clip:text; background-clip:text; color:transparent;
    filter: drop-shadow(0 10px 40px rgba(0,0,0,.35)); }
  .altitude-root .tag { margin-top:16px; padding:0 28px; max-width:520px; text-align:center; font-size:15px; line-height:1.45; opacity:.75; font-weight:400; letter-spacing:.04em; }
  .altitude-root .cta { position:fixed; bottom: max(14vh, 90px); left:0; right:0; text-align:center; }
  .altitude-root .cta .pill { display:inline-flex; align-items:center; gap:12px; padding:16px 30px; border-radius:999px;
    background: var(--glass); border:1px solid var(--stroke); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
    font-size:13px; letter-spacing:.3em; font-weight:600; text-transform:uppercase; animation: alt-breathe 2.4s ease-in-out infinite;
    box-shadow: 0 10px 40px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.2); }
  .altitude-root .dot { width:8px; height:8px; border-radius:50%; background:#fff; box-shadow:0 0 12px #fff; }
  @keyframes alt-breathe { 0%,100%{ transform:scale(1); opacity:.9 } 50%{ transform:scale(1.04); opacity:1 } }
  .altitude-root .best-mini { margin-top:18px; font-size:12px; letter-spacing:.3em; opacity:.55; font-weight:500; }

  .altitude-root #over { background: radial-gradient(ellipse at center, rgba(5,3,20,.15), rgba(5,3,20,.55)); }
  .altitude-root .card { width:min(86vw, 360px); padding:34px 28px 26px; border-radius:30px; text-align:center;
    background: linear-gradient(160deg, rgba(255,255,255,.16), rgba(255,255,255,.05));
    border:1px solid rgba(255,255,255,.22); backdrop-filter: blur(26px) saturate(140%); -webkit-backdrop-filter: blur(26px) saturate(140%);
    box-shadow: 0 30px 80px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.3); }
  .altitude-root #over:not(.alt-hidden) .card { animation: alt-rise .7s cubic-bezier(.2,1,.3,1); }
  @keyframes alt-rise { from { transform: translateY(40px) scale(.96); opacity:0 } to { transform:none; opacity:1 } }
  .altitude-root .card .label { font-size:11px; letter-spacing:.45em; opacity:.6; font-weight:600; text-indent:.45em; }
  .altitude-root .card .big { font-size:92px; font-weight:200; letter-spacing:-.04em; line-height:1.05; margin:4px 0 2px; font-variant-numeric: tabular-nums; }
  .altitude-root .badge { display:inline-block; margin:6px 0 4px; padding:7px 14px; border-radius:999px; font-size:10px; letter-spacing:.3em; font-weight:800;
    color:#2a1a00; background: linear-gradient(90deg,#ffe8a3,#ffc96b,#ffe8a3); background-size:200% 100%; animation: alt-shine 2s linear infinite;
    box-shadow: 0 0 24px rgba(255,210,120,.55); }
  .altitude-root .badge.alt-hidden { display:none; }
  @keyframes alt-shine { to { background-position: -200% 0 } }
  .altitude-root .stats { display:flex; gap:10px; margin:20px 0 22px; }
  .altitude-root .stat { flex:1; padding:14px 8px; border-radius:18px; background: rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.1); }
  .altitude-root .stat b { display:block; font-size:24px; font-weight:600; font-variant-numeric: tabular-nums; }
  .altitude-root .stat span { font-size:9px; letter-spacing:.3em; opacity:.55; font-weight:600; }
  .altitude-root .btn { width:100%; padding:18px; border:none; border-radius:18px; cursor:pointer; font: inherit; font-size:14px; font-weight:700;
    letter-spacing:.3em; text-indent:.3em; text-transform:uppercase; color:#140b2e;
    background: linear-gradient(180deg,#ffffff,#dcd6ff); box-shadow: 0 12px 30px rgba(0,0,0,.3), inset 0 -2px 0 rgba(0,0,0,.08);
    transition: transform .15s, box-shadow .15s; }
  .altitude-root .btn:hover { transform: translateY(-2px); box-shadow: 0 16px 36px rgba(0,0,0,.35); }
  .altitude-root .btn:active { transform: scale(.97); }
  .altitude-root .hint { margin-top:14px; font-size:11px; opacity:.45; letter-spacing:.15em; }

  .altitude-root #pauseBtn { position:fixed; top:max(18px, env(safe-area-inset-top)); left:18px; width:44px; height:44px; border-radius:50%;
    border:1px solid var(--stroke); background: var(--glass); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    color:#fff; cursor:pointer; display:grid; place-items:center; z-index:5; transition: opacity .3s, transform .2s; }
  .altitude-root #pauseBtn:hover { transform: scale(1.08); }
  .altitude-root #pauseBtn svg { width:20px; height:20px; }
  .altitude-root #homeBtn { position:fixed; top:max(18px, env(safe-area-inset-top)); left:18px; width:52px; height:52px; border-radius:50%; background:var(--glass); border:1px solid var(--stroke); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); display:grid; place-items:center; cursor:pointer; z-index:20; }
  .altitude-root #homeBtn svg { width:22px; height:22px; }
  .altitude-root #homeBtn.alt-hidden { opacity:0; pointer-events:none; }
  .altitude-root #pauseBtn.alt-hidden { opacity:0; pointer-events:none; }
  .altitude-root #pause { background: rgba(5,3,20,.45); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
  .altitude-root #pause:not(.alt-hidden) .card { animation: alt-rise .45s cubic-bezier(.2,1,.3,1); }
  .altitude-root #pause .title { font-size:40px; font-weight:200; letter-spacing:.3em; text-indent:.3em; margin:6px 0 4px; }
  .altitude-root #pause .sub { font-size:13px; opacity:.6; margin-bottom:24px; letter-spacing:.05em; }
  .altitude-root #mute { position:fixed; top:max(18px, env(safe-area-inset-top)); right:18px; width:44px; height:44px; border-radius:50%;
    border:1px solid var(--stroke); background: var(--glass); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    color:#fff; cursor:pointer; display:grid; place-items:center; z-index:5; transition: transform .2s; }
  .altitude-root #mute:hover { transform: scale(1.08); }
  .altitude-root #mute svg { width:20px; height:20px; }
  /* ---------- Sélecteur de style ---------- */
  .altitude-root .styles { display:inline-flex; gap:6px; padding:6px; margin-bottom:22px; border-radius:20px; pointer-events:auto;
    background: rgba(10,6,28,.55); border:1px solid var(--stroke); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
    box-shadow: 0 10px 40px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.15); }
  .altitude-root .styles button { display:flex; flex-direction:column; align-items:center; gap:8px; min-width:86px; padding:12px 10px 10px;
    border:1px solid transparent; border-radius:15px; background:transparent; color:#fff; cursor:pointer; font:inherit;
    font-size:10px; font-weight:700; letter-spacing:.22em; text-transform:uppercase; opacity:.6; transition: all .25s; }
  .altitude-root .styles button:hover { opacity:.9; }
  .altitude-root .styles button.active { opacity:1; background: rgba(255,255,255,.14); border-color: rgba(255,255,255,.28);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.25), 0 6px 18px rgba(0,0,0,.2); }
  .altitude-root .sw { width:34px; height:24px; border-radius:7px; position:relative; }
  .altitude-root .sw-classic { background: linear-gradient(135deg,#ffd1e6,#a9b8ff 55%,#7a8cf0); box-shadow: inset 0 1px 0 rgba(255,255,255,.6); }
  .altitude-root .sw-bricks { background:#d42a32; box-shadow: inset 0 -3px 0 rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.4); }
  .altitude-root .sw-bricks::before, .altitude-root .sw-bricks::after { content:''; position:absolute; top:6px; width:9px; height:9px; border-radius:50%;
    background: radial-gradient(circle at 35% 35%, #ff7a7f, #c11f28 70%); box-shadow: 0 1px 1px rgba(0,0,0,.35); }
  .altitude-root .sw-bricks::before { left:6px; } .altitude-root .sw-bricks::after { right:6px; }
  .altitude-root .sw-neon { background:#0a0418; border:1.5px solid #3ff4ff; box-shadow: 0 0 10px #3ff4ff, 0 0 18px rgba(255,60,230,.7), inset 0 0 8px rgba(63,244,255,.6); }
  .altitude-root .btn2 { margin-top:10px; width:100%; padding:14px; border-radius:16px; cursor:pointer; font:inherit; font-size:11px; font-weight:700;
    letter-spacing:.28em; text-indent:.28em; text-transform:uppercase; color:#fff; background: rgba(255,255,255,.08);
    border:1px solid rgba(255,255,255,.2); transition: background .2s; }
  .altitude-root .btn2:hover { background: rgba(255,255,255,.16); }

  /* ---------- Ambiance néon ---------- */
  .altitude-root[data-style="neon"] #score { text-shadow: 0 0 12px rgba(63,244,255,.9), 0 0 36px rgba(255,60,230,.6); font-weight:300; }
  .altitude-root[data-style="neon"] h1 { background: linear-gradient(180deg,#e8feff,#3ff4ff 60%,#ff4fe6); -webkit-background-clip:text; background-clip:text;
    filter: drop-shadow(0 0 18px rgba(63,244,255,.6)) drop-shadow(0 0 40px rgba(255,60,230,.4)); }
  .altitude-root[data-style="neon"] .btn { background: linear-gradient(90deg,#3ff4ff,#ff4fe6); color:#12021f; box-shadow: 0 0 30px rgba(255,79,230,.45); }
  .altitude-root[data-style="neon"] #combo { background: linear-gradient(90deg,#3ff4ff,#fff,#ff4fe6); -webkit-background-clip:text; background-clip:text;
    filter: drop-shadow(0 0 16px rgba(63,244,255,.8)); }

  .altitude-root #flash { position:fixed; inset:0; pointer-events:none; background: radial-gradient(circle at 50% 45%, rgba(255,255,255,.35), transparent 60%); opacity:0; }
  .altitude-root #flash.on { animation: alt-flash .5s ease-out; }
  @keyframes alt-flash { from{opacity:1} to{opacity:0} }
`;

/* ============================== INTERFACE ============================== */
const ALTITUDE_MARKUP = `
<canvas id="c"></canvas>
<div id="flash"></div>

<div id="hud" class="alt-hidden">
  <div id="score">0</div>
  <div id="alt">0 m</div>
</div>
<div id="combo"></div>

<div id="menu" class="overlay">
  <div class="eyebrow">EMPILE VERS LE CIEL</div>
  <h1>ALTITUDE</h1>
  <div class="tag">Pose chaque plaque au millimètre. Monte plus haut que jamais.</div>
  <div class="cta">
    <div class="styles" id="styles">
      <button data-style="classic"><span class="sw sw-classic"></span>Classique</button>
      <button data-style="bricks"><span class="sw sw-bricks"></span>Briques</button>
      <button data-style="neon"><span class="sw sw-neon"></span>Néon</button>
    </div><br>
    <div class="pill"><span class="dot"></span>Toucher pour jouer</div>
    <div class="best-mini" id="menuBest"></div>
  </div>
</div>

<div id="over" class="overlay alt-hidden">
  <div class="card">
    <div class="label">HAUTEUR ATTEINTE</div>
    <div class="big" id="finalScore">0</div>
    <div class="badge alt-hidden" id="newBest">NOUVEAU RECORD</div>
    <div class="stats">
      <div class="stat"><b id="sBest">0</b><span>RECORD</span></div>
      <div class="stat"><b id="sPerf">0</b><span>PARFAITS</span></div>
      <div class="stat"><b id="sCombo">0</b><span>COMBO MAX</span></div>
    </div>
    <button class="btn" id="again">Rejouer</button>
    <button class="btn2" id="toMenu">Changer de style</button>
    <button class="btn2" id="backMenu">Retour au menu</button>
    <div class="hint">ou appuie sur Espace</div>
  </div>
</div>

<button id="mute" aria-label="Son"></button>
<button id="homeBtn" aria-label="Accueil"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg></button>
<button id="pauseBtn" class="alt-hidden" aria-label="Menu">
  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round"><path d="M5 7h14M5 12h14M5 17h14"/></svg>
</button>

<div id="pause" class="overlay alt-hidden">
  <div class="card">
    <div class="title">PAUSE</div>
    <div class="sub" id="pauseInfo">Étage 0</div>
    <button class="btn" id="resume">Reprendre la partie</button>
    <button class="btn2" id="quit">Retour au menu</button>
    <div class="hint">ou appuie sur Espace pour reprendre</div>
  </div>
</div>
`;

/* ============================== MOTEUR DU JEU ============================== */
function startAltitude(root: HTMLElement, options: { onBackToMenu?: () => void; onStart?: () => void; onGameOver?: (score: number, durationMs: number) => void } = {}): () => void {
  let runStartedAt = 0;
  // ---- Gestion du cycle de vie (montage / démontage React) ----
  let disposed = false, rafId = 0;
  const cleanups = [];
  const on = (target, type, fn, opts) => {
    target.addEventListener(type, fn, opts);
    cleanups.push(() => target.removeEventListener(type, fn, opts));
  };

  // ================== Setup ==================
  const cv = root.querySelector('#c');
  const ctx = cv.getContext('2d');
  let W, H, DPR, S;
  const COS = Math.cos(Math.PI / 6), SIN = 0.5;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    S = Math.min(W / 32, H / 34);
  }
  on(window, 'resize', resize);
  resize();

  const $ = id => root.querySelector('#' + id);
  const ui = {
    hud: $('hud'), score: $('score'), alt: $('alt'), combo: $('combo'), menu: $('menu'), over: $('over'),
    final: $('finalScore'), newBest: $('newBest'), sBest: $('sBest'), sPerf: $('sPerf'), sCombo: $('sCombo'),
    again: $('again'), mute: $('mute'), menuBest: $('menuBest'), flash: $('flash')
  };

  // ================== Constants & state ==================
  const BASE = 10, BH = 1, RANGE = 12, PERFECT = 0.22, GRAVITY = 42;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  let stack, debris, moving, axis, dir, speed, state = 'menu';
  let camY = 0, camYT = 0, zoom = 1, zoomT = 1, hue0 = Math.random() * 360;
  let combo = 0, maxCombo = 0, perfects = 0, score = 0, shake = 0, time = 0;
  let best = +(localStorage.getItem('altitude_best') || 0);
  let rings = [], sparks = [], meteors = [];
  let overTimer = 0;

  const top = () => stack[stack.length - 1];
  const blockHue = i => hue0 + i * 4.5;

  // Palette « plastique » des briques
  const BRICKS = [
    { h: 356, s: 78, l: 47 }, { h: 45, s: 96, l: 54 }, { h: 213, s: 82, l: 46 }, { h: 142, s: 62, l: 38 },
    { h: 24, s: 94, l: 52 }, { h: 195, s: 78, l: 56 }, { h: 78, s: 62, l: 47 }, { h: 322, s: 62, l: 54 },
    { h: 0, s: 0, l: 92 }, { h: 265, s: 52, l: 55 }
  ];
  const col = (c, dl = 0, a = 1) => `hsla(${c.h},${c.s}%,${clamp(c.l + dl, 0, 100)}%,${a})`;
  let lastCi = -1;
  function nextColor() {
    let ci; do { ci = Math.random() * BRICKS.length | 0; } while (ci === lastCi);
    lastCi = ci; return BRICKS[ci];
  }
  // Grande plaque de base verte
  const PLATE = { x: -17, z: -17, w: 34, d: 34, y: -.7, h: .7, c: { h: 128, s: 46, l: 36 } };
  const STUD_R = .62, STUD_H = .36;

  // ---------- Styles ----------
  let STYLE = localStorage.getItem('altitude_style') || 'bricks';
  if (!['classic', 'bricks', 'neon'].includes(STYLE)) STYLE = 'bricks';
  const NFLOOR = { x: -20, z: -20, w: 40, d: 40, y: -.01, h: .01 };
  const floorObj = () => STYLE === 'bricks' ? PLATE : STYLE === 'neon' ? NFLOOR : null;
  const studH = () => STYLE === 'bricks' ? STUD_H : 0;
  let floorPulse = 0;
  function makeColor(i) {
    if (STYLE === 'bricks') return nextColor();
    if (STYLE === 'neon') return { h: (185 + i * 9) % 360, s: 100, l: 60 };
    return { h: blockHue(i), s: 65, l: 62 };
  }

  function reset() {
    hue0 = Math.random() * 360;
    let c = makeColor(0);
    // en style Briques, la première brique ne doit pas être verte (elle se confondrait avec la plaque)
    while (STYLE === 'bricks' && c.h > 70 && c.h < 160) c = makeColor(0);
    stack = [STYLE === 'classic'
      ? { x: -BASE / 2, z: -BASE / 2, w: BASE, d: BASE, y: -60, h: 60, c, hue: c.h, base: true }
      : { x: -BASE / 2, z: -BASE / 2, w: BASE, d: BASE, y: 0, h: 2, c, hue: c.h, base: true }];
    debris = []; rings = []; sparks = [];
    combo = 0; maxCombo = 0; perfects = 0; score = 0;
    moving = null;
  }

  function spawn() {
    const p = top();
    axis = stack.length % 2 ? 'x' : 'z';
    const c = makeColor(stack.length);
    const b = { x: p.x, z: p.z, w: p.w, d: p.d, y: p.y + p.h, h: BH, c, hue: c.h };
    dir = Math.random() < .5 ? 1 : -1;
    b[axis] = p[axis] - dir * RANGE;
    speed = Math.min(10 + score * 0.17, 21);
    moving = b;
  }

  // ================== Audio ==================
  let actx = null, muted = localStorage.getItem('altitude_muted') === '1', master;
  function initAudio() {
    if (actx) { if (actx.state === 'suspended') actx.resume(); return; }
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      master = actx.createGain(); master.gain.value = .9;
      const comp = actx.createDynamicsCompressor();
      master.connect(comp); comp.connect(actx.destination);
    } catch (e) { actx = null; }
  }
  function tone(f, d = .15, type = 'sine', v = .15, slide = 0, delay = 0) {
    if (!actx || muted) return;
    const t = actx.currentTime + delay;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + .008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + d + .05);
  }
  const PENTA = [0, 2, 4, 7, 9];
  const note = n => 392 * Math.pow(2, (PENTA[n % 5] + 12 * Math.floor(n / 5)) / 12);
  function sndPlace() { tone(180 + Math.min(score, 80) * 2, .12, 'triangle', .14, 90); tone(900, .04, 'square', .025); }
  function sndPerfect(c) {
    const f = note(Math.min(c - 1, 14));
    tone(f, .45, 'sine', .16); tone(f * 2, .3, 'sine', .05, 0, .02); tone(f * 1.5, .5, 'triangle', .04, 0, .06);
  }
  function sndOver() { tone(320, .9, 'sawtooth', .06, 50); tone(160, 1.1, 'sine', .14, 40); }
  function sndStart() { [0, 2, 4].forEach((n, i) => tone(note(n + 2), .35, 'sine', .1, 0, i * .07)); }

  function renderMute() {
    ui.mute.innerHTML = muted
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="m22 9-6 6M16 9l6 6"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>';
  }
  renderMute();
  ui.mute.addEventListener('pointerdown', e => {
    e.stopPropagation(); muted = !muted; localStorage.setItem('altitude_muted', muted ? '1' : '0'); renderMute();
  });

  const vibrate = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

  // ================== Game flow ==================
  function start() {
    initAudio();
    reset(); spawn();
    state = 'play';
    zoomT = 1;
    ui.menu.classList.add('alt-hidden'); ui.over.classList.add('alt-hidden'); ui.hud.classList.remove('alt-hidden');
    $('homeBtn').classList.add('alt-hidden');
    $('pauseBtn').classList.remove('alt-hidden');
    ui.score.textContent = '0'; ui.alt.textContent = '0 m';
    sndStart();
    runStartedAt = performance.now(); options.onStart?.();
  }

  function popText(txt) {
    ui.combo.textContent = txt;
    ui.combo.classList.remove('show'); void ui.combo.offsetWidth; ui.combo.classList.add('show');
  }

  function place() {
    const p = top(), b = moving, k = axis, sz = k === 'x' ? 'w' : 'd';
    const delta = b[k] - p[k];
    const ad = Math.abs(delta);

    if (ad <= PERFECT) {
      b[k] = p[k];
      combo++; perfects++; maxCombo = Math.max(maxCombo, combo);
      // chaque parfait agrandit un peu la plaque (plus avec le combo), sans dépasser la taille d'origine
      const g = Math.min(.4 + Math.min(combo - 1, 4) * .1, BASE - b[sz]);
      if (g > 0) { b[k] -= g / 2; b[sz] += g; }
      stack.push(b);
      rings.push({ x: b.x, z: b.z, w: b.w, d: b.d, y: b.y + b.h + studH(), t: 0, c: b.c });
      if (combo >= 3) rings.push({ x: b.x, z: b.z, w: b.w, d: b.d, y: b.y + b.h + studH(), t: -.15, c: b.c });
      burst(b, 18 + combo * 4);
      floorPulse = 1;
      popText(combo > 1 ? `Parfait ×${combo}` : 'Parfait');
      sndPerfect(combo); vibrate(15);
      if (combo >= 5) { ui.flash.classList.remove('on'); void ui.flash.offsetWidth; ui.flash.classList.add('on'); }
    } else if (ad >= p[sz]) {
      debris.push(Object.assign({}, b, { vy: 0, vx: Math.sign(delta) * 3, ax: k, a: 1, back: delta < 0 }));
      moving = null;
      gameOver();
      return;
    } else {
      combo = 0;
      const ov = p[sz] - ad;
      const piece = Object.assign({}, b);
      if (delta > 0) { piece[k] = p[k] + p[sz]; piece[sz] = ad; b[sz] = ov; }
      else { piece[k] = b[k]; piece[sz] = ad; b[k] = p[k]; b[sz] = ov; }
      stack.push(b);
      debris.push(Object.assign(piece, { vy: 2, vx: Math.sign(delta) * 4, ax: k, a: 1, back: delta < 0 }));
      shake = Math.min(.6, ad / 6);
      sndPlace(); vibrate(8);
    }
    score = stack.length - 1;
    ui.score.textContent = score;
    ui.score.classList.remove('bump'); void ui.score.offsetWidth; ui.score.classList.add('bump');
    ui.alt.textContent = `${(score * 3.2).toFixed(0)} m`;
    spawn();
  }

  function gameOver() {
    state = 'over';
    $('pauseBtn').classList.add('alt-hidden');
    sndOver(); vibrate([30, 40, 60]);
    shake = .8;
    const isBest = score > best;
    if (isBest) { best = score; localStorage.setItem('altitude_best', best); }
    ui.final.textContent = score;
    ui.sBest.textContent = best; ui.sPerf.textContent = perfects; ui.sCombo.textContent = maxCombo;
    ui.newBest.classList.toggle('alt-hidden', !(isBest && score > 0));
    overTimer = .9;
    options.onGameOver?.(score, performance.now() - runStartedAt);
  }

  function setStyle(st) {
    STYLE = st; localStorage.setItem('altitude_style', st);
    root.dataset.style = st;
    root.querySelectorAll('#styles button').forEach(b => b.classList.toggle('active', b.dataset.style === st));
    reset();
  }
  root.querySelectorAll('#styles button').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation(); initAudio(); setStyle(b.dataset.style); tone(880, .08, 'sine', .08);
  }));
  function goMenu() {
    state = 'menu'; reset();
    ui.over.classList.add('alt-hidden'); ui.hud.classList.add('alt-hidden'); ui.menu.classList.remove('alt-hidden');
    $('homeBtn').classList.remove('alt-hidden');
    ui.menuBest.textContent = best ? `RECORD  ${best}` : '';
  }
  $('homeBtn').addEventListener('click', e => { e.stopPropagation(); if (options.onBackToMenu) options.onBackToMenu(); });
  $('toMenu').addEventListener('click', e => { e.stopPropagation(); goMenu(); });
  // « Retour au menu » : bouton prévu pour plus tard, sans action pour l'instant
  $('backMenu').addEventListener('click', e => { e.stopPropagation(); if (options.onBackToMenu) options.onBackToMenu(); });

  // ---------- Pause ----------
  const pauseBtn = $('pauseBtn'), pauseEl = $('pause');
  function pauseGame() {
    if (state !== 'play') return;
    state = 'pause';
    $('pauseInfo').textContent = `Étage ${score}`;
    pauseEl.classList.remove('alt-hidden'); pauseBtn.classList.add('alt-hidden');
    tone(520, .1, 'sine', .07);
  }
  function resumeGame() {
    if (state !== 'pause') return;
    state = 'play';
    pauseEl.classList.add('alt-hidden'); pauseBtn.classList.remove('alt-hidden');
    last = performance.now();
    tone(780, .1, 'sine', .07);
  }
  // pointerdown (comme le bouton son) : réagit tout de suite au toucher et ne pose pas de plaque
  pauseBtn.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); initAudio(); pauseGame(); });
  $('resume').addEventListener('click', e => { e.stopPropagation(); resumeGame(); });
  $('quit').addEventListener('click', e => {
    e.stopPropagation(); pauseEl.classList.add('alt-hidden'); pauseBtn.classList.add('alt-hidden'); goMenu();
  });
  // Pause automatique si on quitte l'appli / l'onglet
  on(document, 'visibilitychange', () => { if (document.hidden) pauseGame(); });

  function onPress(e) {
    if (e && e.target && e.target.closest && e.target.closest('#mute, #homeBtn, #styles, #toMenu, #backMenu, #again, #pauseBtn, #pause')) return;
    // sécurité mobile : un toucher sur la zone des boutons du haut ne pose jamais de plaque
    if (e && e.clientX !== undefined) {
      for (const el of [pauseBtn, ui.mute]) {
        if (el.classList.contains('alt-hidden')) continue;
        const r = el.getBoundingClientRect();
        if (e.clientX >= r.left - 8 && e.clientX <= r.right + 8 && e.clientY >= r.top - 8 && e.clientY <= r.bottom + 8) return;
      }
    }
    if (state === 'pause') return;
    if (state === 'menu') start();
    else if (state === 'play') { initAudio(); if (moving) place(); }
    else if (state === 'over' && overTimer <= 0 && !ui.over.classList.contains('alt-hidden')) start();
  }
  on(root, 'pointerdown', e => onPress(e));
  ui.again.addEventListener('click', e => { e.stopPropagation(); start(); });
  on(window, 'keydown', e => {
    if (e.code === 'Escape' || e.code === 'KeyP') { if (state === 'play') pauseGame(); else if (state === 'pause') resumeGame(); return; }
    if (state === 'pause') { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); resumeGame(); } return; }
    if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowUp') { e.preventDefault(); if (!e.repeat) onPress(e); }
    if (e.code === 'KeyM') { muted = !muted; renderMute(); }
  });

  // ================== Projection ==================
  let ox = 0, oy = 0, sc = 1;
  const P = (x, y, z) => [ox + (x - z) * COS * sc, oy + (x + z) * SIN * sc - (y - camY) * sc];

  function poly(pts) {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
  }

  function drawBox(b, alpha = 1, glow = 0, studs = true, cover = null) {
    if (STYLE === 'classic') return drawClassic(b, alpha, glow);
    if (STYLE === 'neon') return drawNeon(b, alpha, glow);
    const { x, y, z, w, d, h, c } = b;
    const t0 = P(x, y + h, z), t1 = P(x + w, y + h, z), t2 = P(x + w, y + h, z + d), t3 = P(x, y + h, z + d);
    const b1 = P(x + w, y, z), b2 = P(x + w, y, z + d), b3 = P(x, y, z + d);
    if (Math.max(t2[1], b2[1]) < -60 || Math.min(t0[1], t1[1]) > H + 60) return;
    ctx.globalAlpha = alpha;

    // Face gauche (z+d) — ombre
    poly([b3, b2, t2, t3]);
    let g = ctx.createLinearGradient(0, t3[1], 0, b3[1]);
    g.addColorStop(0, col(c, -12)); g.addColorStop(1, col(c, -20));
    ctx.fillStyle = g; ctx.fill();

    // Face droite (x+w) — lumière
    poly([b2, b1, t1, t2]);
    g = ctx.createLinearGradient(0, t2[1], 0, b2[1]);
    g.addColorStop(0, col(c, 2)); g.addColorStop(1, col(c, -7));
    ctx.fillStyle = g; ctx.fill();

    // Dessus
    poly([t0, t1, t2, t3]);
    ctx.fillStyle = col(c, 9);
    if (glow) { ctx.shadowColor = col(c, 25, .9 * glow); ctx.shadowBlur = 30 * glow; }
    ctx.fill();
    ctx.shadowBlur = 0;
    // reflet plastique
    g = ctx.createLinearGradient(t0[0], t0[1], t2[0], t2[1]);
    g.addColorStop(0, 'rgba(255,255,255,.30)'); g.addColorStop(.55, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fill();

    // Joint sombre en bas (séparation entre briques)
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(0,0,0,.32)';
    ctx.beginPath(); ctx.moveTo(b3[0], b3[1]); ctx.lineTo(b2[0], b2[1]); ctx.lineTo(b1[0], b1[1]); ctx.stroke();
    // Arêtes brillantes
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,.5)';
    ctx.beginPath(); ctx.moveTo(t3[0], t3[1]); ctx.lineTo(t2[0], t2[1]); ctx.lineTo(t1[0], t1[1]); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.22)';
    ctx.beginPath(); ctx.moveTo(t2[0], t2[1]); ctx.lineTo(b2[0], b2[1]); ctx.stroke();

    if (studs) drawStuds(b, cover);
    ctx.globalAlpha = 1;
  }

  // ---------- Style Classique (version d'origine) ----------
  function drawClassic(b, alpha, glow) {
    const { x, y, z, w, d, h } = b;
    const hue = b.c.h;
    const t0 = P(x, y + h, z), t1 = P(x + w, y + h, z), t2 = P(x + w, y + h, z + d), t3 = P(x, y + h, z + d);
    const b1 = P(x + w, y, z), b2 = P(x + w, y, z + d), b3 = P(x, y, z + d);
    if (Math.max(t2[1], b2[1]) < -50 || Math.min(t0[1], t1[1]) > H + 50) return;
    ctx.globalAlpha = alpha;
    poly([b3, b2, t2, t3]);
    let g = ctx.createLinearGradient(0, t3[1], 0, b3[1]);
    g.addColorStop(0, `hsl(${hue},55%,${b.base ? 46 : 50}%)`);
    g.addColorStop(1, `hsl(${hue + 10},60%,${b.base ? 14 : 42}%)`);
    ctx.fillStyle = g; ctx.fill();
    poly([b2, b1, t1, t2]);
    g = ctx.createLinearGradient(0, t2[1], 0, b2[1]);
    g.addColorStop(0, `hsl(${hue},60%,${b.base ? 60 : 64}%)`);
    g.addColorStop(1, `hsl(${hue + 10},62%,${b.base ? 20 : 55}%)`);
    ctx.fillStyle = g; ctx.fill();
    poly([t0, t1, t2, t3]);
    g = ctx.createLinearGradient(t0[0], t0[1], t2[0], t2[1]);
    g.addColorStop(0, `hsl(${hue - 8},70%,80%)`);
    g.addColorStop(1, `hsl(${hue + 6},65%,70%)`);
    ctx.fillStyle = g;
    if (glow) { ctx.shadowColor = `hsla(${hue},100%,75%,${.8 * glow})`; ctx.shadowBlur = 30 * glow; }
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath(); ctx.moveTo(t3[0], t3[1]); ctx.lineTo(t2[0], t2[1]); ctx.lineTo(t1[0], t1[1]); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.18)';
    ctx.beginPath(); ctx.moveTo(t2[0], t2[1]); ctx.lineTo(b2[0], b2[1]); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // ---------- Style Néon ----------
  function drawNeon(b, alpha, glow) {
    const { x, y, z, w, d, h } = b;
    const hue = b.c.h;
    const t0 = P(x, y + h, z), t1 = P(x + w, y + h, z), t2 = P(x + w, y + h, z + d), t3 = P(x, y + h, z + d);
    const b1 = P(x + w, y, z), b2 = P(x + w, y, z + d), b3 = P(x, y, z + d);
    if (Math.max(t2[1], b2[1]) < -60 || Math.min(t0[1], t1[1]) > H + 60) return;
    ctx.globalAlpha = alpha;
    // faces sombres translucides
    poly([b3, b2, t2, t3]); ctx.fillStyle = `hsla(${hue},70%,6%,.94)`; ctx.fill();
    poly([b2, b1, t1, t2]); ctx.fillStyle = `hsla(${hue},70%,10%,.94)`; ctx.fill();
    poly([t0, t1, t2, t3]);
    let g = ctx.createLinearGradient(t0[0], t0[1], t2[0], t2[1]);
    g.addColorStop(0, `hsla(${hue},90%,24%,.96)`); g.addColorStop(1, `hsla(${hue},90%,11%,.96)`);
    ctx.fillStyle = g; ctx.fill();

    // contours lumineux (lueur simulée par plusieurs traits)
    const zs = Math.max(.45, zoom);
    const edges = () => {
      ctx.beginPath();
      ctx.moveTo(t0[0], t0[1]); ctx.lineTo(t1[0], t1[1]); ctx.lineTo(t2[0], t2[1]); ctx.lineTo(t3[0], t3[1]); ctx.closePath();
      ctx.moveTo(t1[0], t1[1]); ctx.lineTo(b1[0], b1[1]);
      ctx.moveTo(t2[0], t2[1]); ctx.lineTo(b2[0], b2[1]);
      ctx.moveTo(t3[0], t3[1]); ctx.lineTo(b3[0], b3[1]);
      ctx.moveTo(b3[0], b3[1]); ctx.lineTo(b2[0], b2[1]); ctx.lineTo(b1[0], b1[1]);
    };
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    edges();
    if (glow) { ctx.strokeStyle = `hsla(${hue},100%,60%,${.12 * glow})`; ctx.lineWidth = 16 * zs; ctx.stroke(); }
    ctx.strokeStyle = `hsla(${hue},100%,60%,.16)`; ctx.lineWidth = 7 * zs; ctx.stroke();
    ctx.strokeStyle = `hsla(${hue},100%,62%,.4)`; ctx.lineWidth = 3.2 * zs; ctx.stroke();
    ctx.strokeStyle = `hsla(${hue},100%,86%,.95)`; ctx.lineWidth = 1.2 * zs; ctx.stroke();
    // motif intérieur sur le dessus
    if (w > 1.2 && d > 1.2) {
      const m = .5;
      poly([P(x + m, y + h, z + m), P(x + w - m, y + h, z + m), P(x + w - m, y + h, z + d - m), P(x + m, y + h, z + d - m)]);
      ctx.strokeStyle = `hsla(${hue},100%,70%,.22)`; ctx.lineWidth = 1 * zs; ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  function drawNeonFloor() {
    const F = NFLOOR, y = 0, step = 2;
    const c0 = P(F.x, y, F.z), c1 = P(F.x + F.w, y, F.z), c2 = P(F.x + F.w, y, F.z + F.d), c3 = P(F.x, y, F.z + F.d);
    if (Math.min(c0[1], c1[1]) > H + 40) return;
    const cc = P(0, y, 0);
    poly([c0, c1, c2, c3]);
    const rg = ctx.createRadialGradient(cc[0], cc[1], 0, cc[0], cc[1], F.w * sc * .9);
    rg.addColorStop(0, `rgba(60,10,90,${.75 + .2 * floorPulse})`); rg.addColorStop(1, 'rgba(8,2,20,0)');
    ctx.fillStyle = rg; ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    const half = F.w / 2;
    for (let v = -half; v <= half + .001; v += step) {
      const fade = Math.pow(1 - Math.abs(v) / half, 1.4);
      const a = (.25 + .45 * floorPulse) * fade;
      if (a < .01) continue;
      for (const [p, q, hue] of [[P(v, y, -half), P(v, y, half), 300], [P(-half, y, v), P(half, y, v), 190]]) {
        ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]);
        ctx.strokeStyle = `hsla(${hue},100%,60%,${a * .35})`; ctx.lineWidth = 4 * Math.max(.45, zoom); ctx.stroke();
        ctx.strokeStyle = `hsla(${hue},100%,75%,${a})`; ctx.lineWidth = 1; ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  const studCount = w => w < 1.3 ? 0 : Math.max(1, Math.floor((w + .3) / 2));

  function drawStuds(b, cover) {
    const nx = studCount(b.w), nz = studCount(b.d);
    if (!nx || !nz) return;
    const yTop = b.y + b.h;
    for (let j = 0; j < nz; j++) {
      const cz = b.z + b.d / 2 + (j - (nz - 1) / 2) * 2;
      for (let i = 0; i < nx; i++) {
        const cx = b.x + b.w / 2 + (i - (nx - 1) / 2) * 2;
        if (cover && cx - STUD_R >= cover.x && cx + STUD_R <= cover.x + cover.w &&
            cz - STUD_R >= cover.z && cz + STUD_R <= cover.z + cover.d) continue;
        drawStud(cx, yTop, cz, b.c);
      }
    }
  }

  function drawStud(cx, y, cz, c) {
    const p = P(cx, y, cz), px = p[0], py = p[1];
    if (py < -30 || py > H + 30) return;
    const rx = STUD_R * sc * 1.2247, ry = STUD_R * sc * .7071, hh = STUD_H * sc;
    // flanc du cylindre
    ctx.beginPath();
    ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI);
    ctx.lineTo(px - rx, py - hh);
    ctx.ellipse(px, py - hh, rx, ry, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.fillStyle = col(c, -9); ctx.fill();
    // côté éclairé du flanc
    ctx.beginPath();
    ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI / 2);
    ctx.lineTo(px, py - hh + ry);
    ctx.ellipse(px, py - hh, rx, ry, 0, Math.PI / 2, 0, true);
    ctx.closePath();
    ctx.fillStyle = col(c, 1); ctx.fill();
    // dessus du tenon
    ctx.beginPath(); ctx.ellipse(px, py - hh, rx, ry, 0, 0, 6.2832);
    ctx.fillStyle = col(c, 13); ctx.fill();
    ctx.lineWidth = .8; ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.stroke();
    // reflet
    ctx.beginPath(); ctx.ellipse(px - rx * .22, py - hh - ry * .12, rx * .42, ry * .32, 0, 0, 6.2832);
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fill();
  }

  // Plaque de base : tenons derrière ou devant la première brique
  function drawPlateStuds(front) {
    const c = PLATE.c, yTop = PLATE.y + PLATE.h, b0 = stack[0];
    for (let cz = PLATE.z + 1; cz < PLATE.z + PLATE.d; cz += 2) {
      for (let cx = PLATE.x + 1; cx < PLATE.x + PLATE.w; cx += 2) {
        const under = cx + STUD_R > b0.x && cx - STUD_R < b0.x + b0.w && cz + STUD_R > b0.z && cz - STUD_R < b0.z + b0.d;
        if (under) continue;
        const isFront = cx > b0.x + b0.w || cz > b0.z + b0.d;
        if (isFront === front) drawStud(cx, yTop, cz, c);
      }
    }
  }

  // Hauteur du sol (brique ou plaque) sous un débris
  function groundAt(d) {
    if (STYLE === 'classic') return -Infinity;
    const cx = d.x + d.w / 2, cz = d.z + d.d / 2;
    for (let i = stack.length - 1; i >= 0; i--) {
      const s = stack[i], t = s.y + s.h;
      if (t > d.y + .001) continue;
      if (cx > s.x && cx < s.x + s.w && cz > s.z && cz < s.z + s.d) return t;
    }
    const F = floorObj();
    if (F && cx > F.x && cx < F.x + F.w && cz > F.z && cz < F.z + F.d) return F.y + F.h;
    return -Infinity;
  }

  // ================== Effects ==================
  function burst(b, n) {
    const cy = b.y + b.h + studH();
    for (let i = 0; i < n; i++) {
      // random point on the top perimeter
      const s = Math.random() * 4 | 0, r = Math.random();
      let x, z;
      if (s === 0) { x = b.x + r * b.w; z = b.z; } else if (s === 1) { x = b.x + b.w; z = b.z + r * b.d; }
      else if (s === 2) { x = b.x + r * b.w; z = b.z + b.d; } else { x = b.x; z = b.z + r * b.d; }
      const a = Math.random() * Math.PI * 2;
      sparks.push({ x, y: cy, z, vx: Math.cos(a) * 3, vz: Math.sin(a) * 3, vy: 4 + Math.random() * 7, life: 1, decay: .7 + Math.random() * .8, c: b.c, s: 1.5 + Math.random() * 2.5 });
    }
  }

  function drawRing(r) {
    if (r.t < 0) return;
    const m = r.t * 2.6;
    const pts = [P(r.x - m, r.y, r.z - m), P(r.x + r.w + m, r.y, r.z - m), P(r.x + r.w + m, r.y, r.z + r.d + m), P(r.x - m, r.y, r.z + r.d + m)];
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - r.t);
    ctx.lineWidth = 2.5 * (1 - r.t) + .5;
    ctx.strokeStyle = '#fff';
    ctx.shadowColor = col(r.c, 30); ctx.shadowBlur = 18;
    poly(pts); ctx.stroke();
    ctx.restore();
  }

  // ================== Background ==================
  const stars = Array.from({ length: 170 }, () => ({ x: Math.random(), y: Math.random(), s: Math.random() * 1.6 + .3, ph: Math.random() * 6.28, sp: .6 + Math.random() * 2.2, dp: .05 + Math.random() * .35 }));
  const orbs = Array.from({ length: 13 }, () => ({ x: Math.random(), y: Math.random(), r: 40 + Math.random() * 140, dp: .1 + Math.random() * .6, sp: .004 + Math.random() * .012, ho: Math.random() * 90 - 45, ph: Math.random() * 6.28 }));
  const motes = Array.from({ length: 40 }, () => ({ x: Math.random(), y: Math.random(), s: .6 + Math.random() * 1.8, sp: .01 + Math.random() * .03, ph: Math.random() * 6.28 }));

  function drawBackground(dt) {
    const alt = clamp(camY / 140, 0, 1);
    const neon = STYLE === 'neon';
    const h = neon ? 285 + Math.sin(time * .15) * 15
      : STYLE === 'classic' ? blockHue(score) + 200 + Math.sin(time * .1) * 15
      : 215 + 85 * (.5 + .5 * Math.sin(blockHue(score) * Math.PI / 180)) + Math.sin(time * .1) * 12;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    if (neon) {
      g.addColorStop(0, '#030109');
      g.addColorStop(.6, `hsl(${h - 15},75%,${lerp(8, 3, alt)}%)`);
      g.addColorStop(1, `hsl(${h + 20},85%,${lerp(17, 5, alt)}%)`);
    } else {
      g.addColorStop(0, `hsl(${h + 30},${lerp(55, 45, alt)}%,${lerp(20, 4, alt)}%)`);
      g.addColorStop(.55, `hsl(${h + 10},${lerp(55, 50, alt)}%,${lerp(34, 9, alt)}%)`);
      g.addColorStop(1, `hsl(${h - 15},${lerp(60, 55, alt)}%,${lerp(52, 18, alt)}%)`);
    }
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'lighter';

    // Stars (more visible as you climb)
    const sa = .25 + .75 * alt;
    for (const s of stars) {
      const yy = ((s.y * H + camY * S * s.dp) % H + H) % H;
      const tw = .45 + .55 * Math.sin(time * s.sp + s.ph);
      ctx.globalAlpha = sa * tw * .9;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(s.x * W, yy, s.s, 0, 6.283); ctx.fill();
    }

    // Grille rétro qui défile (néon) + lueur d'horizon
    if (neon) {
      const off = camY * S * .5, y0 = H * .66 + off;
      const hg = ctx.createRadialGradient(W / 2, y0, 0, W / 2, y0, Math.max(W, H) * .7);
      hg.addColorStop(0, `rgba(255,50,200,${.35 * (1 - alt) + .05})`); hg.addColorStop(1, 'rgba(255,50,200,0)');
      ctx.globalAlpha = 1; ctx.fillStyle = hg; ctx.fillRect(0, 0, W, H);
      if (y0 < H) {
        ctx.lineWidth = 1;
        for (let i = -16; i <= 16; i++) {
          ctx.strokeStyle = `rgba(63,244,255,${.22 * (1 - Math.abs(i) / 17)})`;
          ctx.beginPath(); ctx.moveTo(W / 2 + i * W * .015, y0); ctx.lineTo(W / 2 + i * W * .2, y0 + H * .6); ctx.stroke();
        }
        for (let k = 0; k < 14; k++) {
          const t = (k + (time * .5) % 1) / 14, yy = y0 + H * .6 * t * t;
          if (yy > H) break;
          ctx.strokeStyle = `rgba(255,79,230,${.45 * t})`;
          ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke();
        }
      }
    }

    // Aurora ribbons
    for (let i = 0; i < (neon ? 0 : 3); i++) {
      const y0 = H * (.18 + .14 * i) + Math.sin(time * .2 + i) * 20;
      const hh = h + 50 + i * 40;
      const ag = ctx.createLinearGradient(0, y0 - 80, 0, y0 + 220);
      ag.addColorStop(0, `hsla(${hh},90%,65%,0)`);
      ag.addColorStop(.25, `hsla(${hh},90%,65%,${.13 + .05 * alt})`);
      ag.addColorStop(1, `hsla(${hh + 30},90%,55%,0)`);
      ctx.globalAlpha = 1;
      ctx.fillStyle = ag;
      ctx.beginPath();
      ctx.moveTo(0, y0 + 240);
      for (let x = 0; x <= W + 20; x += 20) {
        const y = y0 + Math.sin(x * .0042 + time * (.35 + .12 * i) + i * 2) * 46 + Math.sin(x * .011 - time * .5 + i) * 18;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, y0 + 240);
      ctx.closePath(); ctx.fill();
    }

    // Bokeh orbs
    for (const o of orbs) {
      o.y -= o.sp * dt;
      if (o.y < -.3) { o.y = 1.3; o.x = Math.random(); }
      const yy = ((o.y * H + camY * S * o.dp * .6) % (H + 400) + H + 400) % (H + 400) - 200;
      const xx = o.x * W + Math.sin(time * .3 + o.ph) * 30;
      const rg = ctx.createRadialGradient(xx, yy, 0, xx, yy, o.r);
      const oh = neon ? (o.ho > 0 ? 305 : 188) : h + o.ho;
      rg.addColorStop(0, `hsla(${oh},90%,${neon ? 60 : 70}%,${neon ? .12 : .16})`);
      rg.addColorStop(1, `hsla(${oh},90%,70%,0)`);
      ctx.globalAlpha = 1; ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(xx, yy, o.r, 0, 6.283); ctx.fill();
    }

    // Floating dust motes
    for (const m of motes) {
      m.y -= m.sp * dt;
      if (m.y < -.05) { m.y = 1.05; m.x = Math.random(); }
      ctx.globalAlpha = .35 + .3 * Math.sin(time * 2 + m.ph);
      ctx.fillStyle = neon ? (m.ph > 3.14 ? '#3ff4ff' : '#ff4fe6') : `hsl(${h + 60},100%,85%)`;
      ctx.beginPath(); ctx.arc(m.x * W + Math.sin(time + m.ph) * 12, m.y * H, m.s, 0, 6.283); ctx.fill();
    }

    // Shooting stars at altitude
    if (alt > .2 && Math.random() < dt * .35 * alt) {
      meteors.push({ x: Math.random() * W * 1.2, y: Math.random() * H * .4, vx: -(500 + Math.random() * 400), vy: 220 + Math.random() * 150, life: 1 });
    }
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += m.vx * dt; m.y += m.vy * dt; m.life -= dt * 1.4;
      if (m.life <= 0) { meteors.splice(i, 1); continue; }
      const lg = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * .12, m.y - m.vy * .12);
      lg.addColorStop(0, `rgba(255,255,255,${m.life})`); lg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha = 1; ctx.strokeStyle = lg; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - m.vx * .12, m.y - m.vy * .12); ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    return h;
  }

  function drawForeground(h) {
    // bottom haze to dissolve the pedestal
    const fg = ctx.createLinearGradient(0, H * .7, 0, H);
    const alt = clamp(camY / 140, 0, 1);
    const fl = STYLE === 'neon' ? [12, 4] : [lerp(52, 18, alt), lerp(40, 10, alt)];
    fg.addColorStop(0, `hsla(${h - 15},60%,${fl[0]}%,0)`);
    fg.addColorStop(1, `hsla(${h - 15},60%,${fl[1]}%,.95)`);
    ctx.fillStyle = fg; ctx.fillRect(0, H * .7, W, H * .3);
    // vignette
    const vg = ctx.createRadialGradient(W / 2, H * .45, Math.min(W, H) * .35, W / 2, H * .5, Math.max(W, H) * .85);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,10,.45)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }

  // ================== Loop ==================
  setStyle(STYLE);
  ui.menuBest.textContent = best ? `RECORD  ${best}` : '';

  let last = performance.now();
  function frame(now) {
    if (disposed) return;
    let dt = Math.min(.033, (now - last) / 1000); last = now;
    time += dt;

    // --- update ---
    if (state === 'play' && moving) {
      moving[axis] += dir * speed * dt;
      const c = top()[axis];
      if (moving[axis] > c + RANGE) { moving[axis] = c + RANGE; dir = -1; }
      if (moving[axis] < c - RANGE) { moving[axis] = c - RANGE; dir = 1; }
    }
    const tY = top().y + top().h;
    if (state === 'play') { camYT = Math.max(0, tY - 5); zoomT = 1; }
    else if (state === 'menu') { camYT = 1.5 + Math.sin(time * .6) * .4; zoomT = .9; }
    else if (state === 'over') {
      const span = tY + 14;
      zoomT = clamp((H * .62) / (span * S), .12, 1);
      camYT = tY * .5 - (H * .04) / (S * zoomT);
      overTimer -= dt;
      if (overTimer <= 0 && ui.over.classList.contains('alt-hidden')) {
        ui.over.classList.remove('alt-hidden'); ui.hud.classList.add('alt-hidden');
      }
    }
    const k = 1 - Math.exp(-dt * (state === 'over' ? 2.2 : 6));
    camY = lerp(camY, camYT, k);
    zoom = lerp(zoom, zoomT, k);

    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      if (d.rest === undefined) {
        const g = groundAt(d);
        d.vy -= GRAVITY * dt; d.y += d.vy * dt; d[d.ax] += d.vx * dt;
        if (d.vy < 0 && d.y <= g) {
          d.y = g;
          if (d.vy < -9) { d.vy = -d.vy * .22; d.vx *= .4; tone(1500 + Math.random() * 400, .035, 'square', .025); }
          else { d.vy = 0; d.vx = 0; d.rest = 0; }
        }
      } else d.rest += dt;
      const fade = d.rest === undefined ? 1 : clamp(1 - (d.rest - 2.5), 0, 1);
      d.a = Math.min(fade, clamp((d.y - (camY - 25)) / 12, 0, 1));
      if (d.y < camY - 40 || fade <= 0) debris.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) { rings[i].t += dt * 1.6; if (rings[i].t > 1) rings.splice(i, 1); }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.vy -= 18 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; s.life -= s.decay * dt;
      if (s.life <= 0) sparks.splice(i, 1);
    }
    shake = Math.max(0, shake - dt * 2.5);
    floorPulse = Math.max(0, floorPulse - dt * 1.5);

    // --- render ---
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const bgH = drawBackground(dt);

    sc = S * zoom;
    ox = W / 2 + (Math.random() - .5) * shake * 14;
    oy = H * .56 + (Math.random() - .5) * shake * 14;

    // Ordre de dessin (peintre) : débris arrière intercalés par hauteur
    const back = debris.filter(d => d.back).sort((a, b) => a.y - b.y);
    const front = debris.filter(d => !d.back).sort((a, b) => a.y - b.y);
    let bi = 0;
    const F = floorObj();
    while (bi < back.length && back[bi].y < (F ? F.y : -Infinity)) { drawBox(back[bi], back[bi].a); bi++; }
    if (STYLE === 'bricks') { drawBox(PLATE, 1, 0, false); drawPlateStuds(false); }
    else if (STYLE === 'neon') drawNeonFloor();
    for (let i = 0; i < stack.length; i++) {
      const s0 = stack[i];
      if (i === 0) while (bi < back.length && back[bi].y < s0.y + s0.h - .01) { drawBox(back[bi], back[bi].a); bi++; }
      drawBox(s0, 1, 0, true, stack[i + 1] || null);
      if (i === 0 && STYLE === 'bricks') drawPlateStuds(true);
      const next = i + 1 < stack.length ? stack[i + 1].y + stack[i + 1].h - .01 : Infinity;
      while (bi < back.length && back[bi].y < next) { drawBox(back[bi], back[bi].a); bi++; }
    }
    for (const r of rings) drawRing(r);

    if (moving) drawBox(moving, 1, .55 + .25 * Math.sin(time * 6));
    for (const d of front) drawBox(d, d.a);

    // sparks
    ctx.globalCompositeOperation = 'lighter';
    for (const s of sparks) {
      const [px, py] = P(s.x, s.y, s.z);
      ctx.globalAlpha = Math.max(0, s.life);
      ctx.fillStyle = col(s.c, 18 + 20 * s.life);
      ctx.beginPath(); ctx.arc(px, py, s.s * (.5 + s.life * .5) * Math.max(.5, zoom), 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';

    drawForeground(bgH);
    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);

  return () => {
    disposed = true;
    cancelAnimationFrame(rafId);
    cleanups.forEach(f => f());
    if (actx) { try { actx.close(); } catch (e) {} }
  };
}
