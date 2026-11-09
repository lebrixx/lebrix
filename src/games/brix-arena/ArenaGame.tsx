import { Suspense, lazy, useEffect, useRef, useState } from "react";
const ArenaLobby3D = lazy(() => import("./ArenaLobby3D"));
import { type LucideIcon, ArrowLeft, Atom, Bomb, Crosshair, Droplet, Flame, Gem, Heart, HeartPulse, Magnet, Orbit, Play, Repeat, RotateCcw, Shield, Skull, Sparkles, Split, Swords, Trophy, Wind, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroUrl from "@/assets/brix-arena/hero-run.png";
import meleeUrl from "@/assets/brix-arena/melee-run.png";
import tankUrl from "@/assets/brix-arena/tank-run.png";
import shooterUrl from "@/assets/brix-arena/shooter-run.png";
import healthKitUrl from "./assets/health-kit.png";
import lobbyBgUrl from "@/assets/brix-arena/lobby-bg.jpg";
import laurelUrl from "./assets/arena/laurel.svg";
import "./brix-arena.css";
import { ArenaScene, loadSceneAssets, type SceneAssets } from "./arena-scene";
import { MELEE_CELL, SHOOTER_CELL, meleeFrame, shooterFrame } from "./enemy-art";
import { ArenaWorld, BOMB_KILLS, coverBounds, BOSS_NAMES, KIND, MAX_BOMBS, UPGRADES, WIDTH, HEIGHT, type Banner, type EnemyKind, type UpgradeId } from "./world";

const UPGRADE_ICON: Record<UpgradeId, LucideIcon> = {
  power: Swords, rate: Zap, multi: Split, pierce: Crosshair, ricochet: Repeat, orbit: Orbit, blast: Atom,
  magnet: Magnet, leech: Droplet, trail: Flame, shield: Shield, vitality: HeartPulse, speed: Wind, heal: Sparkles,
};
/** Tints applied to the baked sheets to create the new enemy variants. */
const TINT = { kamikaze: "#ff5a1f", splitter: "#58e07a", sniper: "#6a2cff", boss: "#d4183d" };
const DEBRIS: Record<EnemyKind, string> = { 0: "#c9c2a8", 1: "#8f8a73", 2: "#4ad3ff", 3: "#ff7a3d", 4: "#58e07a", 5: "#b36bff", 6: "#ff3355" };

type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number; ring?: number; text?: string };
type Hud = {
  phase: string; hp: number; maxHp: number; score: number; elapsed: number; kills: number; dash: number;
  bombs: number; bombProgress: number; menuOpen: boolean; level: number; xp: number; xpNext: number;
  boss: { name: string; hp: number; max: number } | null; banner: Banner | null; choices: UpgradeId[];
  levels: Partial<Record<UpgradeId, number>>; bossesKilled: number; shield: boolean; incoming: number; room: number;
};
const EMPTY_HUD: Hud = { phase: "ready", hp: 5, maxHp: 5, score: 0, elapsed: 0, kills: 0, dash: 0, bombs: 1, bombProgress: 0, menuOpen: false, level: 1, xp: 0, xpNext: 10, boss: null, banner: null, choices: [], levels: {}, bossesKilled: 0, shield: false, incoming: 0, room: 0 };

/** Gold laurel branches framing a title. */
function Laurels({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`arena-laurels ${className}`}><img src={laurelUrl} alt="" aria-hidden /><div>{children}</div><img src={laurelUrl} alt="" aria-hidden className="arena-laurel-flip" /></div>;
}

