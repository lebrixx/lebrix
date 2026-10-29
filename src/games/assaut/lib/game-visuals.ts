import type { MoonPass } from './moon';
import { createSpaceBackground } from './space-background';
import moonSkin from '../assets/moon.jpg';
import earthSkin from '../assets/earth-realistic.jpg';
import droneAsset from '../assets/enemy-drone.webp';
const drone = droneAsset;
import zigAsset from '../assets/enemy-zig.webp';
const zig = zigAsset;
import tankAsset from '../assets/enemy-tank.webp';
const tank = tankAsset;
import bossAsset from '../assets/boss-ufo.webp';
const boss = bossAsset;
import { createGameDepth } from './game-depth';
import type { Asteroid } from './asteroids';

type Palette = { bg: string; fg: string; p: string; s: string; a: string; d: string; b: string; m: string; ink: string; smoke: string };
type Aircraft = { x: number; y: number; vx: number; vy: number; r: number; kind: 'drone' | 'zig' | 'tank' | 'shooter' | 'boss'; hp: number; max: number };

// Only presentation lives here; collision radii and simulation remain in the game.
export function createGameVisuals(ctx: CanvasRenderingContext2D, colors: Palette, width: number, height: number) {
  const depth = createGameDepth(width, height, colors);
  const load = (url: string) => { const image = new Image(); image.src = url; return image; };
  const drawBackground = createSpaceBackground();
  const moonBody = load(moonSkin);
  const earthBody = load(earthSkin);
  const planes = { drone: load(drone), zig: load(zig), tank: load(tank), shooter: load(zig), boss: load(boss) };
  const ready = (image: HTMLImageElement) => image.complete && image.naturalWidth > 0;

  const exhaust = (x: number, y: number, length: number, width: number, down = true) => {
    ctx.save(); ctx.translate(x, y); if (!down) ctx.rotate(Math.PI);
    const flame = ctx.createLinearGradient(0, 0, 0, length);
    flame.addColorStop(0, colors.fg); flame.addColorStop(0.25, colors.a); flame.addColorStop(1, 'transparent');
    ctx.fillStyle = flame;
    ctx.beginPath(); ctx.moveTo(-width, 0); ctx.quadraticCurveTo(-width * 0.6, length * 0.6, 0, length);
    ctx.quadraticCurveTo(width * 0.6, length * 0.6, width, 0); ctx.closePath(); ctx.fill(); ctx.restore();
  };

  return {
    exhaust,
    depth(enemies: Aircraft[], pilot: { x: number; y: number; bank: number; visible: boolean }, time: number, asteroids: Asteroid[], moon: MoonPass | null = null, earth: MoonPass | null = null) {
      return depth?.draw(ctx, enemies, pilot, time, asteroids, moon, earth) ?? false;
    },
    asteroid(rock: Asteroid) {
      ctx.save(); ctx.translate(rock.x, rock.y); ctx.rotate(rock.angle);
      const shade = ctx.createLinearGradient(-rock.r, -rock.r, rock.r, rock.r);
      shade.addColorStop(0, colors.fg); shade.addColorStop(0.4, colors.smoke); shade.addColorStop(1, colors.ink);
      ctx.fillStyle = shade; ctx.beginPath();
      for (let i = 0; i < 9; i++) {
        const angle = i * Math.PI * 2 / 9, r = rock.r * (0.86 + Math.sin(i * 7) * 0.1);
        if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
        else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      ctx.closePath(); ctx.fill(); ctx.fillStyle = colors.ink; ctx.globalAlpha = 0.4;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(Math.sin(i * 3) * rock.r * 0.5, Math.cos(i * 5) * rock.r * 0.5, rock.r * 0.15, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    },
    // Same body the 3D layer draws, for screens without WebGL: a textured disc with a lit side.
    moon(m: MoonPass) {
      if (!ready(moonBody)) return;
      const side = Math.min(moonBody.naturalWidth, moonBody.naturalHeight);
      const diameter = m.r * 2.2;
      ctx.save();
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.clip();
      ctx.translate(m.x, m.y); ctx.rotate(m.spin * 0.18);
      ctx.drawImage(moonBody, (moonBody.naturalWidth - side) / 2, (moonBody.naturalHeight - side) / 2, side, side, -diameter / 2, -diameter / 2, diameter, diameter);
      ctx.rotate(-m.spin * 0.18);
      const light = ctx.createRadialGradient(-m.r * 0.45, -m.r * 0.5, m.r * 0.1, 0, 0, m.r * 1.2);
      light.addColorStop(0, 'rgba(255,255,255,0.18)'); light.addColorStop(0.5, 'rgba(0,0,0,0)'); light.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = light; ctx.fillRect(-m.r, -m.r, m.r * 2, m.r * 2);
      ctx.restore();
    },
    earth(m: MoonPass) {
      if (!ready(earthBody)) return;
      ctx.save();
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.clip();
      const shift = ((m.spin / (Math.PI * 2)) % 1) * m.r * 4;
      for (let i = -1; i <= 1; i++) ctx.drawImage(earthBody, m.x - m.r * 2 + shift + i * m.r * 4, m.y - m.r, m.r * 4, m.r * 2);
      const light = ctx.createRadialGradient(m.x - m.r * 0.45, m.y - m.r * 0.5, m.r * 0.1, m.x, m.y, m.r * 1.2);
      light.addColorStop(0, 'transparent'); light.addColorStop(1, colors.ink);
      ctx.fillStyle = light; ctx.fillRect(m.x - m.r, m.y - m.r, m.r * 2, m.r * 2);
      ctx.restore();
    },
    dispose() { depth?.dispose(); },
    background(width: number, height: number, time: number) {
      ctx.fillStyle = colors.bg; ctx.fillRect(-20, -20, width + 40, height + 40);
      drawBackground(ctx, width, height, time);
    },
    aircraft(e: Aircraft, time: number) {
      const image = planes[e.kind]; if (!ready(image)) return;
      const height = e.r * (e.kind === 'boss' ? 2.7 : 3.1) * 1.2;
      const width = height * image.naturalWidth / image.naturalHeight;
      const tilt = e.kind === 'boss' ? e.vx / 650 : -Math.atan2(e.vx, Math.max(40, e.vy)) * 0.35;
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(tilt);
      ctx.save(); ctx.globalAlpha = 0.25; ctx.filter = 'brightness(0) blur(3px)';
      ctx.drawImage(image, -width / 2 + 9, -height / 2 + 15, width, height); ctx.restore();
      ctx.drawImage(image, -width / 2, -height / 2, width, height);
      if (e.hp < e.max * 0.4) {
        ctx.globalAlpha = 0.35; ctx.fillStyle = colors.smoke;
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(Math.sin(time * 4 + i) * 4, -height / 3 - i * 7, 3 + i * 2, 0, Math.PI * 2); ctx.fill(); }
      }
      ctx.restore();
    },
    projectile(b: { x: number; y: number; vx: number; vy: number; r: number }, hostile: boolean) {
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(Math.atan2(b.vy, b.vx) - Math.PI / 2);
      const trail = ctx.createLinearGradient(0, -17, 0, 6);
      trail.addColorStop(0, 'transparent'); trail.addColorStop(0.7, hostile ? colors.d : colors.a); trail.addColorStop(1, colors.fg);
      ctx.fillStyle = trail; ctx.beginPath(); ctx.roundRect(-2, -17, 4, 23, 2); ctx.fill();
      ctx.fillStyle = colors.fg; ctx.beginPath(); ctx.ellipse(0, 2, hostile ? b.r * 0.5 : 1.5, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    },
    particle(p: { x: number; y: number; vx: number; vy: number; l: number; c: string }) {
      ctx.save(); ctx.globalAlpha = Math.min(1, p.l * 2);
      ctx.strokeStyle = p.c; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.025, p.y - p.vy * 0.025); ctx.stroke();
      ctx.fillStyle = colors.a; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.7, p.l * 3), 0, Math.PI * 2); ctx.fill(); ctx.restore();
    },
  };
}