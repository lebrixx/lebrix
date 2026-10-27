import car0 from "@/assets/brix-rush/vehicles/car-0.png";
import car1 from "@/assets/brix-rush/vehicles/car-1.png";
import car2 from "@/assets/brix-rush/vehicles/car-2.png";
import car3 from "@/assets/brix-rush/vehicles/car-3.png";
import car4 from "@/assets/brix-rush/vehicles/car-4.png";
import car5 from "@/assets/brix-rush/vehicles/car-5.png";
import truck0 from "@/assets/brix-rush/vehicles/truck-0.png";
import truck1 from "@/assets/brix-rush/vehicles/truck-1.png";
import truck2 from "@/assets/brix-rush/vehicles/truck-2.png";
import { vehicleVariant } from "./vehicle-variants";
import { brixImage, imageReady } from "./images";

type Sprite = { img: HTMLImageElement; side?: HTMLCanvasElement; shadow?: HTMLCanvasElement };

/** Pre-tinted copy of a sprite (computed once) so per-frame drawing stays cheap. */
function tint(img: HTMLImageElement, filter: string) {
  const cv = document.createElement("canvas");
  cv.width = img.naturalWidth; cv.height = img.naturalHeight;
  const g = cv.getContext("2d");
  if (!g) return cv;
  g.filter = filter;
  g.drawImage(img, 0, 0);
  return cv;
}

let sprites: ReturnType<typeof loadSprites> | undefined;

function loadSprites() {
  const load = (url: string): Sprite => {
    const s: Sprite = { img: brixImage(url) };
    imageReady(url).then(() => {
      if (!s.img.naturalWidth) return;
      s.side = tint(s.img, "brightness(0.45) saturate(1.2)");
      s.shadow = tint(s.img, "brightness(0) blur(3px)");
    });
    return s;
  };
  return {
    car: [car0, car1, car2, car3, car4, car5].map((url) => load(url)),
    truck: [truck0, truck1, truck2].map((url) => load(url)),
  };
}

export function prepareVehicleSprites() {
  sprites ??= loadSprites();
  return Promise.all([car0, car1, car2, car3, car4, car5, truck0, truck1, truck2].map(imageReady));
}

/** Reuse prepared sprites; sample theme colors once, not once per car per frame. */
export function createVehiclePainter() {
  const images = sprites ??= loadSprites();
  const highlight = getComputedStyle(document.documentElement).getPropertyValue("--brix-highlight").trim();
  return (ctx: CanvasRenderingContext2D, seed: string, col: number, index: number, carLen: number,
    direction: 1 | -1, x: number, y: number, width: number, height: number) => {
    const { kind, variant } = vehicleVariant(seed, col, index, carLen);
    const s = images[kind][variant];
    if (!s?.img.complete || !s.img.naturalWidth) return;
    const depth = kind === "truck" ? 9 : 6;
    const draw = (src: CanvasImageSource, dx: number, dy: number) => {
      ctx.save();
      ctx.translate(x + width / 2 + dx, y + height / 2 + dy);
      // Sprites face up, while positive lane direction drives down.
      if (direction === 1) ctx.rotate(Math.PI);
      ctx.drawImage(src, -width / 2, -height / 2, width, height);
      ctx.restore();
    };
    // Soft ground shadow, then an extruded body wall; footprint/collision unchanged.
    if (s.shadow) { ctx.globalAlpha = 0.35; draw(s.shadow, depth * 0.8, depth * 1.1); ctx.globalAlpha = 1; }
    if (s.side) for (let i = depth; i > 0; i -= 1.5) draw(s.side, i * 0.35, i);
    draw(s.img, 0, 0);
    // Glossy roof highlight
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = highlight;
    ctx.beginPath(); ctx.roundRect(x + width * 0.2, y + height * 0.15, width * 0.25, height * 0.7, 4); ctx.fill();
    ctx.restore();
  };
}
