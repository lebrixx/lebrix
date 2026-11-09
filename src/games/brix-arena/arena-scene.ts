// Colosseum decor for Brix Arena: static backdrop (stands, podium, sand, cover)
// pre-rendered once, plus live layers (crowd, braziers, gate, dust).
// Everything here is cosmetic and drawn in simulation coordinates.
import stoneWallUrl from "./assets/arena/stone-wall.svg";
import pillarUrl from "./assets/arena/pillar.svg";
import brazierUrl from "./assets/arena/brazier.svg";
import bannerUrl from "./assets/arena/banner.svg";
import gateUrl from "./assets/arena/gate.svg";
import portcullisUrl from "./assets/arena/portcullis.svg";
import emblemUrl from "./assets/arena/emblem.svg";
import flagstonesUrl from "./assets/arena/flagstones.svg";
import crowdUrl from "./assets/arena/crowd.svg";
import crowdCheerUrl from "./assets/arena/crowd-cheer.svg";
import { WIDTH as W, HEIGHT as H, GATE_Y, GATE_HALF } from "./world";

export type SceneTheme = "colosseum" | "pit";

const URLS = { stone: stoneWallUrl, pillar: pillarUrl, brazier: brazierUrl, banner: bannerUrl, gate: gateUrl, portcullis: portcullisUrl, emblem: emblemUrl, flagstones: flagstonesUrl, crowd: crowdUrl, crowdCheer: crowdCheerUrl };
export type SceneAssets = Record<keyof typeof URLS, HTMLImageElement>;

export function loadSceneAssets(): Promise<SceneAssets> {
  const entries = Object.entries(URLS).map(([k, url]) => new Promise<[string, HTMLImageElement]>(resolve => {
    const img = new Image(); img.onload = () => resolve([k, img]); img.onerror = () => resolve([k, img]); img.src = url;
  }));
  return Promise.all(entries).then(list => Object.fromEntries(list) as SceneAssets);
}

/** Backdrop extents in simulation units (the field is 0..W x 0..H). */
const X0 = -420, Y0 = -470, X1 = W + 420, Y1 = H + 330;
const PODIUM = 46, ROW = 30, ROWS = 14;
const ok = (img: HTMLImageElement) => img.complete && img.naturalWidth > 0;
/** Copy of an image with a colour laid over its opaque pixels. */
const tint = (img: HTMLImageElement, color: string, alpha: number): CanvasImageSource => {
  if (!ok(img)) return img;
  const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
  const x = c.getContext("2d"); if (!x) return img;
  x.drawImage(img, 0, 0); x.globalCompositeOperation = "source-atop"; x.globalAlpha = alpha; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
  return c;
};

/** Small seeded RNG so the decor is identical every run. */
const rng = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

type Seat = { x: number; y: number; w: number; h: number; side: boolean; phase: number; flip: boolean };
export const BRAZIERS: { x: number; y: number }[] = [
  { x: -23, y: -24 }, { x: W + 23, y: -24 }, { x: 230, y: -40 }, { x: 770, y: -40 },
  { x: -23, y: 330 }, { x: -23, y: 500 }, { x: W + 23, y: 330 }, { x: W + 23, y: 500 },
  { x: -23, y: H + 24 }, { x: W + 23, y: H + 24 }, { x: 230, y: H + 24 }, { x: 770, y: H + 24 },
];
const TOWERS = [-23, W + 23, 418, 582];
const BANNERS = [120, 330, 670, 880];
const TOP_AISLES = [80, 300, 700, 920], SIDE_AISLES = [420, 560];

export class ArenaScene {
  backdrop: HTMLCanvasElement | null = null;
  private k = 1;
  private seats: Seat[] = [];
  private crowdTiles: { idle: HTMLCanvasElement; cheer: HTMLCanvasElement } | null = null;
  private dust: { x: number; y: number; vx: number; vy: number; s: number; p: number }[] = [];

  private stone: CanvasImageSource;
  private get pit() { return this.theme === "pit"; }

