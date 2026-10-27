import roadUrl from "@/assets/brix-rush/terrain/road.png";
import grassUrl from "@/assets/brix-rush/terrain/grass.jpg";
import { CELL, VIEW_H } from "./world";

/** Model-derived roads and generated turf, loaded once per mounted game. */
export function createTerrainPainter() {
  const road = new Image();
  road.src = roadUrl;
  const grass = new Image();
  grass.src = grassUrl;
  let turf: CanvasPattern | null = null;
  grass.onload = () => {
    const tile = document.createElement("canvas");
    tile.width = tile.height = 160;
    const g = tile.getContext("2d");
    if (!g) return;
    g.drawImage(grass, 0, 0, 160, 160);
    turf = g.createPattern(tile, "repeat");
  };

  return (ctx: CanvasRenderingContext2D, x: number, col: number, safe: boolean,
    leftSafe: boolean, rightSafe: boolean) => {
    if (safe) {
      if (!turf) return;
      ctx.save();
      // Anchor the texture to world coordinates, not the scrolling camera.
      ctx.translate(x - col * CELL, 0);
      ctx.fillStyle = turf;
      ctx.fillRect(col * CELL, -VIEW_H, CELL + 0.5, VIEW_H * 3);
      ctx.restore();
      return;
    }
    if (!road.complete || !road.naturalWidth) return;
    // Keep curbs only beside grass: adjacent traffic lanes form one clean road.
    const curb = 14;
    const cropX = leftSafe ? 0 : curb;
    const cropWidth = road.naturalWidth - cropX - (rightSafe ? 0 : curb);
    // Repeat beyond both ends so the inclined camera never exposes empty bands.
    for (let y = -VIEW_H; y < VIEW_H * 2; y += VIEW_H) {
      ctx.drawImage(road, cropX, 0, cropWidth, road.naturalHeight, x, y, CELL + 0.5, VIEW_H);
    }
  };
}