import { MoonSpin } from "./MoonSpin";
import { moonAsRock, moonPass } from "./lib/moon";
import { earthPass } from "./lib/earth";
import { useEffect, useRef, useState } from "react";
import { BOSS_EVERY, bossDue, bossStats, bossVolley, canSpawnRegular, difficulty, retainEnemiesWithBoss, nextBossTime, pickKind, shooterCooldown, tankDelay, tankDue } from "./lib/difficulty";
import { asteroidBlockingShot, createAsteroidField } from "./lib/asteroids";
import { BONUS, MENU_BONUS, randomBonus, type BonusType, type Timed, type Tone } from "./lib/bonuses";
import f104 from "./assets/f104.png";
import { createSpaceBackground } from "./lib/space-background";
import { createGameVisuals } from "./lib/game-visuals";
import { Button } from "./Button";
import { ArrowLeft, Bomb, Home, Play } from "lucide-react";
import { avoidBodies, droneSpawnX, droneVelocity, separateDrones } from './lib/drone-motion';
import { applyBombDamage, defeatReward } from './lib/combat';

const W = 480;
let H = 720;
type Kind = "drone" | "zig" | "tank" | "shooter" | "boss";
type Enemy = { x: number; y: number; vx: number; vy: number; r: number; hp: number; max: number; kind: Kind; t: number; cd: number; seed: number; base: number; rank?: number; bombKill?: boolean };
type Bullet = { x: number; y: number; vx: number; vy: number; r: number; dmg: number; hits?: Set<object> | undefined };
type Drop = { x: number; y: number; type: BonusType; t: number };
const TONE_CLASS: Record<Tone, string> = { p: "text-primary border-primary", s: "text-secondary border-secondary", a: "text-accent border-accent", d: "text-destructive border-destructive", fg: "text-foreground border-foreground" };
const PLAYER_LIFT = 196;
let PLAYER_Y = H - 70;
type Part = { x: number; y: number; vx: number; vy: number; l: number; c: string };

const STATS: Record<Exclude<Kind, "boss">, { hp: number; r: number; pts: number }> = {
  drone: { hp: 2, r: 12, pts: 10 },
  zig: { hp: 3, r: 13, pts: 20 },
  tank: { hp: 12, r: 22, pts: 60 },
  shooter: { hp: 5, r: 15, pts: 40 },
};