  constructor(private a: SceneAssets, private walls: { min: { x: number; y: number }; max: { x: number; y: number } }[], private theme: SceneTheme = "colosseum") {
    const r = rng(42);
    this.stone = this.pit ? tint(a.stone, "#160c0c", 0.74) : a.stone;
    // Golden dust in the arena; rising embers in the pit.
    for (let i = 0; i < 46; i++) this.dust.push({ x: r() * W, y: r() * H, vx: this.pit ? -3 + r() * 6 : 4 + r() * 8, vy: this.pit ? -14 - r() * 18 : -2 + r() * 4, s: 1 + r() * 2.2, p: r() * 6 });
    // Seats: one crowd tile per section of each row, skipping aisles, towers and the main gate.
    for (let i = 0; i < ROWS; i++) {
      const o = PODIUM + i * ROW, jitter = (i * 37) % 60;
      for (let x = -o + jitter; x < W + o; x += 104) {
        const cx = x + 52;
        if (TOP_AISLES.some(a => Math.abs(a - cx) < 62)) continue;
        if (i < 5 && TOWERS.some(t => Math.abs(t - cx) < 70)) continue;
        if (i < 3 && Math.abs(cx - 500) < 120) continue;
        this.seats.push({ x, y: -o - ROW + 6, w: 104, h: 32, side: false, phase: r() * 6, flip: r() < 0.5 });
        if (Math.abs(cx - 500) > 70 || i > 1) this.seats.push({ x, y: H + o + 4, w: 104, h: 32, side: false, phase: r() * 6, flip: r() < 0.5 });
      }
      for (let y = -o + 30; y < H + o - 20; y += 32) {
        if (SIDE_AISLES.some(a => Math.abs(a - y) < 34) || (Math.abs(y - 310) < 40 || Math.abs(y - GATE_Y) < 70) && i < 2) continue;
        this.seats.push({ x: -o - ROW + 1, y: y - 26, w: 30, h: 30, side: true, phase: r() * 6, flip: false });
        this.seats.push({ x: W + o + 1, y: y - 26, w: 30, h: 30, side: true, phase: r() * 6, flip: true });
      }
    }
    this.seats.sort((p, q) => p.y - q.y);
  }

  /** Paints the static backdrop at `k` pixels per unit (capped to stay light on phones). */
  build(k: number) {
    const area = (X1 - X0) * (Y1 - Y0);
    this.k = Math.max(0.5, Math.min(k, Math.sqrt(5.2e6 / area)));
    const cv = document.createElement("canvas");
    cv.width = Math.ceil((X1 - X0) * this.k); cv.height = Math.ceil((Y1 - Y0) * this.k);
    const ctx = cv.getContext("2d"); if (!ctx) return;
    ctx.scale(this.k, this.k); ctx.translate(-X0, -Y0);
    this.paintStands(ctx);
    this.paintPodium(ctx);
    if (this.pit) this.paintPitFloor(ctx); else this.paintSand(ctx);
    this.paintCover(ctx);
    this.paintTowers(ctx);
    this.backdrop = cv;
    this.crowdTiles = this.rasterCrowd();
  }

  private pattern(ctx: CanvasRenderingContext2D, scale: number) {
    if (!ok(this.a.stone)) return this.pit ? "#2a1c1a" : "#a9814e";
    const p = ctx.createPattern(this.stone, "repeat"); if (!p) return "#a9814e";
    p.setTransform(new DOMMatrix().scale(scale));
    return p;
  }

