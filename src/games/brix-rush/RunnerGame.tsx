import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { respawnDue, resetToStart } from "./respawn";
import { Home } from "lucide-react";
import type { Me, RemoteState } from "./net";
import { CELL, HOP_MS, ROWS, VIEW_H, blockedByFence, carsAt, fencesAt, hitByCar, laneAt, toMeters } from "./world";
import { positionUpdateDue } from "./sync";
import { createVehiclePainter } from "./vehicles";
import { ANIMALS, type AnimalId } from "./animals";
import { createTerrainPainter } from "./terrain";
import fenceUrl from "@/assets/brix-rush/terrain/fence.png";
import brixRushLogo from '@/assets/brix-rush-logo.png';

type Props = {
  onMenu: () => void;
  onDeath?: (score: number, duration: number) => void;
  seed: string;
  me: Me;
  remote: React.MutableRefObject<Record<string, RemoteState>>;
  send: (s: Omit<RemoteState, "t">) => void;
  animals: React.MutableRefObject<Record<string, AnimalId>>;
  onScores: (rows: { id: string; name: string; hue: number; x: number; best: number; dead: boolean; me: boolean }[]) => void;
};

type Dir = "up" | "down" | "left" | "right";

function cssVar(name: string) {
  return getComputedStyle(document.querySelector(".brix-original") ?? document.documentElement).getPropertyValue(name).trim();
}

/** Shared clock so traffic is identical on every screen. */
const sharedTime = () => Date.now() / 1000;