export function ArenaGame({ onBack, onStart, onFinish }: { onBack?: () => void; onStart?: () => void; onFinish?: (score: number, duration: number) => void }) {
  const callbacks = useRef({ onStart, onFinish }); callbacks.current = { onStart, onFinish };
  const finished = useRef(false);
  const canvas = useRef<HTMLCanvasElement>(null), stage = useRef<HTMLElement>(null);
  const world = useRef<ArenaWorld | null>(null);
  const input = useRef({ x: 0, y: 0 }), keys = useRef(new Set<string>());
  const [hud, setHud] = useState<Hud>(EMPTY_HUD);
  const [best, setBest] = useState(0), bestRef = useRef(0);
  const publish = () => {
    const g = world.current; if (!g) return;
    if (g.phase === "over" && !finished.current) { finished.current = true; callbacks.current.onFinish?.(g.score, g.elapsed); }
    const levels: Hud["levels"] = {};
    for (const [id, n] of Object.entries(g.levels)) if (n) levels[id as UpgradeId] = n;
    setHud({
      phase: g.phase, hp: g.hp, maxHp: g.maxHp, score: g.score, elapsed: g.elapsed, kills: g.kills, dash: g.dashCooldown,
      bombs: g.bombs, bombProgress: g.bombProgress, menuOpen: g.menuOpen, level: g.level, xp: g.xp, xpNext: g.xpNext,
      boss: g.boss ? { name: BOSS_NAMES[(g.bossIndex - 1) % BOSS_NAMES.length] ?? "BOSS", hp: Math.max(0, g.boss.hp), max: g.boss.maxHp } : null,
      banner: g.banner, choices: [...g.choices], levels, bossesKilled: g.bossesKilled, shield: g.shieldReady, incoming: g.followers.length, room: g.room,
    });
    if (g.score > bestRef.current) { bestRef.current = g.score; setBest(g.score); try { localStorage.setItem("brix-arena-survival-best", String(g.score)); } catch { /* optional storage */ } }
  };
  const start = () => { finished.current = false; callbacks.current.onStart?.(); world.current?.dispose(); const g = new ArenaWorld(); world.current = g; g.start(); keys.current.clear(); input.current = { x: 0, y: 0 }; publish(); };
  const pause = () => { const g = world.current; if (!g) return; if (g.menuOpen) g.resumeMenu(); else g.openMenu(); keys.current.clear(); input.current = { x: 0, y: 0 }; stickPointer.current = null; publish(); };
  const choose = (u: UpgradeId) => { keys.current.clear(); input.current = { x: 0, y: 0 }; stickPointer.current = null; world.current?.upgrade(u); publish(); };
  const bomb = () => { world.current?.bomb(); publish(); };
  const actions = useRef({ pause, publish, choose, bomb }); actions.current = { pause, publish, choose, bomb };

  useEffect(() => {
    try { const n = Number(localStorage.getItem("brix-arena-survival-best")); if (Number.isFinite(n) && n > 0) { bestRef.current = n; setBest(n); } } catch { /* optional storage */ }
    const g = world.current ?? new ArenaWorld(); world.current = g;
    const c = canvas.current, s = stage.current; if (!c || !s) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const load = (url: string) => { const i = new Image(); i.src = url; return i; };
    const art = load(heroUrl), meleeArt = load(meleeUrl), tankArt = load(tankUrl), shooterArt = load(shooterUrl), kitArt = load(healthKitUrl);
    const ready = (i: HTMLImageElement) => i.complete && i.naturalWidth > 0;
    // Tinted copies of the sheets, built once the source image is loaded.
    const tintCache = new Map<string, HTMLCanvasElement>();
    const tinted = (img: HTMLImageElement, color: string, alpha: number): CanvasImageSource | null => {
      if (!ready(img)) return null;
      const key = img.src + color;
      let cv = tintCache.get(key);
      if (!cv) {
        cv = document.createElement("canvas"); cv.width = img.naturalWidth; cv.height = img.naturalHeight;
        const x = cv.getContext("2d"); if (!x) return img;
        x.drawImage(img, 0, 0); x.globalCompositeOperation = "source-atop"; x.globalAlpha = alpha; x.fillStyle = color; x.fillRect(0, 0, cv.width, cv.height);
        tintCache.set(key, cv);
      }
      return cv;
    };
    // Colosseum palette (canvas). Hero shots stay cyan to read well on sand.
    const color = { ink: "#140b05", red: "#d0392b", gold: "#f0c062", cyan: "#6ff3ff", text: "#fff3dc", side: "#3b2a1a", shadow: "rgba(48,24,6,.42)" };
    let scale = 1, ox = 0, oy = 0, dpr = 1;
    // Visible world rectangle (inverse of the tilt), used to cull the crowd.
    const view = { x0: -400, y0: -400, x1: WIDTH + 400, y1: HEIGHT + 300 };
    // One decor per room, built on first visit and rebuilt on resize.
    let assets: SceneAssets | null = null, rebuild = 0;
    const scenes: (ArenaScene | null)[] = [null, null];
    const sceneFor = (room: number) => {
      if (!assets) return null;
      let sc = scenes[room];
      if (!sc) { sc = new ArenaScene(assets, coverBounds(room), room === 1 ? "pit" : "colosseum"); sc.build(scale * dpr); scenes[room] = sc; }
      return sc;
    };
    const buildScene = () => { for (const sc of scenes) sc?.build(scale * dpr); };
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2); c.width = s.clientWidth * dpr; c.height = s.clientHeight * dpr;
      // Slightly zoomed out so the podium and the first rows of the stands are visible.
      scale = Math.min(s.clientWidth / 1180, s.clientHeight / 650); ox = (s.clientWidth - WIDTH * scale) / 2; oy = (s.clientHeight - HEIGHT * scale) / 2;
      const toWorld = (px: number, py: number) => { const X = (px - ox) / scale, Y = (py - oy) / scale, y = 0.44 * HEIGHT + (Y - HEIGHT / 2) / 0.82; return { x: X + 0.14 * (y - 0.44 * HEIGHT), y }; };
      const pts = [toWorld(0, 0), toWorld(s.clientWidth, 0), toWorld(0, s.clientHeight), toWorld(s.clientWidth, s.clientHeight)];
      view.x0 = Math.min(...pts.map(p => p.x)) - 40; view.x1 = Math.max(...pts.map(p => p.x)) + 40; view.y0 = Math.min(...pts.map(p => p.y)) - 40; view.y1 = Math.max(...pts.map(p => p.y)) + 40;
      clearTimeout(rebuild); rebuild = window.setTimeout(buildScene, 150);
    }; resize(); const ro = new ResizeObserver(resize); ro.observe(s);
    let disposed = false;
    Promise.all([loadSceneAssets(), document.fonts?.load("700 46px Cinzel").catch(() => undefined)]).then(([loaded]) => { if (disposed) return; assets = loaded; sceneFor(world.current?.room ?? 0); });
    const down = (e: KeyboardEvent) => {
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","KeyW","KeyA","KeyS","KeyD","KeyZ","KeyQ","Space"].includes(e.code)) { e.preventDefault(); keys.current.add(e.code); if (e.code === "Space" && !e.repeat) world.current?.dash(); }
      if ((e.code === "KeyE" || e.code === "KeyB") && !e.repeat) actions.current.bomb();
      const w = world.current;
      if (w?.phase === "upgrade" && !w.menuOpen) { const i = ["Digit1","Digit2","Digit3","Numpad1","Numpad2","Numpad3"].indexOf(e.code) % 3; const pick = i >= 0 ? w.choices[i] : undefined; if (pick) actions.current.choose(pick); }
      if (e.code === "Escape") actions.current.pause();
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const blur = () => { keys.current.clear(); input.current = { x: 0, y: 0 }; if (world.current?.phase === "playing") actions.current.pause(); };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur);

    // ---- cosmetic state (renderer only)
    const particles: Particle[] = [];
    let shake = 0, hurtFlash = 0, shock = 0, shockX = 0, shockY = 0, cheer = 0, gateOpen = 0, lastBanner = 0, fade = 0;
    const burst = (x: number, y: number, n: number, colr: string, speed: number, size: number, life = 0.5) => {
      for (let i = 0; i < n && particles.length < 500; i++) { const a = Math.random() * Math.PI * 2, v = speed * (0.4 + Math.random() * 0.8); particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: life * (0.6 + Math.random() * 0.6), max: life, color: colr, size: size * (0.6 + Math.random() * 0.7) }); }
    };
    const ring = (x: number, y: number, r: number, colr: string, life = 0.4) => { if (particles.length < 520) particles.push({ x, y, vx: 0, vy: 0, life, max: life, color: colr, size: 4, ring: r }); };
    const floater = (x: number, y: number, text: string, colr: string) => {
      if (particles.filter(p => p.text).length > 50) return;
      particles.push({ x: x + (Math.random() - 0.5) * 14, y: y - 18, vx: (Math.random() - 0.5) * 20, vy: -55, life: 0.65, max: 0.65, color: colr, size: 15, text });
    };
    const drainFx = (w: ArenaWorld) => {
      for (const f of w.fx) {
        if (f.type === "hit") { burst(f.x, f.y, 3, "#fff3b0", 160, 2.5, 0.25); floater(f.x, f.y, String(f.amount), "#fff3b0"); }
        else if (f.type === "death") { cheer = Math.min(1, cheer + (f.kind === KIND.tank || f.kind === KIND.splitter ? 0.05 : 0.012)); const big = f.kind === KIND.tank || f.kind === KIND.splitter; burst(f.x, f.y, f.mini ? 6 : big ? 18 : 11, DEBRIS[f.kind], big ? 230 : 190, big ? 5 : 3.5, 0.55); ring(f.x, f.y, big ? 44 : 30, DEBRIS[f.kind], 0.3); if (big) shake = Math.max(shake, 3); }
        else if (f.type === "explode") { burst(f.x, f.y, 22, f.hostile ? "#ff5a1f" : "#ffd166", 300, 5, 0.5); ring(f.x, f.y, f.r, f.hostile ? "#ff5a1f" : "#ffd166", 0.35); shake = Math.max(shake, f.hostile ? 9 : 4); }
        else if (f.type === "bomb") { cheer = Math.max(cheer, 0.8); shock = 1; shockX = f.x; shockY = f.y; shake = Math.max(shake, 14); }
        else if (f.type === "arrive") { burst(f.x, f.y, 18, "#c9a26a", 220, 4, 0.6); ring(f.x, f.y, 40, "#ff5a4a", 0.4); floater(f.x + (f.x > WIDTH / 2 ? -40 : 40), f.y - 10, "⚔", "#ff7a6a"); }
        else if (f.type === "room") { fade = 1; shake = 0; particles.length = 0; }
        else if (f.type === "geyser") { burst(f.x, f.y, 34, "#ff6a1f", 340, 5, 0.7); burst(f.x, f.y, 16, "#ffd27a", 220, 3.5, 0.5); ring(f.x, f.y, f.r, "#ff5a1f", 0.4); shake = Math.max(shake, 6); }
        else if (f.type === "hurt") { hurtFlash = 0.45; shake = Math.max(shake, 8); }
        else if (f.type === "shield") { ring(f.x, f.y, 46, color.cyan, 0.45); burst(f.x, f.y, 14, color.cyan, 220, 3, 0.4); shake = Math.max(shake, 4); }
        else if (f.type === "levelup") { cheer = Math.max(cheer, 0.6); ring(f.x, f.y, 80, color.gold, 0.6); burst(f.x, f.y, 26, color.gold, 260, 3.5, 0.7); }
        else if (f.type === "pickup") { burst(f.x, f.y, f.kind === "gem" ? 3 : 14, f.kind === "gem" ? "#7df9ff" : f.kind === "health" ? "#ff6b81" : color.gold, 120, 2.5, 0.3); if (f.kind !== "gem") floater(f.x, f.y, f.kind === "health" ? "+1 VIE" : "+1 BOMBE", f.kind === "health" ? "#ff6b81" : "#ffd166"); }
        else if (f.type === "bossDown") { cheer = 1.6; for (let i = 0; i < 4; i++) ring(f.x, f.y, 70 + i * 50, i % 2 ? color.gold : "#ff3355", 0.5 + i * 0.15); burst(f.x, f.y, 60, "#ff3355", 380, 6, 0.9); burst(f.x, f.y, 40, color.gold, 300, 4, 0.9); shake = 20; }
      }
      w.fx.length = 0;
    };

    let raf = 0, prev = 0, acc = 0, lastHud = 0, lastPhase = g.phase;
    const frame = (now: number) => {
      const w = world.current; if (!w) return;
      const fdt = prev ? Math.min((now - prev) / 1000, 0.05) : 0; acc += fdt; prev = now;
      const k = keys.current, has = (...names: string[]) => names.some(n => k.has(n));
      const move = { x: input.current.x + (has("ArrowRight","KeyD") ? 1 : 0) - (has("ArrowLeft","KeyA","KeyQ") ? 1 : 0), y: input.current.y + (has("ArrowDown","KeyS") ? 1 : 0) - (has("ArrowUp","KeyW","KeyZ") ? 1 : 0) };
      while (acc >= 1 / 60) { w.step(1 / 60, move); acc -= 1 / 60; }
      drainFx(w);
      if (now - lastHud > 100 || w.phase !== lastPhase) { actions.current.publish(); lastHud = now; lastPhase = w.phase; }
      c.dataset["x"] = String(w.hero.position.x); c.dataset["y"] = String(w.hero.position.y); c.dataset["kills"] = String(w.kills);
      c.dataset["sceneReady"] = String(ready(meleeArt) && ready(tankArt) && ready(shooterArt));
      c.dataset["meleeFrame"] = String(Math.floor(w.elapsed * 10) % 8);
      const live = w.phase === "playing" || w.phase === "over";
      if (live) {
        for (const p of particles) { p.life -= fdt; p.x += p.vx * fdt; p.y += p.vy * fdt; if (!p.text && !p.ring) { p.vx *= 0.9; p.vy *= 0.9; } }
        for (let i = particles.length - 1; i >= 0; i--) if ((particles[i]?.life ?? 0) <= 0) particles.splice(i, 1);
        if (w.banner && w.banner.id !== lastBanner) { lastBanner = w.banner.id; if (w.banner.tone !== "calm") cheer = Math.max(cheer, 0.7); }
        cheer = Math.max(0, cheer - fdt * 0.3);
        const bossNear = w.boss && Math.hypot(w.boss.body.position.x - 500, w.boss.body.position.y) < 160;
        gateOpen += ((bossNear ? 1 : 0) - gateOpen) * Math.min(1, fdt * 3);
        fade = Math.max(0, fade - fdt * 1.6);
        shake = Math.max(0, shake - fdt * 40); hurtFlash = Math.max(0, hurtFlash - fdt); shock = Math.max(0, shock - fdt * 1.6);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = color.ink; ctx.fillRect(0, 0, s.clientWidth, s.clientHeight);
      const sx = shake ? (Math.random() - 0.5) * shake * 2 : 0, sy = shake ? (Math.random() - 0.5) * shake * 2 : 0;
      ctx.translate(ox + sx, oy + sy); ctx.scale(scale, scale);
      // Subtle 2.5D tilt: canvas-only, simulation coordinates untouched.
      ctx.translate(WIDTH / 2, HEIGHT / 2); ctx.transform(1, 0, -0.14, 0.82, 0, 0); ctx.translate(-WIDTH / 2, -HEIGHT / 2 + HEIGHT * 0.06);
      const scene = sceneFor(w.room);
      if (scene) {
        scene.drawBackdrop(ctx);
        scene.drawPortal(ctx, now / 1000, w.gatesOpen, w.gateLock, !!w.boss, w.followers.length, (w.followers[0]?.t ?? 9) < 1);
        scene.drawGate(ctx, gateOpen);
        scene.drawGlow(ctx, now / 1000);
        scene.drawCrowd(ctx, now / 1000, Math.min(1, cheer), view);
        scene.drawBraziers(ctx, now / 1000);
      } else { ctx.fillStyle = "#c08f52"; ctx.fillRect(0, 0, WIDTH, HEIGHT); }
      // A red glow runs along the podium while a boss is on the field.
      if (w.boss) { ctx.strokeStyle = `rgba(255,51,85,${0.35 + Math.sin(now / 180) * 0.15})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.roundRect(-3, -3, WIDTH + 6, HEIGHT + 6, 18); ctx.stroke(); }

      // Fire trail patches
      for (const f of w.fires) { const a = f.life / f.max; ctx.globalAlpha = 0.35 * a + 0.1; ctx.fillStyle = "#ff7a1f"; ctx.beginPath(); ctx.ellipse(f.x, f.y + 4, 22, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 0.6 * a; ctx.fillStyle = "#ffd166"; ctx.beginPath(); ctx.ellipse(f.x, f.y + 2 - Math.sin(now / 80 + f.x) * 2, 10, 7, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;

      // XP crystals
      for (const gem of w.gems) {
        const big = gem.value >= 5, mid = gem.value >= 2, r = big ? 9 : mid ? 7 : 5, bob = Math.sin(now / 200 + gem.x) * 2;
        const fill = big ? "#ffd166" : mid ? "#58e07a" : "#7df9ff";
        ctx.globalAlpha = 0.35; ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(gem.x, gem.y + bob, r * 1.9, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(gem.x, gem.y - r + bob); ctx.lineTo(gem.x + r * 0.7, gem.y + bob); ctx.lineTo(gem.x, gem.y + r + bob); ctx.lineTo(gem.x - r * 0.7, gem.y + bob); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.beginPath(); ctx.moveTo(gem.x, gem.y - r + bob); ctx.lineTo(gem.x + r * 0.35, gem.y + bob); ctx.lineTo(gem.x, gem.y + bob); ctx.closePath(); ctx.fill();
      }

      for (const p of w.pickups) {
        if (p.kind === "health" && ready(kitArt)) {
          const pulse = 1 + Math.sin(w.elapsed * 4) * 0.08, size = 40 * pulse;
          ctx.fillStyle = color.shadow; ctx.beginPath(); ctx.ellipse(p.x + 4, p.y + 16, 16, 7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.drawImage(kitArt, p.x - size / 2, p.y - size / 2 - 6, size, size);
        } else if (p.kind === "health") {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.PI / 4); ctx.fillStyle = color.red; ctx.fillRect(-9, -9, 18, 18); ctx.restore();
          ctx.fillStyle = color.text; ctx.fillRect(p.x - 6, p.y - 1.5, 12, 3); ctx.fillRect(p.x - 1.5, p.y - 6, 3, 12);
        } else if (p.kind === "bomb") {
          const pulse = 1 + Math.sin(w.elapsed * 5) * 0.1;
          ctx.fillStyle = color.shadow; ctx.beginPath(); ctx.ellipse(p.x + 4, p.y + 14, 15, 6, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#26241f"; ctx.beginPath(); ctx.arc(p.x, p.y, 13 * pulse, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = color.gold; ctx.lineWidth = 3; ctx.stroke();
          ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x + 7, p.y - 10); ctx.quadraticCurveTo(p.x + 14, p.y - 20, p.x + 6, p.y - 24); ctx.stroke();
          ctx.fillStyle = "#ff7a1f"; ctx.beginPath(); ctx.arc(p.x + 6, p.y - 24, 3 + Math.sin(now / 60) * 1.2, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.PI / 4); ctx.fillStyle = color.cyan; ctx.fillRect(-6, -6, 12, 12); ctx.restore();
        }
      }

      // Lava geysers: cracking warning circle, then a column of fire (drawn again over the sprites).
      for (const gy of w.geysers) {
        if (gy.burst) continue;
        const k = 1 - gy.t / 1.3, flick = 0.6 + Math.sin(now / 50 + gy.x) * 0.4;
        ctx.fillStyle = `rgba(255,60,10,${0.12 + k * 0.28})`; ctx.beginPath(); ctx.arc(gy.x, gy.y, gy.r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(255,140,40,${0.5 + k * 0.5 * flick})`; ctx.lineWidth = 2.5; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.arc(gy.x, gy.y, gy.r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = `rgba(255,200,90,${0.5 * k})`; ctx.beginPath(); ctx.arc(gy.x, gy.y, gy.r * k, 0, Math.PI * 2); ctx.fill();
      }
      // Telegraphs drawn under the sprites: sniper lasers, boss charge lanes, kamikaze fuses.
      for (const e of w.enemies) {
        const { x, y } = e.body.position;
        if (e.kind === KIND.sniper && e.aim >= 0) {
          const locked = e.aim <= 0.25;
          ctx.globalAlpha = locked ? 0.9 : 0.35 + Math.sin(now / 40) * 0.15; ctx.strokeStyle = "#ff3355"; ctx.lineWidth = locked ? 3 : 1.5; ctx.setLineDash(locked ? [] : [10, 8]);
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + e.aimDir.x * 1100, y + e.aimDir.y * 1100); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
        }
        if (e.kind === KIND.boss && e.state === "telegraph") {
          const L = 320; ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(e.aimDir.y, e.aimDir.x));
          ctx.globalAlpha = 0.18 + (0.75 - e.stateTime) * 0.4; ctx.fillStyle = "#ff3355"; ctx.fillRect(0, -38, L, 76);
          ctx.globalAlpha = 0.8; ctx.strokeStyle = "#ff3355"; ctx.lineWidth = 2; ctx.strokeRect(0, -38, L, 76); ctx.restore(); ctx.globalAlpha = 1;
        }
        if (e.kind === KIND.kamikaze && e.fuse >= 0) {
          const t = 1 - e.fuse / 0.65; ctx.globalAlpha = 0.15 + t * 0.35; ctx.fillStyle = "#ff5a1f"; ctx.beginPath(); ctx.arc(x, y, 75, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 0.9; ctx.strokeStyle = "#ff5a1f"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 75 * t, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
        }
      }

      const shadow = (x: number, y: number, r: number) => { ctx.fillStyle = color.shadow; ctx.beginPath(); ctx.ellipse(x + 4, y + 9, r, r * 0.5, 0, 0, Math.PI * 2); ctx.fill(); };
      const sprite = (img: CanvasImageSource, sxp: number, syp: number, cell: number, x: number, y: number, size: number, anchor: number, flash: number) => {
        ctx.drawImage(img, sxp, syp, cell, cell, x - size / 2, y - size * anchor, size, size);
        if (flash > 0) { ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = Math.min(1, flash * 7); ctx.drawImage(img, sxp, syp, cell, cell, x - size / 2, y - size * anchor, size, size); ctx.restore(); }
      };
      for (const e of [...w.enemies].sort((a, b) => a.body.position.y - b.body.position.y)) {
        // Pursuers walking out of a gate fade in and cannot be hit yet.
        ctx.globalAlpha = e.arriving > 0 ? 0.3 + 0.7 * (1 - e.arriving / 0.7) : 1;
        const { x, y } = e.body.position, r = e.mini ? 12 : e.kind === KIND.boss ? 44 : e.kind === KIND.tank || e.kind === KIND.splitter ? 22 : 16; shadow(x, y, r);
        if (e.kind === KIND.drone || e.kind === KIND.sniper) {
          const img = e.kind === KIND.sniper ? tinted(shooterArt, TINT.sniper, 0.72) : ready(shooterArt) ? shooterArt : null;
          if (img) { const pose = shooterFrame(w.elapsed, e.body.id, w.hero.position.x - x, w.hero.position.y - y), size = e.kind === KIND.sniper ? 88 : 92, hover = Math.sin(w.elapsed * 3 + e.body.id) * 3; sprite(img, pose.sx, pose.sy, SHOOTER_CELL, x, y + hover, size, 0.72, e.flash); }
          continue;
        }
        const img = e.kind === KIND.tank ? (ready(tankArt) ? tankArt : null)
          : e.kind === KIND.splitter ? tinted(tankArt, TINT.splitter, 0.45)
          : e.kind === KIND.boss ? tinted(tankArt, TINT.boss, 0.4)
          : e.kind === KIND.kamikaze ? tinted(meleeArt, TINT.kamikaze, e.fuse >= 0 && Math.floor(now / 70) % 2 ? 0.85 : 0.5)
          : ready(meleeArt) ? meleeArt : null;
        if (!img) continue;
        const v = e.body.velocity, direction = Math.hypot(v.x, v.y) > 0.08 ? v : { x: w.hero.position.x - x, y: w.hero.position.y - y };
        const pose = meleeFrame(w.elapsed, e.body.id, direction.x, direction.y);
        const size = e.mini ? 60 : e.kind === KIND.boss ? 230 : e.kind === KIND.tank ? 118 : e.kind === KIND.splitter ? 104 : e.kind === KIND.kamikaze ? 78 : 86;
        if (e.kind === KIND.boss && e.state === "charge") { ctx.globalAlpha = 0.25; ctx.drawImage(img, pose.sx, pose.sy, MELEE_CELL, MELEE_CELL, x - size / 2 - e.aimDir.x * 30, y - size * 0.84 - e.aimDir.y * 30, size, size); ctx.globalAlpha = 1; }
        sprite(img, pose.sx, pose.sy, MELEE_CELL, x, y, size, 0.84, e.flash);
        // Small health bar for tough enemies once damaged.
        if (!e.mini && e.kind !== KIND.boss && e.maxHp >= 4 && e.hp < e.maxHp) { const bw = 34; ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(x - bw / 2, y - size * 0.86, bw, 4); ctx.fillStyle = DEBRIS[e.kind]; ctx.fillRect(x - bw / 2, y - size * 0.86, bw * Math.max(0, e.hp / e.maxHp), 4); }
      }
      ctx.globalAlpha = 1;
      for (const b of w.shots) {
        if (b.hostile) { ctx.strokeStyle = b.big ? "#ff3355" : color.red; ctx.lineWidth = b.big ? 6 : 7; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(b.body.position.x - b.vx * (b.big ? 3.5 : 1.8), b.body.position.y - b.vy * (b.big ? 3.5 : 1.8)); ctx.lineTo(b.body.position.x, b.body.position.y); ctx.stroke(); continue; }
        ctx.strokeStyle = b.pierce > 0 || b.ricochet > 0 ? "#b8f7ff" : color.cyan; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(b.body.position.x - b.vx * 1.8, b.body.position.y - b.vy * 1.8); ctx.lineTo(b.body.position.x, b.body.position.y); ctx.stroke();
      }
      const h = w.hero.position; shadow(h.x, h.y, 20);
      if (w.dashTime > 0) { ctx.strokeStyle = w.levels.trail ? "#ff7a1f" : color.cyan; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(h.x - w.facing.x * 55, h.y - w.facing.y * 55); ctx.lineTo(h.x, h.y); ctx.stroke(); }
      ctx.globalAlpha = w.invincible > 0 && Math.floor(now / 90) % 2 ? 0.45 : 1;
      if (ready(art)) { const moving = Math.hypot(move.x, move.y) > 0; const dir = moving ? move : w.facing; const pose = meleeFrame(w.elapsed, 0, dir.x, dir.y); ctx.drawImage(art, pose.sx, pose.sy, MELEE_CELL, MELEE_CELL, h.x - 34, h.y - 56, 68, 68); } else { ctx.fillStyle = color.gold; ctx.fillRect(h.x - 15, h.y - 20, 30, 35); }
      ctx.globalAlpha = 1; ctx.save(); ctx.translate(h.x, h.y - 4); ctx.rotate(Math.atan2(w.aim.y, w.aim.x)); ctx.fillStyle = color.side; ctx.fillRect(7, -6, 26, 12); ctx.fillStyle = color.cyan; ctx.fillRect(23, -4, 13, 8); ctx.restore();
      if (w.shieldReady) { ctx.globalAlpha = 0.5 + Math.sin(now / 200) * 0.15; ctx.strokeStyle = color.cyan; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(h.x, h.y - 18, 32, 38, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
      for (const o of w.orbPositions()) {
        ctx.globalAlpha = 0.35; ctx.fillStyle = "#ffd166"; ctx.beginPath(); ctx.arc(o.x, o.y - 10, 16, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1; ctx.fillStyle = "#ffe9a8"; ctx.beginPath(); ctx.arc(o.x, o.y - 10, 8, 0, Math.PI * 2); ctx.fill();
      }

      for (const gy of w.geysers) {
        if (!gy.burst) continue;
        const a = gy.t / 0.5; ctx.save(); ctx.globalCompositeOperation = "lighter";
        const col = ctx.createRadialGradient(gy.x, gy.y - 30, 4, gy.x, gy.y - 30, gy.r * 1.4);
        col.addColorStop(0, `rgba(255,230,160,${a})`); col.addColorStop(0.4, `rgba(255,110,30,${0.8 * a})`); col.addColorStop(1, "rgba(255,40,0,0)");
        ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(gy.x, gy.y - 40 * a, gy.r * 0.9, gy.r * 1.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      scene?.drawDust(ctx, now / 1000, live ? fdt : 0);
      // Particles, rings and damage numbers
      for (const p of particles) {
        const a = Math.max(0, p.life / p.max);
        if (p.text) { ctx.globalAlpha = Math.min(1, a * 1.6); ctx.font = `700 ${p.size}px Cinzel, Georgia, serif`; ctx.lineWidth = 3; ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.strokeText(p.text, p.x, p.y); ctx.fillStyle = p.color; ctx.fillText(p.text, p.x, p.y); continue; }
        if (p.ring) { ctx.globalAlpha = a; ctx.strokeStyle = p.color; ctx.lineWidth = 2 + a * 4; ctx.beginPath(); ctx.arc(p.x, p.y, p.ring * (1.15 - a * 0.65), 0, Math.PI * 2); ctx.stroke(); continue; }
        ctx.globalAlpha = a; ctx.fillStyle = p.color; ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      ctx.globalAlpha = 1;
      if (shock > 0) { const r = (1 - shock) * 1100; ctx.globalAlpha = shock; ctx.strokeStyle = color.gold; ctx.lineWidth = 26 * shock + 4; ctx.beginPath(); ctx.arc(shockX, shockY, r, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
      if (w.bombFlash > 0) { ctx.globalAlpha = w.bombFlash * 0.8; ctx.fillStyle = color.gold; ctx.fillRect(0, 0, WIDTH, HEIGHT); ctx.globalAlpha = 1; }

      // Fade through black when walking from one room to the other.
      if (fade > 0) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = `rgba(8,4,2,${Math.min(1, fade * 1.3)})`; ctx.fillRect(0, 0, s.clientWidth, s.clientHeight); }
      // Screen-space warm vignette
      { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); const W2 = s.clientWidth, H2 = s.clientHeight, v = ctx.createRadialGradient(W2 / 2, H2 * 0.55, Math.min(W2, H2) * 0.45, W2 / 2, H2 * 0.55, Math.max(W2, H2) * 0.75); v.addColorStop(0, "rgba(20,8,0,0)"); v.addColorStop(1, "rgba(20,8,0,.55)"); ctx.fillStyle = v; ctx.fillRect(0, 0, W2, H2); }
      // Screen-space damage vignette
      if (hurtFlash > 0 || (w.phase === "playing" && w.hp === 1)) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const W = s.clientWidth, H = s.clientHeight, grad = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.7);
        const alpha = Math.max(hurtFlash, w.hp === 1 ? 0.18 + Math.sin(now / 250) * 0.08 : 0);
        grad.addColorStop(0, "rgba(212,24,61,0)"); grad.addColorStop(1, `rgba(212,24,61,${alpha})`);
        ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      }
      raf = requestAnimationFrame(frame);
    }; raf = requestAnimationFrame(frame);
    return () => { disposed = true; clearTimeout(rebuild); cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); world.current?.dispose(); };
  }, []);

  const stickPointer = useRef<number | null>(null), stickPad = useRef<HTMLDivElement>(null);
  const [stick, setStick] = useState({ active: false, bx: 0, by: 0, kx: 0, ky: 0 });
  const STICK_R = 52;
  const stickDown = (e: React.PointerEvent) => { if (stickPointer.current !== null) return; stickPointer.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); input.current = { x: 0, y: 0 }; const r = stickPad.current?.getBoundingClientRect(); setStick({ active: true, bx: r ? r.left + r.width / 2 : e.clientX, by: r ? r.top + r.height / 2 : e.clientY, kx: 0, ky: 0 }); stickMove(e); };
  const stickMove = (e: React.PointerEvent) => { if (stickPointer.current !== e.pointerId) return; setStick(s => { if (!s.active) return s; const sx = e.clientX - s.bx, sy = e.clientY - s.by; let dx = sx, dy = sy; if (stage.current && getComputedStyle(stage.current).transform !== "none") { dx = sy; dy = -sx; } const len = Math.hypot(dx, dy), cl = len > STICK_R ? STICK_R / len : 1; input.current = { x: dx / Math.max(STICK_R, len), y: dy / Math.max(STICK_R, len) }; return { ...s, kx: sx * cl, ky: sy * cl }; }); };
  const stickUp = (e: React.PointerEvent) => { if (stickPointer.current !== e.pointerId) return; stickPointer.current = null; input.current = { x: 0, y: 0 }; setStick(s => ({ ...s, active: false })); };
  const taken = (Object.entries(hud.levels) as [UpgradeId, number][]).filter(([id]) => id !== "heal");
  const inRun = hud.phase === "playing" || hud.phase === "paused" || hud.phase === "upgrade";

  return <main ref={stage} className="brix-arena-original game-screen arena-screen touch-none select-none">
    <canvas ref={canvas} className="arena-canvas" aria-label="Arène de survie" />
    <header className="arena-hud"><Button variant="secondary" onClick={pause} aria-label="Menu"><ArrowLeft />Menu</Button></header>
    <div className="arena-stats">
      <div className="arena-score"><Trophy size={16} /><span>{hud.score}<small>Record {best}</small></span></div>
      <div className="arena-health" aria-label={`${hud.hp} vies sur ${hud.maxHp}`}>{hud.maxHp <= 8 ? Array.from({ length: hud.maxHp }, (_, i) => <Heart key={i} size={15} className={i < hud.hp ? "is-full" : "is-empty"} />) : <><Heart size={15} className="is-full" />{hud.hp}/{hud.maxHp}</>}{hud.shield && <Shield size={13} className="arena-shield-on" aria-label="Bouclier prêt" />}</div>
    </div>
    {inRun && <div className="arena-xp" aria-label={`Niveau ${hud.level}`}>
      <b>NIV. {hud.level}</b>
      <div className="arena-xp-bar"><i style={{ width: `${Math.min(100, (hud.xp / hud.xpNext) * 100)}%` }} /></div>
      <span><Skull size={12} />{hud.kills}</span>
    </div>}
    {inRun && hud.incoming > 0 && <div className="arena-incoming" role="status"><Swords size={13} />{hud.incoming} ennemi{hud.incoming > 1 ? "s" : ""} te {hud.incoming > 1 ? "suivent" : "suit"} depuis {hud.room === 1 ? "l’arène" : "la fosse"}</div>}
    {hud.boss && inRun && <div className="arena-boss" role="status">
      <b>{hud.boss.name}</b>
      <div className="arena-boss-bar"><i style={{ width: `${(hud.boss.hp / hud.boss.max) * 100}%` }} /></div>
    </div>}
    {hud.banner && hud.phase === "playing" && <div key={hud.banner.id} className="arena-banner" data-tone={hud.banner.tone}><Laurels><b>{hud.banner.title}</b></Laurels><span>{hud.banner.sub}</span></div>}
    {hud.phase === "playing" && <><div className="arena-stick-zone" role="application" aria-label="Déplacer le joueur" onPointerDown={stickDown} onPointerMove={stickMove} onPointerUp={stickUp} onPointerCancel={stickUp} /><div ref={stickPad} className="arena-stick-base"><div className="arena-stick-knob" style={{ transform: `translate(calc(-50% + ${stick.kx}px),calc(-50% + ${stick.ky}px))` }} /></div><Button className="arena-dash" aria-label="Esquiver" disabled={hud.dash > 0} onPointerDown={e => { e.preventDefault(); world.current?.dash(); publish(); }} onClick={e => { if (e.detail === 0) { world.current?.dash(); publish(); } }}><Zap />{hud.dash > 0 ? `${hud.dash.toFixed(1)}s` : "Esquive"}</Button></>}
    {hud.phase === "playing" && !hud.menuOpen && <Button className="arena-bomb" aria-label={`Bombe, ${hud.bombs} restantes`} disabled={hud.bombs <= 0} onPointerDown={e => { e.preventDefault(); bomb(); }} onClick={e => { if (e.detail === 0) bomb(); }}>
      <Bomb /><span>Bombe ×{hud.bombs}</span>
      {hud.bombs < MAX_BOMBS && <i className="arena-bomb-charge" style={{ width: `${(hud.bombProgress / BOMB_KILLS) * 100}%` }} />}
    </Button>}
    {hud.menuOpen && <div className="arena-overlay arena-menu-overlay"><div className="arena-dialog" role="dialog" aria-label="Menu de la partie"><Laurels><h2>PAUSE</h2></Laurels>{hud.phase !== "ready" && hud.phase !== "over" && <Button className="arena-start" onClick={pause}><Play />Reprendre la partie</Button>}<Button variant="secondary" onClick={onBack}><ArrowLeft />Retour au menu</Button></div></div>}
    {hud.phase === "ready" && !hud.menuOpen && <div className="arena-lobby">
      <div className="arena-lobby-bg" aria-hidden style={{ backgroundImage: `url(${lobbyBgUrl})` }} />
      <Suspense fallback={null}><ArenaLobby3D /></Suspense>
      <div className="arena-lobby-vignette" />
      <div className="arena-lobby-left">
        <p className="arena-kicker">ARÈNE · SURVIE</p>
        <Laurels className="arena-logo-wrap"><h2 className="arena-logo">BRIX <span>ARENA</span></h2></Laurels>
        <div className="arena-lobby-best"><Trophy size={16} />Record <b>{best}</b></div>
        <ul className="arena-lobby-foes">
          <li><i data-c="melee" />Robots rapides</li>
          <li><i data-c="tank" />Monstres blindés</li>
          <li><i data-c="drone" />Drones tireurs</li>
          <li><i data-c="kamikaze" />Kamikazes</li>
          <li><i data-c="splitter" />Scindeurs</li>
          <li><i data-c="sniper" />Tireurs d'élite</li>
          <li><i data-c="boss" />Un champion toutes les 2 min</li>
        </ul>
      </div>
      <div className="arena-lobby-right">
        <div className="arena-lobby-kit"><img src={healthKitUrl} alt="Kit de soin" /><div><b>KIT DE SOIN</b><span>Ramasse-le : <em>+1 vie</em></span></div></div>
        <div className="arena-lobby-kit arena-lobby-gem"><Gem size={30} /><div><b>CRISTAUX</b><span>Ramasse-les pour <em>choisir un pouvoir</em></span></div></div>
        <Button className="arena-lobby-play" onClick={start}><Swords />JOUER</Button>
        <small className="arena-lobby-hint">Une porte à droite mène à la Fosse Ardente : cristaux ×2, geysers de lave</small>
      </div>
    </div>}
    {hud.phase === "upgrade" && !hud.menuOpen && <div className="arena-overlay"><div className="arena-dialog arena-levelup">
      <p className="arena-kicker">NIVEAU {hud.level}</p>
      <Laurels><h2>LA FOULE T’OFFRE UN DON</h2></Laurels>
      <div className="arena-upgrades">{hud.choices.map((id, i) => {
        const Icon = UPGRADE_ICON[id], next = (hud.levels[id] ?? 0) + 1, def = UPGRADES[id];
        return <Button key={id} variant="secondary" onClick={() => choose(id)} data-new={next === 1 && id !== "heal" ? "" : undefined}>
          <kbd>{i + 1}</kbd><span className="arena-medal"><Icon size={26} /></span><b>{def.name}</b>
          {id !== "heal" && <em>{next === 1 ? "NOUVEAU" : `NIV. ${next}/${def.max}`}</em>}
          <small>{def.desc(next)}</small>
        </Button>;
      })}</div>
    </div></div>}
    {(hud.phase === "over" || hud.phase === "paused") && !hud.menuOpen && <div className="arena-overlay"><div className="arena-dialog">
      <p className="arena-kicker">ARÈNE · SURVIE</p>
      <Laurels><h2>{hud.phase === "over" ? "FIN DU COMBAT" : "EN PAUSE"}</h2></Laurels>
      {hud.phase === "over" && <>
        <p className="arena-result">{hud.score} points · {Math.floor(hud.elapsed)}s de survie</p>
        <ul className="arena-summary">
          <li><Skull size={16} /><b>{hud.kills}</b>éliminations</li>
          <li><Sparkles size={16} /><b>{hud.level}</b>niveau</li>
          <li><Trophy size={16} /><b>{hud.bossesKilled}</b>boss vaincu{hud.bossesKilled > 1 ? "s" : ""}</li>
        </ul>
        {taken.length > 0 && <div className="arena-build">{taken.map(([id, n]) => { const Icon = UPGRADE_ICON[id]; return <span key={id} title={UPGRADES[id].name}><Icon size={16} />{n}</span>; })}</div>}
      </>}
      <Button className="arena-start" onClick={hud.phase === "paused" ? pause : start}>{hud.phase === "over" ? <RotateCcw /> : <Play />}{hud.phase === "over" ? "Rejouer" : "Reprendre"}</Button>
    </div></div>}
  </main>;
}