  private paintStands(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#24160b"; ctx.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
    for (let i = ROWS - 1; i >= 0; i--) {
      const o = PODIUM + i * ROW + ROW, r = 30 + o;
      const tone = this.pit ? (i % 2 ? [50, 40, 38] : [60, 47, 43]) : i % 2 ? [128, 96, 60] : [140, 106, 67];
      const fade = Math.min(1, i / ROWS) * 0.35;
      ctx.fillStyle = `rgb(${tone[0] * (1 - fade)},${tone[1] * (1 - fade)},${tone[2] * (1 - fade)})`;
      ctx.beginPath(); ctx.roundRect(-o, -o, W + 2 * o, H + 2 * o, r); ctx.fill();
      // Riser shadow under the seat edge, and a sunlit lip.
      ctx.strokeStyle = "rgba(40,22,8,.55)"; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.roundRect(-o + ROW - 3, -o + ROW - 3, W + 2 * (o - ROW + 3), H + 2 * (o - ROW + 3), r - ROW); ctx.stroke();
      ctx.strokeStyle = this.pit ? "rgba(255,120,60,.18)" : "rgba(232,196,140,.35)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(-o + 2, -o + 2, W + 2 * (o - 2), H + 2 * (o - 2), r - 2); ctx.stroke();
    }
    // Stairways cutting through the stands.
    const stair = (x: number, y: number, w: number, h: number, vertical: boolean) => {
      ctx.fillStyle = this.pit ? "#3e302b" : "#b08654"; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "rgba(60,36,14,.5)"; ctx.lineWidth = 1.5;
      if (vertical) for (let s = y; s < y + h; s += 10) { ctx.beginPath(); ctx.moveTo(x, s); ctx.lineTo(x + w, s); ctx.stroke(); }
      else for (let s = x; s < x + w; s += 10) { ctx.beginPath(); ctx.moveTo(s, y); ctx.lineTo(s, y + h); ctx.stroke(); }
      ctx.fillStyle = "rgba(40,22,8,.35)"; vertical ? ctx.fillRect(x + w - 3, y, 3, h) : ctx.fillRect(x, y + h - 3, w, 3);
    };
    for (const x of TOP_AISLES) { stair(x - 11, Y0, 22, -PODIUM - Y0, true); stair(x - 11, H + PODIUM, 22, Y1 - H - PODIUM, true); }
    for (const y of SIDE_AISLES) { stair(X0, y - 11, -PODIUM - X0, 22, false); stair(W + PODIUM, y - 11, X1 - W - PODIUM, 22, false); }
    // Sunset haze darkening the far rows.
    const g = ctx.createLinearGradient(0, Y0, 0, -PODIUM);
    g.addColorStop(0, this.pit ? "rgba(40,4,0,.8)" : "rgba(30,12,4,.75)"); g.addColorStop(0.6, this.pit ? "rgba(90,14,0,.3)" : "rgba(60,24,6,.25)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(X0, Y0, X1 - X0, -PODIUM - Y0);
  }

  private paintPodium(ctx: CanvasRenderingContext2D) {
    // Cap all around the field.
    ctx.fillStyle = this.pattern(ctx, 0.42); ctx.beginPath(); ctx.roundRect(-PODIUM, -PODIUM, W + 2 * PODIUM, H + 2 * PODIUM, 40); ctx.fill();
    ctx.fillStyle = this.pit ? "rgba(255,120,60,.05)" : "rgba(255,226,170,.18)"; ctx.beginPath(); ctx.roundRect(-PODIUM, -PODIUM, W + 2 * PODIUM, H + 2 * PODIUM, 40); ctx.fill();
    ctx.strokeStyle = this.pit ? "rgba(255,110,40,.55)" : "rgba(240,206,150,.7)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(-PODIUM + 2, -PODIUM + 2, W + 2 * PODIUM - 4, H + 2 * PODIUM - 4, 38); ctx.stroke();
    // Far wall face, seen from the field (north side).
    ctx.fillStyle = this.pattern(ctx, 0.36); ctx.fillRect(-6, -34, W + 12, 34);
    const face = ctx.createLinearGradient(0, -34, 0, 0); face.addColorStop(0, this.pit ? "rgba(0,0,0,.3)" : "rgba(255,230,180,.15)"); face.addColorStop(1, this.pit ? "rgba(255,70,20,.28)" : "rgba(40,20,6,.45)");
    ctx.fillStyle = face; ctx.fillRect(-6, -34, W + 12, 34);
    ctx.fillStyle = this.pit ? "#5a3a30" : "#e0bd86"; ctx.fillRect(-6, -38, W + 12, 5);
    ctx.fillStyle = "rgba(40,20,6,.6)"; ctx.fillRect(-6, -2, W + 12, 3);
    // Gates: main north gate (boss entrance), tunnels south, west and east.
    if (ok(this.a.gate)) ctx.drawImage(this.pit ? tint(this.a.gate, "#140a0a", 0.6) : this.a.gate, 430, -97, 140, 101.5);
    const tunnel = (x: number, y: number, w: number, h: number) => {
      const g = ctx.createLinearGradient(x, y, x + (w > h ? 0 : w), y + (w > h ? h : 0));
      g.addColorStop(0, "#0b0603"); g.addColorStop(1, "#2a1608");
      ctx.fillStyle = this.pit ? "#3a2a26" : "#c9a26a"; ctx.fillRect(x - 8, y - 8, w + 16, h + 16);
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "#2b2b2e"; ctx.lineWidth = 4;
      if (w > h) for (let s = x + 8; s < x + w; s += 14) { ctx.beginPath(); ctx.moveTo(s, y); ctx.lineTo(s, y + h); ctx.stroke(); }
      else for (let s = y + 8; s < y + h; s += 14) { ctx.beginPath(); ctx.moveTo(x, s); ctx.lineTo(x + w, s); ctx.stroke(); }
    };
    tunnel(452, H + 6, 96, 30);
    // The side passage between the two rooms: east in the arena, west in the pit. The other side is a plain tunnel.
    if (this.pit) tunnel(W + 8, 272, 30, 76); else tunnel(-38, 272, 30, 76);
    this.paintPortalFrame(ctx);
    // Banners hanging from the far wall.
    if (ok(this.a.banner)) for (const x of BANNERS) ctx.drawImage(this.a.banner, x - 15, -40, 30, 72);
  }

  private paintSand(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.beginPath(); ctx.roundRect(0, 0, W, H, 16); ctx.clip();
    const g = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, 620);
    g.addColorStop(0, "#d3a465"); g.addColorStop(0.6, "#bf8f52"); g.addColorStop(1, "#9c7040");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const r = rng(7);
    // Grain
    for (let i = 0; i < 9000; i++) { const light = r() < 0.5; ctx.fillStyle = light ? `rgba(255,236,190,${0.05 + r() * 0.1})` : `rgba(90,56,24,${0.05 + r() * 0.12})`; const s = 0.8 + r() * 1.8; ctx.fillRect(r() * W, r() * H, s, s); }
    // Raked rings around the centre
    ctx.lineWidth = 2;
    for (let rad = 300; rad < 640; rad += 13) { ctx.strokeStyle = `rgba(110,72,34,${rad % 26 ? 0.05 : 0.08})`; ctx.beginPath(); ctx.arc(W / 2, H / 2, rad, 0, Math.PI * 2); ctx.stroke(); }
    // Scuffs, footprints and old stains
    for (let i = 0; i < 70; i++) { const x = r() * W, y = r() * H, a = r() * Math.PI; ctx.fillStyle = "rgba(95,60,26,.12)"; ctx.beginPath(); ctx.ellipse(x, y, 3.2, 1.8, a, 0, Math.PI * 2); ctx.ellipse(x + Math.cos(a + 1.2) * 7, y + Math.sin(a + 1.2) * 7, 3.2, 1.8, a, 0, Math.PI * 2); ctx.fill(); }
    for (let i = 0; i < 6; i++) { const x = 80 + r() * (W - 160), y = 60 + r() * (H - 120); ctx.fillStyle = "rgba(92,36,16,.13)"; ctx.beginPath(); ctx.ellipse(x, y, 16 + r() * 22, 9 + r() * 12, r() * 3, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + 18, y + 8, 6, 4, 0, 0, Math.PI * 2); ctx.fill(); }
    if (ok(this.a.flagstones)) for (const [x, y, s] of [[60, 70, 1], [800, 60, 0.9], [70, 520, 0.95], [820, 520, 1.05], [430, 520, 0.8], [520, 64, 0.7]] as const) ctx.drawImage(this.a.flagstones, x, y, 150 * s, 86 * s);
    if (ok(this.a.emblem)) { ctx.globalAlpha = 0.95; ctx.drawImage(this.a.emblem, W / 2 - 250, H / 2 - 250, 500, 500); ctx.globalAlpha = 1; }
    // Carved lettering in the centre ring
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "700 46px Cinzel, Georgia, serif";
    for (const [t, y] of [["BRIX", H / 2 - 92], ["ARENA", H / 2 + 92]] as const) { ctx.fillStyle = "rgba(255,230,180,.28)"; ctx.fillText(t, W / 2, y + 2); ctx.fillStyle = "rgba(80,48,20,.42)"; ctx.fillText(t, W / 2, y); }
    // Shade cast by the podium walls
    const edge = (x0: number, y0: number, x1: number, y1: number, rx: number, ry: number, rw: number, rh: number, a: number) => { const e = ctx.createLinearGradient(x0, y0, x1, y1); e.addColorStop(0, `rgba(48,24,6,${a})`); e.addColorStop(1, "rgba(48,24,6,0)"); ctx.fillStyle = e; ctx.fillRect(rx, ry, rw, rh); };
    edge(0, 0, 0, 70, 0, 0, W, 70, 0.55); edge(0, H, 0, H - 36, 0, H - 36, W, 36, 0.35); edge(0, 0, 46, 0, 0, 0, 46, H, 0.4); edge(W, 0, W - 46, 0, W - 46, 0, 46, H, 0.4);
    ctx.restore();
    ctx.strokeStyle = "rgba(60,32,10,.8)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(0, 0, W, H, 16); ctx.stroke();
  }