export function RunnerGame({ seed, me, remote, send, animals, onScores, onMenu, onDeath }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const queue = useRef<Dir[]>([]);
  const deathCallback = useRef(onDeath);
  deathCallback.current = onDeath;
  const menuRef = useRef<HTMLButtonElement>(null);

  const press = (d: Dir) => { if (queue.current.length < 2) queue.current.push(d); };

  useEffect(() => {
    const map: Record<string, Dir> = {
      ArrowLeft: "left", KeyA: "left", KeyQ: "left",
      ArrowRight: "right", KeyD: "right",
      ArrowUp: "up", KeyW: "up", KeyZ: "up",
      ArrowDown: "down", KeyS: "down",
    };
    const down = (e: KeyboardEvent) => { const d = map[e.code]; if (d) { e.preventDefault(); if (!e.repeat) press(d); } };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const drawVehicle = createVehiclePainter();
    const drawTerrain = createTerrainPainter();
    const fenceImg = new Image();
    fenceImg.src = fenceUrl;
    const titleImg = new Image();
    titleImg.src = brixRushLogo;
    const c = {
      grass: cssVar("--game-grass"), grass2: cssVar("--game-grass-2"), road: cssVar("--game-road"),
      mark: cssVar("--game-mark"), void: cssVar("--background"), car: cssVar("--game-obstacle"), text: cssVar("--foreground"), line: cssVar("--primary"),
    };
    let W = 800;
    let scale = 1;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = wrap.clientWidth, ch = wrap.clientHeight;
      scale = ch / VIEW_H;
      W = cw / scale;
      canvas.width = cw * dpr; canvas.height = ch * dpr;
      canvas.style.width = `${cw}px`; canvas.style.height = `${ch}px`;
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const startRow = Math.floor(ROWS / 2);
    const p = { col: 0, row: startRow, fromCol: 0, fromRow: startRow, hopT: 0, dead: false, deadT: 0, best: 0, started: false };
    let runStartedAt = Date.now();
    let camX = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rendered: Record<string, { x: number; y: number; targetX: number; targetY: number; stepT: number; dx: number; dy: number }> = {};
    let sendT = 0, scoreT = 0, raf = 0;

    // Visual-only step: wind-up, push-off, directional stride, then springy landing.
    // Neither the grid position nor the collision/broadcast timing uses this pose.
    const stepPose = (elapsed: number, dx: number, dy: number, dead: boolean) => {
      if (dead || reducedMotion || (dx === 0 && dy === 0) || elapsed < 0) {
        return { lift: 0, lean: 0, stretch: 0, stride: 0 };
      }
      const k = Math.min(1, elapsed / HOP_MS);
      const windup = k < 0.2 ? Math.sin(k / 0.2 * Math.PI) : 0;
      const flight = k > 0.2 && k < 1 ? Math.sin((k - 0.2) / 0.8 * Math.PI) : 0;
      const landingT = (elapsed - HOP_MS) / 110;
      const landing = landingT >= 0 && landingT < 1 ? Math.sin(landingT * Math.PI * 2) * (1 - landingT) : 0;
      const stride = Math.sin(k * Math.PI * 2) * (1 - k);
      return {
        lift: flight * 6 - windup * 2,
        lean: dx * (flight * 0.22 + stride * 0.08 - landing * 0.07) + dy * stride * 0.05,
        stretch: flight * 0.13 - windup * 0.12 - landing * 0.15,
        stride: stride * 2.5,
      };
    };

    const animalImgs = Object.fromEntries(ANIMALS.map((a) => {
      const im = new Image(); im.src = a.url; return [a.id, im];
    })) as Record<AnimalId, HTMLImageElement>;
    const drawChick = (sx: number, sy: number, hue: number, alpha: number, name: string, dead: boolean, pose: ReturnType<typeof stepPose>, animal?: AnimalId) => {
      const { lift } = pose;
      ctx.globalAlpha = alpha;
      const img = animal ? animalImgs[animal] : undefined;
      if (img?.complete && img.naturalWidth) {
        ctx.fillStyle = c.road;
        ctx.globalAlpha = alpha * (0.35 - Math.max(0, lift) * 0.018);
        ctx.beginPath(); ctx.ellipse(sx + CELL / 2 + 3, sy + CELL / 2 + 9, 16 - Math.max(0, lift) * 0.6, 8 - Math.max(0, lift) * 0.25, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = alpha;
        if (dead) ctx.filter = "grayscale(1) brightness(0.7)";
        const size = CELL + 12;
        // Feet-anchored squash/stretch and direction-dependent body lean.
        const ph = name.length * 1.7 + hue * 0.05;
        const tt = performance.now() / 1000;
        const breathe = dead || reducedMotion ? 0 : Math.sin(tt * 4 + ph) * 0.025;
        const sy2 = 1 + breathe + pose.stretch, sx2 = 1 - breathe * 0.6 - pose.stretch * 0.65;
        const sway = dead || reducedMotion ? 0 : Math.sin(tt * 2.2 + ph) * 0.025;
        ctx.save();
        ctx.translate(sx + CELL / 2 + pose.stride, sy + CELL / 2 + size / 2 - lift);
        ctx.rotate(sway + pose.lean);
        ctx.scale(sx2, sy2);
        ctx.drawImage(img, -size / 2, -size, size, size);
        ctx.restore();
        ctx.filter = "none";
        ctx.fillStyle = `oklch(0.85 0.15 ${hue})`;
        ctx.font = "600 11px 'Chakra Petch', sans-serif"; ctx.textAlign = "center";
        ctx.fillText(name, sx + CELL / 2, sy - 6 - lift);
        ctx.globalAlpha = 1;
        return;
      }
      const s = CELL - 10;
      const x = sx + 5, y = sy + 5 - lift;
      ctx.fillStyle = c.road;
      ctx.globalAlpha = alpha * 0.35;
      ctx.beginPath(); ctx.ellipse(sx + CELL / 2 + 4, sy + CELL / 2 + 7, 15, 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `oklch(0.5 0.12 ${hue})`;
      ctx.beginPath(); ctx.roundRect(x + 3, y + 4, s, s, 7); ctx.fill();
      ctx.shadowColor = `oklch(0.78 0.18 ${hue})`; ctx.shadowBlur = 5;
      ctx.fillStyle = dead ? `oklch(0.5 0.04 ${hue})` : `oklch(0.8 0.17 ${hue})`;
      ctx.beginPath(); ctx.roundRect(x, y, s, s, 9); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = c.car; // beak
      ctx.fillRect(x + s - 2, y + s / 2 - 3, 6, 6);
      ctx.fillStyle = c.road; // eye
      ctx.fillRect(x + s - 10, y + 7, 4, 4);
      ctx.fillStyle = c.text;
      ctx.font = "600 11px 'Chakra Petch', sans-serif"; ctx.textAlign = "center";
      ctx.fillText(name, sx + CELL / 2, sy - 2 - lift);
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      const t = sharedTime();

      if (!p.dead && now - p.hopT >= HOP_MS && queue.current.length) {
        const d = queue.current.shift();
        p.started = true;
        p.fromCol = p.col; p.fromRow = p.row;
        let nc = p.col, nr = p.row;
        if (d === "right") nc++;
        if (d === "left") nc = Math.max(0, nc - 1);
        if (d === "up") nr = Math.max(0, nr - 1);
        if (d === "down") nr = Math.min(ROWS - 1, nr + 1);
        if (!blockedByFence(seed, nc, nr)) { p.col = nc; p.row = nr; }
        p.hopT = now;
        p.best = Math.max(p.best, p.col * CELL);
      }
      if (p.dead && respawnDue(now, p.deadT)) {
        resetToStart(p, startRow); queue.current = []; runStartedAt = Date.now();
      }
      const k = Math.min(1, (now - p.hopT) / HOP_MS);
      const px = (p.fromCol + (p.col - p.fromCol) * k) * CELL;
      const py = (p.fromRow + (p.row - p.fromRow) * k) * CELL;
      if (!p.dead && hitByCar(seed, Math.round(px / CELL), py, t)) { p.dead = true; p.deadT = now; queue.current = []; deathCallback.current?.(p.col, (Date.now() - runStartedAt) / 1000); }

      const target = px - Math.min(W * 0.3, 200);
      camX += (target - camX) * 0.12;

      // Cosmetic orthographic incline: game coordinates and all collision logic stay unchanged.
      ctx.fillStyle = c.road;
      ctx.fillRect(0, 0, W, VIEW_H);
      ctx.save();
      ctx.transform(1, 0, -0.16, 0.86, VIEW_H * 0.08, VIEW_H * 0.07);

      // lanes
      const c0 = Math.floor(camX / CELL) - 5;
      const cEnd = Math.ceil((camX + W) / CELL) + 5;
      for (let col = c0; col < cEnd; col++) {
        const sx = col * CELL - camX;
        if (col < 0) {
          ctx.fillStyle = c.void;
          ctx.fillRect(sx, -VIEW_H, CELL + 1, VIEW_H * 3);
          continue;
        }
        const lane = laneAt(seed, col);
        if (lane.safe === true) {
          ctx.fillStyle = col % 2 ? c.grass : c.grass2;
          ctx.fillRect(sx, -VIEW_H, CELL + 1, VIEW_H * 3);
        } else {
          ctx.fillStyle = c.road;
          ctx.fillRect(sx, -VIEW_H, CELL + 1, VIEW_H * 3);
        }
        drawTerrain(ctx, sx, col, lane.safe, col === 0 || laneAt(seed, col - 1).safe, laneAt(seed, col + 1).safe);
      }
      // "BRIX RUSH" title floating in the void behind the spawn, anchored in the world.
      {
        const tx = -CELL * 2.6 - camX;
        if (tx > -W && tx < W + 200 && titleImg.complete && titleImg.naturalWidth) {
          const titleWidth = 160;
          const titleHeight = titleWidth * titleImg.naturalHeight / titleImg.naturalWidth;
          ctx.drawImage(titleImg, tx - titleWidth / 2, VIEW_H / 2 - titleHeight / 2, titleWidth, titleHeight);
        }
      }
      // fences (block the cell they stand on)
      if (fenceImg.complete && fenceImg.naturalWidth) {
        const fh = (CELL - 4) * (fenceImg.naturalHeight / fenceImg.naturalWidth) * 1.6;
        for (let col = Math.max(0, c0); col < cEnd; col++) {
          for (const row of fencesAt(seed, col)) {
            const cx = col * CELL - camX + CELL / 2, cy = row * CELL + CELL / 2;
            ctx.fillStyle = cssVar("--brix-shadow-soft");
            ctx.beginPath(); ctx.ellipse(cx + 3, cy + 3, fh / 2, (CELL - 4) / 2, 0, 0, Math.PI * 2); ctx.fill();
            ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 2);
            ctx.drawImage(fenceImg, -(CELL - 4) / 2, -fh / 2, CELL - 4, fh);
            ctx.restore();
          }
        }
      }
      // start line
      ctx.fillStyle = c.line;
      for (let y = 0; y < VIEW_H; y += 16) ctx.fillRect(3 * CELL - camX - 2, y, 4, 8);

      // Colored artwork uses the original traffic positions and collision dimensions.
      for (let col = Math.max(0, c0); col < cEnd; col++) {
        const lane = laneAt(seed, col);
        if (lane.safe === true) continue;
        const sx = col * CELL - camX;
        for (const y of carsAt(lane, t)) {
          const index = Math.round((y - lane.phase - lane.dir * lane.speed * t) / lane.period);
          drawVehicle(ctx, seed, col, index, lane.carLen, lane.dir, sx + 5, y + 3, CELL - 10, lane.carLen * CELL - 6);
        }
      }

      // other players
      const offLeft: RemoteState[] = [], offRight: RemoteState[] = [];
      for (const r of Object.values(remote.current)) {
        const rr = (rendered[r.id] ??= { x: r.x, y: r.y, targetX: r.x, targetY: r.y, stepT: 0, dx: 0, dy: 0 });
        if (r.x !== rr.targetX || r.y !== rr.targetY) {
          const reset = Math.abs(r.x - rr.targetX) > CELL * 2 || Math.abs(r.y - rr.targetY) > CELL * 2;
          rr.dx = reset ? 0 : Math.sign(r.x - rr.targetX);
          rr.dy = reset ? 0 : Math.sign(r.y - rr.targetY);
          rr.stepT = now;
          rr.targetX = r.x; rr.targetY = r.y;
        }
        if (Math.abs(r.x - rr.x) > 400) rr.x = r.x; else rr.x += (r.x - rr.x) * 0.3;
        rr.y += (r.y - rr.y) * 0.3;
        const sx = rr.x - camX;
        if (sx < -CELL) offLeft.push(r);
        else if (sx > W) offRight.push(r);
        else drawChick(sx, rr.y, r.hue, 0.7, r.name, r.dead, stepPose(now - rr.stepT, rr.dx, rr.dy, r.dead), animals.current[r.id]);
      }
      drawChick(px - camX, py, me.hue, p.dead ? 0.5 : 1, me.name, p.dead, stepPose(now - p.hopT, p.col - p.fromCol, p.row - p.fromRow, p.dead), animals.current[me.id]);
      ctx.restore();
      // Menu button is anchored in the start grass: same incline transform as the world.
      if (menuRef.current) {
        const wx = CELL * 1.5 - camX, wy = CELL * 1.6;
        const mx = (wx - 0.16 * wy + VIEW_H * 0.08) * scale, my = (0.86 * wy + VIEW_H * 0.07) * scale;
        menuRef.current.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      }
      ctx.font = "600 12px 'Chakra Petch', sans-serif";
      offLeft.forEach((r, i) => {
        ctx.fillStyle = `oklch(0.8 0.17 ${r.hue})`; ctx.textAlign = "left";
        ctx.fillText(`◀ ${r.name} -${toMeters(px - r.x)}`, 10, 60 + i * 18);
      });
      offRight.forEach((r, i) => {
        ctx.fillStyle = `oklch(0.8 0.17 ${r.hue})`; ctx.textAlign = "right";
        ctx.fillText(`${r.name} +${toMeters(r.x - px)} ▶`, W - 10, 60 + i * 18);
      });

      ctx.fillStyle = c.text; ctx.textAlign = "center";
      ctx.font = "400 22px 'Russo One', sans-serif";
      ctx.fillText(`${p.col}`, W / 2, 30);
      if (!p.started) {
        ctx.font = "400 16px 'Russo One', sans-serif";
        ctx.fillText("▶ POUR TRAVERSER · ▲ ▼ POUR ESQUIVER", W / 2, VIEW_H / 2 - 40);
      } else if (p.dead) {
        ctx.fillStyle = c.car; ctx.font = "400 26px 'Russo One', sans-serif";
        ctx.fillText(`ÉCRASÉ · record ${toMeters(p.best)}`, W / 2, VIEW_H / 2 - 40);
      }

      if (positionUpdateDue(now, sendT)) {
        sendT = now;
        send({ id: me.id, name: me.name, hue: me.hue, x: px, y: py, dead: p.dead, best: p.best });
      }
      if (now - scoreT > 250) {
        scoreT = now;
        onScores([
          { id: me.id, name: me.name, hue: me.hue, x: px, best: p.best, dead: p.dead, me: true },
          ...Object.values(remote.current).map((r) => ({ id: r.id, name: r.name, hue: r.hue, x: r.x, best: r.best, dead: r.dead, me: false })),
        ]);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, me]);

  const btn = (d: Dir) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); press(d); },
  });

  return (
    <div ref={wrapRef} className="game-stage touch-none select-none">
      <canvas ref={canvasRef} aria-label="Brix Rush" />
      <Button ref={menuRef} onClick={onMenu} variant="ghost" className="grass-menu-btn" aria-label="Retour au menu">
        <Home className="h-4 w-4" /> Menu
      </Button>
      <div className="game-pad game-pad-left flex-col">
        <Button variant="ghost" className="pad-btn" aria-label="Monter" {...btn("up")}>▲</Button>
        <Button variant="ghost" className="pad-btn" aria-label="Descendre" {...btn("down")}>▼</Button>
      </div>
      <div className="game-pad game-pad-right items-end">
        <Button variant="ghost" className="pad-btn" aria-label="Reculer" {...btn("left")}>◀</Button>
        <Button variant="ghost" className="pad-btn pad-btn-jump" aria-label="Avancer" {...btn("right")}>▶</Button>
      </div>
    </div>
  );
}
