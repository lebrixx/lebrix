import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage, translations } from "@/hooks/useLanguage";

import { CELL, HOP_MS, ROWS, VIEW_H, blockedByFence, carsAt, fencesAt, hitByCar, laneAt, toMeters } from "./world";

import { createVehiclePainter } from "./vehicles";
import { ANIMALS, type AnimalId } from "./animals";
import { createTerrainPainter } from "./terrain";
import fenceAsset from "@/assets/brix-rush/terrain/fence.png.asset.json";
const fenceUrl = fenceAsset.url;

type Props = {
  initialCol?: number;
  graceMs?: number;
  shield?: boolean;
  onShieldUsed: () => void;
  onScore: (score: number) => void;
  onDie: (score: number) => void;
};

type Dir = "up" | "down" | "left" | "right";

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Shared clock so traffic is identical on every screen. */
const sharedTime = () => Date.now() / 1000;

export function RunnerGame({ initialCol = 0, graceMs = 0, shield = false, onShieldUsed, onScore, onDie }: Props) {
  const { language } = useLanguage();
  const t = translations[language];
  const seed = "BRIX";
  const me = { id: "solo", name: "", hue: 190 };
  const animal = useRef(ANIMALS[Math.floor(Math.random() * ANIMALS.length)]?.id ?? "dog");
  const callbacks = useRef({ onShieldUsed, onScore, onDie });
  callbacks.current = { onShieldUsed, onScore, onDie };
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const queue = useRef<Dir[]>([]);


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
    const c = {
      grass: cssVar("--brix-grass"), grass2: cssVar("--brix-grass-2"), road: cssVar("--brix-road"),
      mark: cssVar("--brix-mark"), void: cssVar("--brix-void"), car: cssVar("--brix-obstacle"), text: cssVar("--brix-highlight"), line: cssVar("--brix-line"),
    };
    let W = 800;
    let scale = 1;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = wrap.clientWidth, ch = wrap.clientHeight;
      scale = Math.min(ch / VIEW_H, cw / 520);
      W = cw / scale;
      canvas.width = cw * dpr; canvas.height = ch * dpr;
      canvas.style.width = `${cw}px`; canvas.style.height = `${ch}px`;
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, dpr * (ch - VIEW_H * scale) / 2);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const startRow = Math.floor(ROWS / 2);
    const p = { col: initialCol, row: startRow, fromCol: initialCol, fromRow: startRow, hopT: 0, dead: false, deadT: 0, best: initialCol * CELL, started: false };
    let protectedUntil = performance.now() + graceMs;
    let shieldLeft = shield;
    let lastScore = initialCol;
    let lastNow = performance.now();
    let camX = initialCol * CELL - Math.min(W * 0.3, 200);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;

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
        ctx.font = "600 11px sans-serif"; ctx.textAlign = "center";
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
      ctx.font = "600 11px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(name, sx + CELL / 2, sy - 2 - lift);
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      const t = sharedTime();
      if (now - lastNow > 500) protectedUntil = now + 1000;
      lastNow = now;

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
        const nextScore = toMeters(p.best);
        if (nextScore > lastScore) { lastScore = nextScore; callbacks.current.onScore(nextScore); }
      }
      const k = Math.min(1, (now - p.hopT) / HOP_MS);
      const px = (p.fromCol + (p.col - p.fromCol) * k) * CELL;
      const py = (p.fromRow + (p.row - p.fromRow) * k) * CELL;
      if (!p.dead && now > protectedUntil && hitByCar(seed, Math.round(px / CELL), py, t)) {
        if (shieldLeft) { shieldLeft = false; protectedUntil = now + 1800; callbacks.current.onShieldUsed(); }
        else { p.dead = true; p.deadT = now; queue.current = []; callbacks.current.onDie(toMeters(p.best)); }
      }

      const target = px - Math.min(W * 0.3, 200);
      camX += (target - camX) * 0.12;

      // Cosmetic orthographic incline: game coordinates and all collision logic stay unchanged.
      ctx.fillStyle = c.road;
      const extraHeight = wrap.clientHeight / scale - VIEW_H;
      ctx.fillRect(0, -extraHeight / 2, W, VIEW_H + extraHeight);
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
        const tx = -CELL * 1.5 - camX;
        if (tx > -W && tx < W + 200) {
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.font = "800 24px sans-serif";
          const lines: [string, number][] = [["BRIX", VIEW_H / 2 - 26], ["RUSH", VIEW_H / 2 + 26]];
          for (let d = 8; d > 0; d--) {
            ctx.fillStyle = d === 8 ? cssVar("--brix-shadow") : `color-mix(in oklab, ${c.line} ${35 + d * 3}%, black)`;
            for (const [txt, ty] of lines) ctx.fillText(txt, tx + d * 0.9, ty + d);
          }
          ctx.fillStyle = c.line;
          for (const [txt, ty] of lines) ctx.fillText(txt, tx, ty);
          ctx.fillStyle = cssVar("--brix-highlight-soft");
          for (const [txt, ty] of lines) ctx.fillText(txt, tx - 1, ty - 1.5);
          ctx.fillStyle = c.line;
          for (const [txt, ty] of lines) ctx.fillText(txt, tx, ty);
          ctx.textBaseline = "alphabetic";
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

      drawChick(px - camX, py, me.hue, p.dead ? 0.5 : 1, "", p.dead, stepPose(now - p.hopT, p.col - p.fromCol, p.row - p.fromRow, p.dead), animal.current);
      ctx.restore();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCol, graceMs, shield]);

  const btn = (d: Dir) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); press(d); },
  });

  return (
    <>
      <div ref={wrapRef} className="brix-stage touch-none select-none"><canvas ref={canvasRef} aria-label="Brix Rush" /></div>
      <div className="brix-controls">
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="brix-pad" aria-label={t.brixUp} {...btn("up")}><ArrowUp /></Button>
          <Button variant="outline" size="icon" className="brix-pad" aria-label={t.brixDown} {...btn("down")}><ArrowDown /></Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="brix-pad" aria-label={t.brixBack} {...btn("left")}><ArrowLeft /></Button>
          <Button size="icon" className="brix-pad brix-forward" aria-label={t.brixForward} {...btn("right")}><ArrowRight /></Button>
        </div>
      </div>
    </>
  );
}