  /** Low sandstone walls standing in for the simulation's cover blocks. */
  private paintCover(ctx: CanvasRenderingContext2D) {
    if (this.pit) return this.paintObsidian(ctx);
    const lift = 16;
    for (const b of this.walls) {
      const x = b.min.x, y = b.min.y, w = b.max.x - x, h = b.max.y - y;
      ctx.fillStyle = "rgba(48,24,6,.38)"; ctx.beginPath(); ctx.roundRect(x + 10, y + 6, w + 4, h + 4, 6); ctx.fill();
      // Front face
      ctx.fillStyle = this.pattern(ctx, 0.3); ctx.fillRect(x, y + h - lift, w, lift);
      ctx.fillStyle = "rgba(40,20,6,.42)"; ctx.fillRect(x, y + h - lift, w, lift);
      // Top surface
      ctx.fillStyle = this.pattern(ctx, 0.3); ctx.fillRect(x, y - lift, w, h);
      ctx.fillStyle = "rgba(255,226,170,.22)"; ctx.fillRect(x, y - lift, w, h);
      ctx.fillStyle = "rgba(255,238,200,.55)"; ctx.fillRect(x, y - lift, w, 2.5);
      ctx.strokeStyle = "rgba(60,32,10,.7)"; ctx.lineWidth = 2; ctx.strokeRect(x, y - lift, w, h + lift);
      // Chipped corners
      ctx.fillStyle = "#7a5632"; ctx.beginPath(); ctx.moveTo(x + w, y - lift); ctx.lineTo(x + w - 8, y - lift); ctx.lineTo(x + w, y - lift + 7); ctx.fill();
    }
  }

