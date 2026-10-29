import space from '../assets/space.jpg';
export function createSpaceBackground() {
  const image = new Image(); image.src = space;
  return (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    if (!image.complete || !image.naturalWidth) return false;
    const tileHeight = width * image.naturalHeight / image.naturalWidth;
    const cycle = tileHeight * 2, offset = (time * 18) % cycle;
    for (let y = offset - cycle, i = 0; y < height + 20; y += tileHeight, i++) {
      if (i % 2 === 0) ctx.drawImage(image, -2, y, width + 4, tileHeight + 1);
      else { ctx.save(); ctx.translate(0, y + tileHeight); ctx.scale(1, -1); ctx.drawImage(image, -2, -1, width + 4, tileHeight + 2); ctx.restore(); }
    }
    return true;
  };
}