export function AssautGame({ onBack, onStart, onFinish }: { onBack: () => void; onStart: () => void; onFinish: (score: number, duration: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const bombReq = useRef(false);
  const menuBackground = useRef<HTMLCanvasElement>(null);
  const launchActive = useRef(false);
  const launchDone = useRef(false);
  const [state, setState] = useState<"menu" | "play" | "over">("menu");
  const [result, setResult] = useState({ score: 0, time: 0 });
  const [best, setBest] = useState(0);
  const menuShip = useRef<HTMLImageElement>(null);
  const [launching, setLaunching] = useState(false);
  const [bombsLeft, setBombsLeft] = useState(2);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const setPause = (v: boolean) => { pausedRef.current = v; setPaused(v); };
  // Fly the menu aircraft onto the playing line, then start the run.
  const launch = () => {
    const ship = menuShip.current, cv = canvas.current;
    if (!ship || !cv || launching) return;
    ship.getAnimations().forEach(animation => animation.cancel());
    ship.style.animation = "none";
    const s = ship.getBoundingClientRect(), c = (cv.parentElement ?? cv).getBoundingClientRect();
    // Same line the game will use once it measures its screen.
    const h = Math.round(Math.min(1100, Math.max(600, (W * c.height) / c.width)));
    const scale = c.width / W, size = 85 * scale;
    const dx = c.left + c.width / 2 - (s.left + s.width / 2);
    const dy = c.top + (h - PLAYER_LIFT) * (c.height / h) - (s.top + s.height / 2);
    ship.style.animation = "none";
    const end = `translate(${dx}px, ${dy}px) scale(${size / s.height})`;
    ship.animate([
      { transform: "translate(0, 0) scale(1)", filter: "brightness(1)" },
      { transform: "translate(0, -18px) scale(1.06)", filter: "brightness(1.25)", offset: 0.22 },
      { transform: end, filter: "brightness(1)" },
    ], { duration: 1000, easing: "cubic-bezier(.6,0,.2,1)", fill: "forwards" });
    launchActive.current = true; launchDone.current = false;
    onStart();
    setLaunching(true);
    window.setTimeout(() => setState("play"), 120);
    window.setTimeout(() => { launchDone.current = true; }, 1020);
  };

  useEffect(() => {
    if (state === 'play' && !launching) return;
    const cv = menuBackground.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const box = cv.getBoundingClientRect();
    cv.width = W; cv.height = Math.round(Math.min(1100, Math.max(600, W * box.height / box.width)));
    const draw = createSpaceBackground(); let raf = 0;
    const paint = () => { if (!draw(ctx, cv.width, cv.height, 0)) raf = requestAnimationFrame(paint); };
    paint(); return () => cancelAnimationFrame(raf);
  }, [state, launching]);

  useEffect(() => setBest(Number(localStorage.getItem("assaut-best") || 0)), []);

  useEffect(() => {
    if (state !== "play") return;
    const cv = canvas.current;
    if (!cv?.parentElement) return;
    const box = cv.parentElement.getBoundingClientRect();
    H = Math.round(Math.min(1100, Math.max(600, (W * box.height) / box.width)));
    PLAYER_Y = H - PLAYER_LIFT;
    cv.width = W; cv.height = H;
    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed;top:0;height:env(safe-area-inset-top);visibility:hidden";
    document.body.appendChild(probe);
    const inset = probe.getBoundingClientRect().height; probe.remove();
    const TOP = Math.round((inset + 22) * (W / box.width));
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const css = getComputedStyle(cv.closest(".assaut-original") ?? cv);
    const col = (n: string) => css.getPropertyValue(n).trim();
    const C = { bg: col("--background"), fg: col("--foreground"), p: col("--primary"), s: col("--secondary"), a: col("--accent"), d: col("--destructive"), b: col("--border"), m: col("--muted-foreground"), ink: col("--game-ink"), smoke: col("--game-smoke") };
    const shipImg = new Image(); shipImg.src = f104;
    const visuals = createGameVisuals(ctx, C, W, H);
    const asteroids = createAsteroidField(W, H);
    const kindColor: Record<Kind, string> = { drone: C.d, zig: C.s, tank: C.a, shooter: C.m, boss: C.d };

    const keys: Record<string, boolean> = {};
    const fx: Record<Timed, number> = { rapid: 0, pierce: 0 };
    let pops: { x: number; y: number; text: string; c: string; l: number }[] = [];
    const pl = { x: W / 2, y: PLAYER_Y, r: 12, hp: 5, power: 1, shield: 0, bombs: 2, inv: 0, cd: 0 };
    setBombsLeft(pl.bombs);
    let prevX = pl.x, bank = 0;
    let target: { x: number; y: number } | null = null;
    let enemies: Enemy[] = [], shots: Bullet[] = [], foe: Bullet[] = [], drops: Drop[] = [], parts: Part[] = [];
    let score = 0, kills = 0, combo = 0, comboT = 0, time = 0, nextBoss = BOSS_EVERY, bossCount = 0, spawnT = 1.5, tankT = 0, banner = 0, bannerText = "", lastLevel = 0, shake = 0, flash = 0;
    let raf = 0, last = performance.now(), dead = false;
    let firstBossDeath: number | null = null;

    const spawn = (k: Kind, x?: number) => {
      const d = difficulty(time);
      if (k === "boss") {
        bossCount++;
        const stats = bossStats(bossCount);
        enemies = retainEnemiesWithBoss(enemies, { x: W / 2, y: -90, vx: stats.movement, vy: 90, r: 58, hp: stats.hp, max: stats.hp, kind: "boss", t: 0, cd: 1.5, seed: 0, base: 90, rank: bossCount });
        return;
      }
      const st = STATS[k];
      const hp = Math.ceil(st.hp * d.hpScale);
      const vy = k === "tank" ? 45 + d.speedBonus * 0.3 : k === "shooter" ? 90 : 80 + d.speedBonus;
      const preferredX = x ?? 30 + Math.random() * (W - 60);
      const spawnX = k === 'drone' ? droneSpawnX(enemies, preferredX, W) : preferredX;
      if (spawnX === null) return;
      enemies.push({ x: spawnX, y: -42, vx: 0, vy: vy * 0.7, r: st.r, hp, max: hp, kind: k, t: 0, seed: Math.random(), base: vy, cd: k === "shooter" ? shooterCooldown(time) : (1 + Math.random() * 2) / d.fireRate });
    };
    const burst = (x: number, y: number, c: string, n: number) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = 50 + Math.random() * 250;
        parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, l: 0.4 + Math.random() * 0.5, c });
      }
    };
    const aimAt = (e: Enemy, speed: number, spread = 0) => {
      const a = Math.atan2(pl.y - e.y, pl.x - e.x) + spread;
      foe.push({ x: e.x, y: e.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 5, dmg: 1 });
    };
    const bomb = () => {
      if (pl.bombs <= 0) return;
      pl.bombs--; setBombsLeft(pl.bombs); flash = 0.5; shake = 0.4; foe = [];
      for (const rock of asteroids.rocks) burst(rock.x, rock.y, C.smoke, 14);
      asteroids.clear();
      for (const e of enemies) { applyBombDamage(e); burst(e.x, e.y, kindColor[e.kind], 8); }
    };
    const hurt = () => {
      if (pl.inv > 0) return;
      if (pl.shield > 0) { pl.shield = 0; pl.inv = 1; burst(pl.x, pl.y, C.p, 20); return; }
      pl.hp--; pl.inv = 1.5; shake = 0.3; combo = 0;
      burst(pl.x, pl.y, C.fg, 25);
      if (pl.hp <= 0) dead = true;
    };

    const toCanvas = (cx: number, cy: number) => {
      const r = cv.getBoundingClientRect();
      return { x: ((cx - r.left) / r.width) * W, y: ((cy - r.top) / r.height) * H };
    };
    const kd = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
      if (e.key === "b" || e.key === "Shift") bomb();
      if (e.key.startsWith("Arrow") || e.key === " ") e.preventDefault();
    };
    const ku = (e: KeyboardEvent) => (keys[e.key.toLowerCase()] = false);
    const pd = (e: PointerEvent) => { target = toCanvas(e.clientX, e.clientY); };
    const pm = (e: PointerEvent) => { if (e.buttons || e.pointerType !== "mouse") target = toCanvas(e.clientX, e.clientY); };
    const pu = () => { target = null; };
    addEventListener("keydown", kd); addEventListener("keyup", ku);
    cv.addEventListener("pointerdown", pd); cv.addEventListener("pointermove", pm); addEventListener("pointerup", pu);


    const launchStarted = performance.now();
    let stepping = false;
    const loop = (now: number) => {
      const dt = Math.max(0, Math.min(0.033, (now - last) / 1000)); last = now;
      if (launchActive.current) {
        visuals.background(W, H, 0);
        const warm = visuals.depth([], { x: pl.x, y: pl.y, bank: 0, visible: launchDone.current }, 0, [], null, null);
        if (launchDone.current && (warm || now - launchStarted > 2500)) {
          launchActive.current = false; setLaunching(false); last = performance.now();
        }
        raf = requestAnimationFrame(loop); return;
      }
      if (pausedRef.current) { raf = requestAnimationFrame(loop); return; }
      if (bombReq.current) { bombReq.current = false; bomb(); }

      // joueur
      let dx = 0, dy = 0;
      if (keys["arrowleft"] || keys["q"] || keys["a"]) dx--;
      if (keys["arrowright"] || keys["d"]) dx++;
                  if (dx || dy) { const l = Math.hypot(dx, dy); pl.x += (dx / l) * 340 * dt;  }
      else if (target) { pl.x += (target.x - pl.x) * Math.min(1, dt * 12);  }
      pl.x = Math.max(pl.r, Math.min(W - pl.r, pl.x)); pl.y = PLAYER_Y;
      const vx = dt > 0 ? (pl.x - prevX) / dt : 0; prevX = pl.x;
      bank += (Math.max(-1, Math.min(1, vx / 340)) * 0.3 - bank) * Math.min(1, dt * 10);
      for (const k of Object.keys(fx) as Timed[]) fx[k] = Math.max(0, fx[k] - dt);
      pl.inv = Math.max(0, pl.inv - dt); pl.cd -= dt;
      if (pl.cd <= 0) {
        pl.cd = fx.rapid > 0 ? 0.055 : 0.11;
        const p = pl.power;
        const fire = (ox: number, a: number) => shots.push({ x: pl.x + ox, y: pl.y - 30, vx: Math.sin(a) * 700, vy: -Math.cos(a) * 700, r: 3, dmg: 1, hits: fx.pierce > 0 ? new Set() : undefined });
        // Chaque niveau d'arme ajoute exactement une ligne de tir.
        for (let i = 0; i < p; i++) { const o = i - (p - 1) / 2; fire(o * 9, o * 0.07); }
      }

      // Arrivées continues, interrompues uniquement par les duels de boss.
      time += dt; spawnT -= dt; banner = Math.max(0, banner - dt);
      const diff = difficulty(time);
      let bossAlive = enemies.some((e) => e.kind === "boss" && e.hp > 0);
      if (bossDue(time, nextBoss, bossAlive)) {
        spawn("boss"); bossAlive = true; nextBoss = Infinity;
        spawnT = 1.5; tankT = tankDelay(Math.random()); banner = 2; bannerText = `⚠ BOSS ${bossCount} ⚠`;
      }
      const lvl = Math.floor(time / 30);
      if (lvl > lastLevel) { lastLevel = lvl; if (!bossAlive && banner <= 0) { banner = 1.2; bannerText = "DANGER +"; } }
      // Le blindé est en pause pendant un duel : le compte à rebours reprend juste après.
      if (bossAlive) spawnT = 1.5; else tankT -= dt;
      if (spawnT <= 0 && canSpawnRegular(bossAlive)) {
        spawnT = diff.interval;
        const k = pickKind(time, Math.random());
        if (k === "drone" && Math.random() < diff.groupChance) {
          const cx = 60 + Math.random() * (W - 120);
          for (let i = -1; i <= 1; i++) spawn("drone", cx + i * 58);
        } else spawn(k);
      }
      if (tankDue(time, tankT, bossAlive)) { tankT = tankDelay(Math.random()); spawn("tank"); }

      const edt = dt;
      if (asteroids.update(edt, pl)) { hurt(); burst(pl.x, pl.y, C.smoke, 18); }
      const moon = moonPass(time, W, H);
      const earth = earthPass(time, W, H, firstBossDeath);
      const planets = [moon, earth].filter((planet) => planet !== null);
      const blockers = [...asteroids.rocks, ...planets.map(moonAsRock)];
      avoidBodies(enemies, planets.map(moonAsRock), W);
      for (const planet of planets) {
        if (Math.hypot(planet.x - pl.x, planet.y - pl.y) < planet.r + pl.r - 4) { if (pl.inv <= 0) burst(pl.x, pl.y, C.smoke, 18); hurt(); }
      }
      if (import.meta.env.DEV) {
        cv.dataset['asteroids'] = JSON.stringify(asteroids.rocks.map(({ x, y, r }) => ({ x, y, r })));
        cv.dataset['moon'] = JSON.stringify(moon ? { x: moon.x, y: moon.y, r: moon.r } : null);
        cv.dataset['earth'] = JSON.stringify(earth);
        cv.dataset['pilot'] = JSON.stringify({ x: pl.x, y: pl.y, hp: pl.hp });
        cv.dataset['combat'] = JSON.stringify({ time, bossCount, nextBoss, enemies: enemies.map(({ kind, x, y, hp, max }) => ({ kind, x, y, hp, max })), projectiles: foe.map(({ vx, vy }) => ({ vx, vy })) });
      }
      // ennemis
      for (const e of enemies) {
        e.t += edt; e.cd -= edt;
        if (e.kind === "boss") {
          const stopY = TOP + 175;
          if (e.y < stopY) e.y = Math.min(stopY, e.y + e.vy * edt);
          else {
            e.x += e.vx * edt;
            if (e.x < 105 || e.x > W - 105) { e.x = Math.max(105, Math.min(W - 105, e.x)); e.vx *= -1; }
          }
          if (e.cd <= 0 && e.y >= stopY) {
            const volley = bossVolley(e.rank ?? bossCount, e.t, e.hp < e.max / 2, Math.atan2(pl.y - e.y, pl.x - e.x));
            for (const velocity of volley.velocities) foe.push({ x: e.x, y: e.y + 30, ...velocity, r: 5, dmg: 1 });
            e.cd = volley.cooldown;
          }
        } else {
          const ease = (cur: number, want: number, k: number) => cur + (want - cur) * Math.min(1, edt * k);
          const ph = e.seed * Math.PI * 2;
          if (e.kind === "drone") {
            const want = droneVelocity(e.t, e.seed);
            e.vx = ease(e.vx, want, 1.6); e.vy = ease(e.vy, e.base * 1.15, 0.6);
          } else if (e.kind === "zig") {
            const freq = 1.4 + e.seed * 1.0, amp = 110 + e.seed * 70;
            e.vx = ease(e.vx, Math.sin(e.t * freq + ph) * amp, 3);
            e.vy = ease(e.vy, e.base * (0.85 + 0.25 * Math.cos(e.t * freq * 2 + ph)), 2);
          } else if (e.kind === "tank") {
            e.vx = ease(e.vx, Math.sin(e.t * 0.5 + ph) * 30, 1); e.vy = ease(e.vy, e.base, 0.5);
          }
          if (e.kind === "shooter") {
            const stopY = 110 + e.seed * 120, leaving = e.t > 9;
            e.vy = ease(e.vy, leaving ? e.base * 1.4 : Math.max(0, Math.min(e.base, (stopY - e.y) * 1.5)), leaving ? 0.8 : 2.5);
            e.vx = ease(e.vx, Math.sin(e.t * 0.7 + ph) * 55, 1.2);
          }
          if (e.x < 40) e.vx += (40 - e.x) * edt * 10;
          if (e.x > W - 40) e.vx -= (e.x - (W - 40)) * edt * 10;
          if (e.kind === "shooter") { if (e.cd <= 0) { aimAt(e, 200 + diff.speedBonus * 0.5); e.cd = shooterCooldown(time); } }
          if (e.kind === "tank" && e.cd <= 0) { for (let s = -1; s <= 1; s++) aimAt(e, 180, s * 0.3); e.cd = 2.2 / diff.fireRate; }
          e.x += e.vx * edt; e.y += e.vy * edt;
          e.x = Math.max(e.r, Math.min(W - e.r, e.x));
        }
      }
      separateDrones(enemies, W);
      for (const e of enemies) {
        if (Math.hypot(e.x - pl.x, e.y - pl.y) < e.r + pl.r - 4) { hurt(); if (e.kind !== "boss") e.hp = 0; }
      }

      // tirs
      for (const b of shots) {
        const from = { x: b.x, y: b.y };
        b.x += b.vx * dt; b.y += b.vy * dt;
        if (asteroidBlockingShot(blockers, from, b)) {
          parts.push({ x: b.x, y: b.y, vx: 0, vy: 0, l: 0.15, c: C.fg });
          b.y = -99; continue;
        }
        for (const e of enemies) {
          if (e.hp > 0 && Math.hypot(b.x - e.x, b.y - e.y) < e.r + b.r && !b.hits?.has(e)) { e.hp -= b.dmg; parts.push({ x: b.x, y: b.y, vx: 0, vy: 0, l: 0.1, c: C.fg }); if (b.hits) b.hits.add(e); else { b.y = -99; break; } }
        }
      }
      shots = shots.filter((b) => b.y > -20 && b.x > -20 && b.x < W + 20);
      for (const b of foe) {
        const from = { x: b.x, y: b.y };
        b.x += b.vx * edt; b.y += b.vy * edt;
        if (asteroidBlockingShot(blockers, from, b)) {
          parts.push({ x: b.x, y: b.y, vx: 0, vy: 0, l: 0.15, c: C.fg });
          b.y = H + 99; continue;
        }
        if (Math.hypot(b.x - pl.x, b.y - pl.y) < b.r + 5) { b.y = H + 99; hurt(); }
      }
      foe = foe.filter((b) => b.y < H + 20 && b.y > -40 && b.x > -20 && b.x < W + 20);

      // morts
      comboT -= dt; if (comboT <= 0) combo = 0;
      enemies = enemies.filter((e) => {
        if (e.hp <= 0) {
          if (!e.bombKill) { combo++; comboT = 2; }
          // 2 points tous les 3 avions abattus, 3 points par boss.
          const reward = defeatReward(e, kills);
          kills = reward.kills; score += reward.points;
          burst(e.x, e.y, kindColor[e.kind], e.kind === "boss" ? 80 : 14);
          shake = Math.max(shake, e.kind === "boss" ? 0.6 : 0.08);
          const r = Math.random();
          if (e.kind === "boss") { const rank = e.rank ?? bossCount; if (rank === 1) firstBossDeath = time; nextBoss = nextBossTime(time, rank); if (rank === 3) { pl.shield = 1; pops.push({ x: pl.x, y: pl.y - 40, text: "BOUCLIER", c: C.s, l: 1.6 }); } else { if (pl.power < 9) pl.power++; pops.push({ x: pl.x, y: pl.y - 40, text: "ARME +1", c: C.p, l: 1.6 }); } drops.push({ x: e.x, y: e.y, type: randomBonus(), t: 0 }, { x: e.x - 40, y: e.y, type: "heal", t: 0 }, { x: e.x + 40, y: e.y, type: randomBonus(), t: 0 }); }
          else if (r < (e.kind === "tank" ? 0.6 : e.kind === "shooter" ? 0.15 : 0.09)) drops.push({ x: e.x, y: e.y, type: randomBonus(), t: 0 });
          return false;
        }
        return e.y < H + 60;
      });

      // bonus
      drops = drops.filter((d) => {
        d.t += dt; d.y += 90 * dt;
        if (Math.hypot(d.x - pl.x, d.y - pl.y) < 30) {
          const info = BONUS[d.type];
          if (info.dur) fx[d.type as Timed] = info.dur;
          pops.push({ x: d.x, y: d.y - 10, text: info.name, c: C[info.tone], l: 1.2 });
          if (d.type === "power" && pl.power < 9) pl.power++;
          if (d.type === "shield") pl.shield = 1;
          if (d.type === "heal") pl.hp = Math.min(5, pl.hp + 1);
          burst(d.x, d.y, C[info.tone], 14);
          return false;
        }
        return d.y < H + 20;
      });
      parts = parts.filter((p) => (p.l -= dt) > 0);
      for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96; }

      if (dead) {
        const b = Math.max(score, Number(localStorage.getItem("assaut-best") || 0));
        localStorage.setItem("assaut-best", String(b)); setBest(b);
        setResult({ score, time }); setState("over"); onFinish(score, time); return;
      }

      if (stepping) return;
      // rendu
      shake = Math.max(0, shake - dt); flash = Math.max(0, flash - dt);
      ctx.save();
      if (shake > 0) ctx.translate((Math.random() - 0.5) * shake * 30, (Math.random() - 0.5) * shake * 30);
      visuals.background(W, H, time);
      ctx.shadowBlur = 0;

      for (const d of drops) {
        const info = BONUS[d.type], c = C[info.tone];
        const sz = 15 * (1 + Math.sin(d.t * 8) * 0.08);
        // halo lumineux pulsant derrière la pastille
        const halo = ctx.createRadialGradient(d.x, d.y, sz * 0.4, d.x, d.y, sz * 2.2);
        halo.addColorStop(0, c); halo.addColorStop(1, "transparent");
        ctx.save(); ctx.globalAlpha = 0.22 + Math.sin(d.t * 6) * 0.08;
        ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(d.x, d.y, sz * 2.2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        // pastille sombre avec liseré coloré et reflet supérieur
        ctx.shadowColor = c; ctx.shadowBlur = 10;
        ctx.fillStyle = C.ink;
        ctx.beginPath(); ctx.roundRect(d.x - sz, d.y - sz, sz * 2, sz * 2, 8); ctx.fill();
        ctx.shadowBlur = 0; ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.stroke();
        ctx.save(); ctx.globalAlpha = 0.14; ctx.fillStyle = C.fg;
        ctx.beginPath(); ctx.roundRect(d.x - sz + 3, d.y - sz + 3, sz * 2 - 6, sz * 0.75, 5); ctx.fill(); ctx.restore();
        ctx.fillStyle = c; ctx.textAlign = "center";
        ctx.shadowColor = c; ctx.shadowBlur = 6;
        ctx.font = "bold 17px 'Work Sans', sans-serif"; ctx.fillText(info.icon, d.x, d.y + 6);
        ctx.shadowBlur = 0;
        // étiquette du nom sur une petite pastille sombre
        ctx.font = "bold 9px 'Work Sans', sans-serif";
        const labelW = ctx.measureText(info.name).width + 12;
        ctx.globalAlpha = 0.85; ctx.fillStyle = C.ink;
        ctx.beginPath(); ctx.roundRect(d.x - labelW / 2, d.y + sz + 5, labelW, 13, 6); ctx.fill();
        ctx.globalAlpha = 1; ctx.fillStyle = c; ctx.fillText(info.name, d.x, d.y + sz + 15);
      }
      ctx.textAlign = "left";

      const shipVisible = !(pl.inv > 0 && Math.floor(now / 80) % 2);
      const hasDepth = visuals.depth(enemies, { x: pl.x, y: pl.y, bank, visible: false }, time, asteroids.rocks, moon, earth);
      if (!hasDepth) {
        for (const e of enemies) visuals.aircraft(e, time);
        for (const rock of asteroids.rocks) visuals.asteroid(rock);
        if (moon) visuals.moon(moon);
        if (earth) visuals.earth(earth);
      }
      for (const b of shots) visuals.projectile(b, false);
      for (const b of foe) visuals.projectile(b, true);

      if (shipVisible) {
        ctx.save();
        ctx.translate(pl.x, pl.y);
        ctx.rotate(bank);
        visuals.exhaust(0, 34, 20 + Math.sin(now * 0.035) * 5, 4);
        // Même sprite que l'écran d'accueil, à la taille où l'animation le dépose.
        if (shipImg.complete && shipImg.naturalWidth > 0) {
          const sw = 85 * shipImg.naturalWidth / shipImg.naturalHeight;
          ctx.drawImage(shipImg, -sw / 2, -42.5, sw, 85);
        }
        ctx.restore();
        if (pl.shield) { ctx.strokeStyle = C.s; ctx.shadowColor = C.s; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(pl.x, pl.y, 30, 0, Math.PI * 2); ctx.stroke(); }
      }

      for (const p of parts) visuals.particle(p);
      ctx.globalAlpha = 1;
      ctx.restore();
      ctx.shadowBlur = 0;

      if (flash > 0) { ctx.globalAlpha = flash; ctx.fillStyle = C.fg; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }

      // HUD — a restrained translucent instrument strip keeps text readable over the scenery.
      ctx.fillStyle = C.ink; ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.roundRect(8, TOP + 3, W - 16, 53, 8); ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = C.fg; ctx.font = "bold 15px 'Work Sans', sans-serif";
      ctx.fillText(`${score}`, 12, TOP + 24);
      const mm = Math.floor(time / 60), ss = Math.floor(time % 60);
      ctx.fillText(`${mm}:${String(ss).padStart(2, "0")}`, W / 2 - 20, TOP + 24);
      ctx.fillStyle = C.d; ctx.fillText("♥".repeat(pl.hp), W - 14 - pl.hp * 13, TOP + 24);
      ctx.fillStyle = C.m; ctx.font = "12px 'Work Sans', sans-serif";
      ctx.fillText(`ARME ${pl.power}`, 12, TOP + 44);
      pops = pops.filter((p) => (p.l -= dt) > 0);
      ctx.textAlign = "center"; ctx.font = "900 15px 'Work Sans', sans-serif";
      for (const p of pops) { p.y -= 40 * dt; ctx.globalAlpha = Math.min(1, p.l * 1.5); ctx.fillStyle = p.c; ctx.fillText(p.text, p.x, p.y); }
      ctx.globalAlpha = 1; ctx.textAlign = "left";
      // effets actifs : pastilles sombres avec icône colorée et jauge arrondie
      let row = 0;
      for (const k of Object.keys(fx) as Timed[]) {
        if (fx[k] <= 0) continue;
        const info = BONUS[k], c = C[info.tone], y = TOP + 64 + row++ * 28;
        ctx.globalAlpha = 0.8; ctx.fillStyle = C.ink;
        ctx.beginPath(); ctx.roundRect(8, y, 132, 24, 7); ctx.fill(); ctx.globalAlpha = 1;
        ctx.strokeStyle = c; ctx.globalAlpha = 0.5; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(8, y, 132, 24, 7); ctx.stroke(); ctx.globalAlpha = 1;
        ctx.fillStyle = c; ctx.font = "bold 11px 'Work Sans', sans-serif";
        ctx.fillText(`${info.icon} ${info.name}`, 16, y + 11);
        ctx.fillStyle = C.b; ctx.beginPath(); ctx.roundRect(16, y + 16, 116, 4, 2); ctx.fill();
        ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(16, y + 16, 116 * (fx[k] / (info.dur ?? 1)), 4, 2); ctx.fill();
      }
      if (pl.shield) {
        const y = TOP + 64 + row * 28;
        ctx.globalAlpha = 0.8; ctx.fillStyle = C.ink;
        ctx.beginPath(); ctx.roundRect(8, y, 132, 24, 7); ctx.fill(); ctx.globalAlpha = 1;
        ctx.strokeStyle = C.s; ctx.globalAlpha = 0.5; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(8, y, 132, 24, 7); ctx.stroke(); ctx.globalAlpha = 1;
        ctx.fillStyle = C.s; ctx.font = "bold 11px 'Work Sans', sans-serif";
        ctx.fillText("◯ BOUCLIER ACTIF", 16, y + 16);
      }
      if (combo > 2) { ctx.fillStyle = C.a; ctx.fillText(`COMBO x${combo}`, W - 110, TOP + 44); }
      const boss = enemies.find((e) => e.kind === "boss");
      if (boss) {
        ctx.fillStyle = C.ink; ctx.fillRect(40, TOP + 108, W - 80, 31);
        ctx.fillStyle = C.fg; ctx.font = "bold 11px 'Work Sans', sans-serif";
        ctx.fillText(`BOSS ${boss.rank ?? bossCount}`, 48, TOP + 121);
        ctx.fillStyle = C.b; ctx.fillRect(48, TOP + 127, W - 96, 6);
        ctx.fillStyle = C.d; ctx.fillRect(48, TOP + 127, (W - 96) * Math.max(0, boss.hp / boss.max), 6);
      }
      if (banner > 0) {
        ctx.globalAlpha = Math.min(1, banner); ctx.fillStyle = bannerText.includes("BOSS") ? C.d : C.a; ctx.textAlign = "center";
        ctx.font = "900 34px 'Work Sans', sans-serif";
        ctx.fillText(bannerText, W / 2, H / 2);
        ctx.textAlign = "left"; ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(loop);
    };
    if (import.meta.env.DEV) {
      const debug = {
        state: () => ({ time, score, kills, nextBoss, firstBossDeath, bossCount, pilot: { ...pl } }),
        protectPilot: () => { pl.inv = 10000; },
        damageBoss: () => { const boss = enemies.find(e => e.kind === 'boss'); if (boss) boss.hp = 0; },
        sim: (seconds: number) => {
          stepping = true;
          for (let t = 0; t < seconds && !dead; t += 0.02) loop(last + Math.min(0.02, seconds - t) * 1000);
          stepping = false; last = performance.now();
        },
      };
      Object.assign(window, { __game: debug });
    }
    raf = requestAnimationFrame(loop);
    return () => {
      if (import.meta.env.DEV) Reflect.deleteProperty(window, '__game');
      visuals.dispose(); delete cv.dataset['sceneReady'];
      delete cv.dataset['moon']; delete cv.dataset['earth']; delete cv.dataset['asteroids']; delete cv.dataset['pilot']; delete cv.dataset['combat'];
      cancelAnimationFrame(raf); removeEventListener("keydown", kd); removeEventListener("keyup", ku);
      cv.removeEventListener("pointerdown", pd); cv.removeEventListener("pointermove", pm); removeEventListener("pointerup", pu);
    };
  }, [state]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Enter" && state !== "play") launch(); };
    addEventListener("keydown", k); return () => removeEventListener("keydown", k);
  }, [state]);

  return (
    <main className="assaut-original arena-bg fixed inset-0 flex h-dvh w-full touch-none overscroll-none justify-center overflow-hidden">
      <div className="relative h-full w-full max-w-[520px]">
        <canvas ref={canvas} width={W} height={720} className="arena-canvas block h-full w-full touch-none" />
        {state === "play" && !launching && (
          <>
            <Button onClick={() => setPause(true)} className="arena-btn arena-btn-sm absolute left-1/2 top-[calc(env(safe-area-inset-top)+3.5rem)] -translate-x-1/2">
              <ArrowLeft /> MENU
            </Button>
            <Button variant="ghost" type="button" aria-label={`Bombe, ${bombsLeft} restante${bombsLeft > 1 ? "s" : ""}`} disabled={bombsLeft <= 0}
              onPointerDown={(e) => { e.preventDefault(); bombReq.current = true; }}
              onClick={() => (bombReq.current = true)}
              className="arena-bomb absolute bottom-[calc(env(safe-area-inset-bottom)+1.4rem)] left-6">
              <span className="arena-bomb-disc">
                <Bomb className="h-7 w-7" />
                <span className="arena-bomb-count">× {bombsLeft}</span>
              </span>
            </Button>
            {paused && (
              <div className="arena-menu absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 px-6 text-center">
                <h2 className="arena-title text-5xl">PAUSE</h2>
                <Button onClick={() => setPause(false)} className="arena-btn w-56"><Play /> REPRENDRE</Button>
                <Button onClick={() => { setPause(false); setState("menu"); }} variant="outline" className="arena-btn arena-btn-sm w-56"><ArrowLeft /> MENU</Button>
              </div>
            )}
          </>
        )}
        {(state !== "play" || launching) && (
          <>
          <canvas ref={menuBackground} aria-hidden className="absolute inset-0 h-full w-full" />
          {!launching && (
            <Button variant="ghost" onClick={onBack} type="button" aria-label="Menu principal" className="arena-btn arena-btn-sm arena-home absolute left-4 top-[calc(env(safe-area-inset-top)+1rem)] z-20 flex items-center justify-center rounded-full">
              <Home />
            </Button>
          )}
          <div className={`arena-menu absolute inset-0 transition-[background] duration-700 ${launching ? "arena-launch" : ""} flex flex-col items-center justify-between overflow-hidden px-6 pb-[calc(env(safe-area-inset-bottom)+1.75rem)] pt-[calc(env(safe-area-inset-top)+2.5rem)] text-center`}>
            <header className={`relative z-10 flex flex-col items-center gap-1 transition-opacity duration-300 ${launching ? "opacity-0" : ""}`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-primary">Combat aérien</p>
              <h1 className="arena-title text-6xl tracking-tight">ASSAUT</h1>
            </header>
            <div className="flex flex-col items-center gap-4">
              <MoonSpin className={`arena-planet arena-planet-right pointer-events-none absolute -right-20 top-28 h-52 w-52`} />
              <MoonSpin planet="earth" className={`arena-planet arena-planet-left pointer-events-none absolute -left-20 top-48 h-52 w-52`} />
              <img ref={menuShip} src={f104} alt="F-104 Starfighter" className="arena-ship relative z-10 h-36 w-auto" />
              {state === "over" ? (
                <div className={`arena-card w-64 px-5 py-4 transition-opacity duration-300 ${launching ? "opacity-0" : ""}`}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-destructive">Abattu</p>
                  <p className="arena-title text-4xl">{result.score}</p>
                  <p className="text-xs text-muted-foreground">Survie {Math.floor(result.time / 60)}:{String(Math.floor(result.time % 60)).padStart(2, "0")} · Record {best}</p>
                </div>
              ) : (
                <div className={`arena-card px-5 py-2 text-sm transition-opacity duration-300 ${launching ? "opacity-0" : ""}`}>Record <span className="font-bold text-foreground">{best}</span></div>
              )}
            </div>
            <div className={`flex w-full max-w-sm flex-col items-center gap-5 transition-opacity duration-300 ${launching ? "opacity-0" : ""}`}>
              <div className="flex w-full flex-col items-center gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Bonus à récolter</p>
                <div className="grid w-full grid-cols-5 gap-2">
                  {MENU_BONUS.map((b) => (
                    <div key={b.key} className="arena-card flex flex-col items-center gap-1.5 px-1 py-2.5">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full border text-base font-bold leading-none ${TONE_CLASS[b.tone]}`}
                        style={{ background: "color-mix(in oklab, currentColor 16%, transparent)", boxShadow: "0 0 14px color-mix(in oklab, currentColor 30%, transparent)" }}
                      >
                        {b.icon}
                      </span>
                      <span className="text-[8px] font-bold leading-tight text-foreground">{b.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={launch} disabled={launching} className="arena-btn w-full max-w-64 py-4 text-base">
                <Play />
                {state === "menu" ? "JOUER" : "REJOUER"}
              </Button>
              <p className="text-xs text-muted-foreground">Glisse le doigt pour piloter</p>
            </div>
          </div>
          </>
        )}
      </div>
    </main>
  );
}