  private paintTowers(ctx: CanvasRenderingContext2D) {
    if (!ok(this.a.pillar)) return;
    const pillar = this.pit ? tint(this.a.pillar, "#160c0c", 0.62) : this.a.pillar;
    for (const x of TOWERS) { ctx.fillStyle = "rgba(30,14,4,.45)"; ctx.beginPath(); ctx.ellipse(x + 6, -36, 24, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.drawImage(pillar, x - 21, -150, 42, 119); }
  }

  private rasterCrowd() {
    const make = (img: HTMLImageElement) => {
      const c = document.createElement("canvas"); c.width = Math.ceil(104 * this.k * 1.2); c.height = Math.ceil(32 * this.k * 1.2);
      const x = c.getContext("2d");
      if (x && ok(img)) { x.drawImage(img, 0, 0, c.width, c.height); if (this.pit) { x.globalCompositeOperation = "source-atop"; x.fillStyle = "rgba(30,8,16,.5)"; x.fillRect(0, 0, c.width, c.height); } }
      return c;
    };
    return { idle: make(this.a.crowd), cheer: make(this.a.crowdCheer) };
  }

  drawBackdrop(ctx: CanvasRenderingContext2D) {
    if (this.backdrop) ctx.drawImage(this.backdrop, X0, Y0, X1 - X0, Y1 - Y0);
    else { ctx.fillStyle = "#c08f52"; ctx.fillRect(0, 0, W, H); }
  }

  /** Warm pools of light from the braziers, drawn on the sand. */
  drawGlow(ctx: CanvasRenderingContext2D, t: number) {
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (const [i, b] of BRAZIERS.entries()) {
      const f = 0.85 + Math.sin(t * 9 + i * 1.7) * 0.08 + Math.sin(t * 23 + i) * 0.05;
      const g = ctx.createRadialGradient(b.x, b.y, 4, b.x, b.y, 150 * f);
      g.addColorStop(0, this.pit ? "rgba(255,70,20,.38)" : "rgba(255,150,60,.30)"); g.addColorStop(0.4, this.pit ? "rgba(255,50,10,.12)" : "rgba(255,120,40,.10)"); g.addColorStop(1, "rgba(255,110,30,0)");
      ctx.fillStyle = g; ctx.fillRect(b.x - 160, b.y - 160, 320, 320);
    }
    ctx.restore();
  }

  /** Crowd with an idle sway; `cheer` (0..1) makes them jump and wave. */
  drawCrowd(ctx: CanvasRenderingContext2D, t: number, cheer: number, view: { x0: number; y0: number; x1: number; y1: number }) {
    const tiles = this.crowdTiles; if (!tiles) return;
    for (const s of this.seats) {
      if (s.x + s.w < view.x0 || s.x > view.x1 || s.y + s.h < view.y0 || s.y > view.y1) continue;
      const jump = cheer > 0.05 && Math.floor(t * 5 + s.phase) % 2 === 0;
      const img = jump ? tiles.cheer : tiles.idle;
      const bob = Math.sin(t * 1.8 + s.phase) * 0.8 - (jump ? Math.abs(Math.sin(t * 9 + s.phase)) * 4 * cheer : 0);
      if (s.side) {
        // Side rows: show two spectators from the tile, facing the field.
        const sw = img.width * 0.36;
        ctx.drawImage(img, s.flip ? img.width - sw : 0, 0, sw, img.height, s.x, s.y + bob, s.w, s.h);
      } else if (s.flip) { ctx.save(); ctx.translate(s.x + s.w, s.y + bob); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, s.w, s.h); ctx.restore(); }
      else ctx.drawImage(img, s.x, s.y + bob, s.w, s.h);
    }
  }

