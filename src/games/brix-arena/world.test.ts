import Matter from "matter-js";
import { expect, it } from "vitest";
import { ArenaWorld, difficultyAt, hpMinutesSmall, hpMinutesTank, spawnInterval } from "./world";
const advance = (g:ArenaWorld, frames:number) => { for(let i=0;i<frames;i++) { g.invincible=100; g.step(1/60,{x:0,y:0}); } };
it("dash cannot be spammed and recharges",()=>{ const g=new ArenaWorld(); g.start(); expect(g.dash()).toBe(true); expect(g.dash()).toBe(false); g.dashCooldown=0; expect(g.dash()).toBe(true); g.dispose(); });
it("upgrades apply only during the choice screen",()=>{ const g=new ArenaWorld(); g.upgrade("power"); expect(g.damage).toBe(1); g.phase="upgrade"; g.upgrade("power"); expect(g.damage).toBe(2); expect(g.phase).toBe("playing"); g.dispose(); });
it("cover blocks the moving hero",()=>{ const g=new ArenaWorld(); g.start(); for(let i=0;i<1000;i++) { g.hp=999; g.phase="playing"; g.step(1/60,{x:1,y:0}); } expect(g.hero.position.x).toBeLessThan(990); g.dispose(); });
it("pause freezes simulation",()=>{ const g=new ArenaWorld(); g.start(); g.phase="paused"; const x=g.hero.position.x; g.step(1/60,{x:1,y:0}); expect(g.hero.position.x).toBe(x); g.dispose(); });
it("awards exactly one point every 3 active seconds",()=>{ const g=new ArenaWorld();g.start();advance(g,179);expect(g.score).toBe(0);advance(g,1);expect(g.score).toBe(1);advance(g,180);expect(g.score).toBe(2);g.dispose(); });
it("offers upgrades at 10 and 20 points without repeating a threshold",()=>{const g=new ArenaWorld();g.start();advance(g,1799);expect(g.score).toBe(9);expect(g.phase).toBe("playing");advance(g,1);expect(g.score).toBe(10);expect(g.phase).toBe("upgrade");const elapsed=g.elapsed;advance(g,180);expect(g.elapsed).toBe(elapsed);g.upgrade("power");advance(g,1);expect(g.phase).toBe("playing");advance(g,1800);expect(g.score).toBe(20);expect(g.phase).toBe("upgrade");g.dispose();});
it("kills and pickups never grant score",()=>{const g=new ArenaWorld();g.start();const enemy=g.enemies[0];if(!enemy)throw Error("Missing starting enemy");enemy.hp=0;g.pickups.push({x:500,y:310,kind:"energy"});advance(g,1);expect(g.kills).toBe(1);expect(g.score).toBe(0);g.dispose();});
it("ramps firmly for 45 s, then keeps climbing more gently",()=>{
  expect(spawnInterval(0)).toBe(0.9);
  expect(spawnInterval(30)).toBeCloseTo(0.666);
  expect(spawnInterval(40)).toBeCloseTo(0.601);
  expect(spawnInterval(45)).toBeCloseTo(0.569);
  // Same firm pace across the whole 45 s window.
  expect(difficultyAt(30)-difficultyAt(0)).toBeCloseTo(difficultyAt(45)-difficultyAt(15));
  // After 45 s the climb is clearly softer but never stops.
  expect(difficultyAt(120)).toBeGreaterThan(difficultyAt(60));
  expect((difficultyAt(120)-difficultyAt(60))/60).toBeLessThan((difficultyAt(45)-difficultyAt(15))/30 * 0.5);
  expect(spawnInterval(60)).toBeCloseTo(0.502);
  expect(spawnInterval(120)).toBeCloseTo(0.315);
  expect(spawnInterval(75)).toBeGreaterThan(0.16);
  expect(spawnInterval(180)).toBe(0.16);
  expect(spawnInterval(600)).toBe(0.16);
});
it("late-game shooters fire at the minimum cadence",()=>{
  const g=new ArenaWorld();g.start();g.fire=999;g.elapsed=600;
  const e=g.enemies[0];if(!e)throw Error("Missing starting enemy");
  // Line the shooter up in open ground so cover cannot veto the shot.
  Matter.Body.setPosition(e.body,{x:500,y:430});
  e.kind=2;e.shot=0.001;advance(g,1);
  expect(e.shot).toBeCloseTo(0.7);g.dispose();
});
it("enemy health steps up a little every minute",()=>{
  const g=new ArenaWorld();g.start();
  expect(g.enemies.filter(e=>e.kind===1).every(e=>e.hp===4)).toBe(true);
  const before=g.enemies.length;
  g.elapsed=120; for(let i=0;i<6;i++) g.spawnEnemy();
  const d=difficultyAt(120), fresh=g.enemies.slice(before);
  expect(fresh.filter(e=>e.kind===1).every(e=>e.hp===4+Math.floor(d/2)+2)).toBe(true);
  expect(fresh.filter(e=>e.kind!==1).every(e=>e.hp===1+Math.floor(d/3)+1)).toBe(true);
  g.dispose();
});
it("per-minute health gains level off instead of climbing forever",()=>{
  // Tanks: +1/min for the first 3 minutes, then one extra point every 2 minutes.
  expect([0,1,2,3].map(hpMinutesTank)).toEqual([0,1,2,3]);
  expect([4,6,10].map(hpMinutesTank)).toEqual([3,4,6]);
  // Small enemies: +1 every 2 minutes for 4 minutes, then one every 3 minutes.
  expect([0,2,4].map(hpMinutesSmall)).toEqual([0,1,2]);
  expect([6,10].map(hpMinutesSmall)).toEqual([2,4]);
  // Long-run totals stay far below the old linear growth.
  expect(hpMinutesTank(20)).toBe(11);
  expect(hpMinutesSmall(20)).toBe(7);
});
it("drops a health pickup only every 20 kills and only one at a time",()=>{
  const g=new ArenaWorld();g.start();g.fire=999;
  const kill=(n:number)=>{g.kills=n;const e=g.enemies.find(x=>x.hp>0);if(!e)throw Error("Missing starting enemy");e.hp=0;advance(g,1);};
  kill(6);
  expect(g.kills).toBe(7); expect(g.pickups.some(p=>p.kind==="health")).toBe(false);
  kill(19);
  expect(g.kills).toBe(20); expect(g.pickups.filter(p=>p.kind==="health")).toHaveLength(1);
  kill(39);
  expect(g.kills).toBe(40); expect(g.pickups.filter(p=>p.kind==="health")).toHaveLength(1);
  g.dispose();
});
it("paused and finished time never grants score",()=>{const g=new ArenaWorld();g.start();advance(g,179);g.phase="paused";advance(g,180);expect(g.score).toBe(0);g.phase="playing";advance(g,1);expect(g.score).toBe(1);g.phase="over";advance(g,180);expect(g.score).toBe(1);g.dispose();});
it("starts gently and grows progressively without overwhelming late",()=>{const g=new ArenaWorld();g.start();expect(g.enemies).toHaveLength(5);expect(spawnInterval(0)).toBe(0.9);expect(spawnInterval(30)).toBeCloseTo(0.666);expect(difficultyAt(600)/600).toBeLessThan(difficultyAt(45)/45);expect(difficultyAt(45)/45).toBeLessThan(difficultyAt(30)/30);expect(spawnInterval(75)).toBeGreaterThan(0.16);expect(spawnInterval(60)).toBeLessThan(spawnInterval(30));expect(spawnInterval(30)).toBeLessThan(spawnInterval(0));g.dispose();});