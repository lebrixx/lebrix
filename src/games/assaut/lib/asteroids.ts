export type Asteroid = { x: number; y: number; r: number; speed: number; angle: number; spin: number };
export const MAX_ASTEROIDS = 2;
// Swept collision prevents fast projectiles from jumping through a rock between frames.
export function asteroidBlockingShot(rocks: Asteroid[], from: { x: number; y: number }, to: { x: number; y: number; r: number }) {
  const dx = to.x - from.x, dy = to.y - from.y;
  const lengthSquared = dx * dx + dy * dy;
  return rocks.find(rock => {
    const t = lengthSquared > 0 ? Math.max(0, Math.min(1, ((rock.x - from.x) * dx + (rock.y - from.y) * dy) / lengthSquared)) : 0;
    return Math.hypot(from.x + t * dx - rock.x, from.y + t * dy - rock.y) <= rock.r + to.r;
  });
}
/** More rocks fall as the run goes on: limit 2 → 4, delay 5s → 2s. */
export function asteroidLimit(t: number) { return Math.min(4, MAX_ASTEROIDS + Math.floor(t / 70)); }
export function asteroidDelay(t: number) { return Math.max(2, 5 - t / 40); }
export function createAsteroidField(width: number, height: number, random = Math.random) {
  let rocks: Asteroid[] = [];
  let countdown = 4;
  let pairPending = false;
  let elapsed = 0;
  return {
    get rocks() { return rocks; },
    clear() { rocks = []; pairPending = false; },
    get limit() { return asteroidLimit(elapsed); },
    update(dt: number, pilot: { x: number; y: number; r: number }) {
      countdown -= dt; elapsed += dt;
      if (countdown <= 0) {
        const paired = pairPending;
        pairPending = false;
        countdown = asteroidDelay(elapsed) + random() * 2;
        if (rocks.length < asteroidLimit(elapsed)) {
          const r = 23 + random() * 9;
          const minX = r + 12, maxX = width - minX;
          let x = minX + random() * (maxX - minX);
          // Keep newly falling rocks apart from every rock still near the top.
          for (let tries = 0; tries < 8 && rocks.some(o => o.y < height * 0.5 && Math.abs(x - o.x) < 120); tries++) x = minX + random() * (maxX - minX);
          const near = rocks.find(o => o.y < height * 0.5 && Math.abs(x - o.x) < 160);
          if (near) x = near.x < width / 2 ? maxX : minX;
          const empty = rocks.length === 0;
          rocks.push({ x, y: -r - 4, r, speed: 105 + random() * 25, angle: random() * Math.PI * 2, spin: (random() - 0.5) * 0.8 });
          if (empty && !paired && random() < 0.25) { pairPending = true; countdown = 0.9; }
        }
      }
      let collided = false;
      rocks = rocks.filter(rock => {
        rock.y += rock.speed * dt;
        rock.angle += rock.spin * dt;
        if (Math.hypot(rock.x - pilot.x, rock.y - pilot.y) < rock.r + pilot.r) { collided = true; return false; }
        return rock.y - rock.r <= height;
      });
      return collided;
    },
  };
}