  /** Braziers with flickering flames on the podium. */
  drawBraziers(ctx: CanvasRenderingContext2D, t: number) {
    for (const [i, b] of BRAZIERS.entries()) {
      if (ok(this.a.brazier)) ctx.drawImage(this.a.brazier, b.x - 17, b.y - 22, 34, 40);
      const fx = b.x, fy = b.y - 18;
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      for (let j = 0; j < 4; j++) {
        const ph = t * (7 + j) + i * 2.1 + j, h = 22 - j * 4 + Math.sin(ph) * 3, w = 9 - j * 1.6 + Math.sin(ph * 1.3) * 1.2;
        ctx.fillStyle = (this.pit ? ["rgba(200,20,10,.6)", "rgba(255,60,20,.6)", "rgba(255,130,40,.7)", "rgba(255,220,150,.8)"] : ["rgba(255,90,20,.55)", "rgba(255,140,40,.6)", "rgba(255,200,80,.7)", "rgba(255,245,200,.8)"])[j] ?? "#fff";
        ctx.beginPath(); ctx.moveTo(fx - w, fy); ctx.quadraticCurveTo(fx - w * 0.8, fy - h * 0.6, fx + Math.sin(ph * 0.7) * 3, fy - h); ctx.quadraticCurveTo(fx + w * 0.8, fy - h * 0.6, fx + w, fy); ctx.closePath(); ctx.fill();
      }
      for (let e = 0; e < 3; e++) { const p = (t * 0.9 + e / 3 + i * 0.13) % 1; ctx.fillStyle = `rgba(255,180,80,${1 - p})`; ctx.fillRect(fx + Math.sin(p * 9 + e + i) * 6, fy - 10 - p * 40, 2, 2); }
      ctx.restore();
    }
  }

  /** North gate portcullis; `open` (0..1) raises it. */
  drawGate(ctx: CanvasRenderingContext2D, open: number) {
    if (!ok(this.a.portcullis)) return;
    ctx.save(); ctx.beginPath(); ctx.rect(449, -80, 102, 84); ctx.clip();
    ctx.drawImage(this.a.portcullis, 449, -80 - open * 76, 102, 88);
    ctx.restore();
  }

  /** Golden dust drifting over the sand. */
  drawDust(ctx: CanvasRenderingContext2D, t: number, dt: number) {
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (const d of this.dust) {
      d.x += d.vx * dt; d.y += d.vy * dt; if (d.x > W) d.x -= W; if (d.x < 0) d.x += W; if (d.y < 0) d.y += H; if (d.y > H) d.y -= H;
      ctx.fillStyle = this.pit ? `rgba(255,${110 + Math.round(Math.sin(t * 3 + d.p) * 40)},40,${0.35 + Math.sin(t * 2 + d.p) * 0.2})` : `rgba(255,214,150,${0.12 + Math.sin(t * 1.5 + d.p) * 0.08})`;
      ctx.fillRect(d.x, d.y, d.s, d.s);
    }
    ctx.restore();
  }

  /** Obsidian floor of the pit, veined with glowing lava cracks and a rune circle. */
  private paintPitFloor(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.beginPath(); ctx.roundRect(0, 0, W, H, 16); ctx.clip();
    const g = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, 620);
    g.addColorStop(0, "#3d2d2a"); g.addColorStop(0.6, "#2a1f1e"); g.addColorStop(1, "#171011");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const r = rng(19);
    for (let i = 0; i < 7000; i++) { ctx.fillStyle = r() < 0.5 ? `rgba(255,220,200,${0.03 + r() * 0.05})` : `rgba(0,0,0,${0.08 + r() * 0.12})`; const s = 0.8 + r() * 2; ctx.fillRect(r() * W, r() * H, s, s); }
    // Basalt slabs
    ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 2;
    for (let i = 0; i < 26; i++) { const x = r() * W, y = r() * H, s = 40 + r() * 60; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 1; k <= 5; k++) { const a = k / 5 * Math.PI * 2 + r() * 0.5; ctx.lineTo(x + Math.cos(a) * s * (0.7 + r() * 0.4), y + Math.sin(a) * s * 0.7 * (0.7 + r() * 0.4)); } ctx.closePath(); ctx.stroke(); }
    // Lava cracks: random walks drawn as glow, core and hot centre.
    const cracks: { x: number; y: number }[][] = [];
    for (let i = 0; i < 12; i++) {
      let x = r() * W, y = r() * H, a = r() * Math.PI * 2; const pts = [{ x, y }];
      for (let k = 0; k < 8 + r() * 10; k++) { a += (r() - 0.5) * 1.1; x += Math.cos(a) * (10 + r() * 10); y += Math.sin(a) * (10 + r() * 10); pts.push({ x, y }); }
      cracks.push(pts);
    }
    const stroke = (w: number, c: string) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineJoin = "round"; ctx.lineCap = "round"; for (const pts of cracks) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); } };
    ctx.globalCompositeOperation = "lighter";
    stroke(12, "rgba(255,60,10,.08)"); stroke(5, "rgba(255,90,20,.28)"); stroke(2, "rgba(255,160,60,.7)"); stroke(0.7, "rgba(255,230,190,.7)");
    // Rune circle in the centre
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "rgba(0,0,0,.45)"; ctx.lineWidth = 18; ctx.beginPath(); ctx.arc(W / 2, H / 2, 230, 0, Math.PI * 2); ctx.stroke();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "rgba(255,90,20,.45)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(W / 2, H / 2, 222, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(W / 2, H / 2, 238, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "rgba(255,140,50,.7)";
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; ctx.save(); ctx.translate(W / 2 + Math.cos(a) * 230, H / 2 + Math.sin(a) * 230); ctx.rotate(a); ctx.fillRect(-1.5, -6, 3, 12); if (i % 3 === 0) ctx.fillRect(-6, -1.5, 12, 3); ctx.restore(); }
    ctx.globalCompositeOperation = "source-over";
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "700 40px Cinzel, Georgia, serif";
    for (const [t, y] of [["FOSSE", H / 2 - 92], ["ARDENTE", H / 2 + 92]] as const) { ctx.fillStyle = "rgba(255,110,40,.18)"; ctx.fillText(t, W / 2, y + 2); ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillText(t, W / 2, y); }
    const edge = (x0: number, y0: number, x1: number, y1: number, rx: number, ry: number, rw: number, rh: number, a: number) => { const e = ctx.createLinearGradient(x0, y0, x1, y1); e.addColorStop(0, `rgba(0,0,0,${a})`); e.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = e; ctx.fillRect(rx, ry, rw, rh); };
    edge(0, 0, 0, 80, 0, 0, W, 80, 0.6); edge(0, H, 0, H - 40, 0, H - 40, W, 40, 0.45); edge(0, 0, 50, 0, 0, 0, 50, H, 0.5); edge(W, 0, W - 50, 0, W - 50, 0, 50, H, 0.5);
    ctx.restore();
    ctx.strokeStyle = "rgba(255,90,20,.5)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(0, 0, W, H, 16); ctx.stroke();
  }

  /** Obsidian pillars with glowing runes (cover in the pit). */
  private paintObsidian(ctx: CanvasRenderingContext2D) {
    const lift = 22;
    for (const b of this.walls) {
      const x = b.min.x, y = b.min.y, w = b.max.x - x, h = b.max.y - y;
      ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.beginPath(); ctx.roundRect(x + 10, y + 6, w + 4, h + 4, 8); ctx.fill();
      ctx.fillStyle = "#140d0e"; ctx.fillRect(x, y + h - lift, w, lift);
      const top = ctx.createLinearGradient(x, y - lift, x + w, y - lift + h); top.addColorStop(0, "#4a3a3c"); top.addColorStop(1, "#1d1416");
      ctx.fillStyle = top; ctx.fillRect(x, y - lift, w, h);
      ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.fillRect(x, y - lift, w, 2);
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = "rgba(255,110,40,.85)"; ctx.lineWidth = 2;
      const cx = x + w / 2, cy = y - lift + h / 2, s = Math.min(w, h) * 0.28;
      ctx.beginPath(); ctx.moveTo(cx, cy - s); ctx.lineTo(cx + s, cy); ctx.lineTo(cx, cy + s); ctx.lineTo(cx - s, cy); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - s * 1.5); ctx.lineTo(cx, cy + s * 1.5); ctx.stroke();
      ctx.fillStyle = "rgba(255,90,20,.25)"; ctx.fillRect(x, y + h - 3, w, 3);
      ctx.restore();
      ctx.strokeStyle = "rgba(0,0,0,.8)"; ctx.lineWidth = 2; ctx.strokeRect(x, y - lift, w, h + lift);
    }
  }

  /** Stone frame of the passage between the rooms (east in the arena, west in the pit). */
  private paintPortalFrame(ctx: CanvasRenderingContext2D) {
    const east = !this.pit, x = east ? W : -PODIUM, y0 = GATE_Y - GATE_HALF - 6, h = (GATE_HALF + 6) * 2;
    ctx.fillStyle = this.pit ? "#2a1e1c" : "#d6b17a"; ctx.fillRect(x - 4, y0 - 16, PODIUM + 8, h + 32);
    ctx.fillStyle = "#0b0603"; ctx.fillRect(x + 4, y0, PODIUM - 8, h);
    if (ok(this.a.pillar)) { const pillar = this.pit ? tint(this.a.pillar, "#160c0c", 0.62) : this.a.pillar; const px = x + PODIUM / 2; ctx.drawImage(pillar, px - 15, y0 - 92, 30, 86); ctx.drawImage(pillar, px - 15, y0 + h - 70, 30, 86); }
  }

  /** Live layer of the passage: glow and chevrons when open, portcullis and timer when shut. */
  drawPortal(ctx: CanvasRenderingContext2D, t: number, open: boolean, lock: number, bossLock: boolean, incoming = 0, soon = false) {
    const east = !this.pit, x = east ? W : -PODIUM, y0 = GATE_Y - GATE_HALF - 6, h = (GATE_HALF + 6) * 2;
    const hue = east ? "255,90,30" : "255,200,110";
    ctx.save();
    if (open) {
      ctx.globalCompositeOperation = "lighter";
      const pulse = 0.75 + Math.sin(t * 3) * 0.25, gx = east ? W : 0;
      const g = ctx.createRadialGradient(gx, GATE_Y, 6, gx, GATE_Y, 170);
      g.addColorStop(0, `rgba(${hue},${0.55 * pulse})`); g.addColorStop(1, `rgba(${hue},0)`);
      ctx.fillStyle = g; ctx.fillRect(gx - 180, GATE_Y - 180, 360, 360);
      ctx.fillStyle = `rgba(${hue},${0.7 * pulse})`; ctx.fillRect(x + 4, y0, PODIUM - 8, h);
      // Chevrons on the floor pointing to the passage.
      for (let i = 0; i < 3; i++) {
        const k = ((t * 1.2 + i / 3) % 1), cx = east ? W - 150 + k * 110 : 150 - k * 110, a = Math.sin(k * Math.PI);
        ctx.strokeStyle = `rgba(${hue},${0.8 * a})`; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.beginPath(); const d = east ? 1 : -1; ctx.moveTo(cx - 12 * d, GATE_Y - 18); ctx.lineTo(cx + 6 * d, GATE_Y); ctx.lineTo(cx - 12 * d, GATE_Y + 18); ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
    } else {
      ctx.strokeStyle = "#2b2b2e"; ctx.lineWidth = 5;
      for (let s = y0 + 6; s < y0 + h; s += 12) { ctx.beginPath(); ctx.moveTo(x + 2, s); ctx.lineTo(x + PODIUM - 2, s); ctx.stroke(); }
      ctx.strokeStyle = "#77777d"; ctx.lineWidth = 1.5;
      for (let s = y0 + 6; s < y0 + h; s += 12) { ctx.beginPath(); ctx.moveTo(x + 2, s - 1.5); ctx.lineTo(x + PODIUM - 2, s - 1.5); ctx.stroke(); }
    }
    // Label on the sand next to the passage.
    const lx = east ? W - 100 : 100, ly = GATE_Y + 66;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "700 17px Cinzel, Georgia, serif";
    const label = east ? "FOSSE ARDENTE ›" : "‹ ARÈNE";
    ctx.lineWidth = 4; ctx.strokeStyle = "rgba(0,0,0,.65)"; ctx.strokeText(label, lx, ly);
    ctx.fillStyle = open ? `rgb(${hue})` : "rgba(220,200,170,.75)"; ctx.fillText(label, lx, ly);
    let line = ly + 18;
    if (incoming > 0) {
      // Pursuers on their way: red pulse at the gate and a counter under the label.
      if (soon) { ctx.save(); ctx.globalCompositeOperation = "lighter"; const gx = east ? W : 0, pr = ctx.createRadialGradient(gx, GATE_Y, 4, gx, GATE_Y, 110); pr.addColorStop(0, `rgba(255,40,40,${0.5 + Math.sin(t * 14) * 0.2})`); pr.addColorStop(1, "rgba(255,40,40,0)"); ctx.fillStyle = pr; ctx.fillRect(gx - 120, GATE_Y - 120, 240, 240); ctx.restore(); }
      ctx.font = "700 14px Cinzel, Georgia, serif"; const txt = `⚔ ${incoming} EN APPROCHE`;
      ctx.lineWidth = 4; ctx.strokeStyle = "rgba(0,0,0,.7)"; ctx.strokeText(txt, lx, line); ctx.fillStyle = "#ff7a6a"; ctx.fillText(txt, lx, line); line += 18;
    }
    if (!open) {
      ctx.font = "700 13px Cinzel, Georgia, serif";
      const sub = bossLock ? "BLOQUÉE PAR LE BOSS" : `OUVERTURE ${Math.ceil(lock)} S`;
      ctx.strokeText(sub, lx, line); ctx.fillStyle = "rgba(240,220,190,.8)"; ctx.fillText(sub, lx, line);
    }
    ctx.restore();
  }
}
