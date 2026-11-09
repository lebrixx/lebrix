import Matter from "matter-js";
import { expect, it } from "vitest";
import { ArenaWorld, GATE_LOCK, GATE_Y, GEYSER_DAMAGE, GEYSER_WARN, PIT_XP, cardWeight, BOMB_KILLS, BOSS_EVERY, EVENT_START, EXTRA_MELEE_EVERY, EXTRA_GREEN_EVERY, SECOND_BOSS_AT, nextBossAfter, KIND, MAX_BOMBS, START_BOMBS, UPGRADES, difficultyAt, enemyKindAt, bossHpAt, smallHpAt, spawnInterval, tankHpAt, xpFor } from "./world";

/** Steps with the hero invulnerable and level-ups disabled, so timings stay exact. */
const advance = (g: ArenaWorld, frames: number) => { for (let i = 0; i < frames; i++) { g.invincible = 100; g.xpNext = Infinity; g.step(1 / 60, { x: 0, y: 0 }); } };
const place = (e: { body: Matter.Body }, x: number, y: number) => Matter.Body.setPosition(e.body, { x, y });
const clearEnemies = (g: ArenaWorld) => { for (const e of g.enemies) Matter.Composite.remove(g.engine.world, e.body); g.enemies = []; };

// ------------------------------------------------------------------ preserved rules
it("reduces large-monster spawns by a quarter from score 20 without reducing shooters", () => {
  const chance = (seconds: number) => Array.from({ length: 10000 }, (_, i) => enemyKindAt(seconds, (i + 0.5) / 10000)).filter(k => k === KIND.tank).length / 10000;
  const oldChance = Math.min(0.72, 0.32 + difficultyAt(60) * 0.05) - Math.min(0.45, 0.12 + difficultyAt(60) * 0.045);
  expect(chance(60)).toBeCloseTo(oldChance * 0.75, 3);
  expect(enemyKindAt(59.99, 0.4)).toBe(KIND.tank);
  expect(enemyKindAt(60, 0.4)).toBe(KIND.melee);
  expect(enemyKindAt(60, 0.2)).toBe(KIND.drone);
  const g = new ArenaWorld(); g.start(); g.elapsed = 59.99; g.invincible = 100; g.step(0.01, { x: 0, y: 0 }); expect(g.score).toBe(20); g.dispose();
});
it("menu freezes play and resumes the same run without spending bombs", () => {
  const g = new ArenaWorld(); g.start(); g.openMenu(); expect(g.phase).toBe("paused"); const time = g.elapsed; g.step(1, { x: 1, y: 0 }); expect(g.elapsed).toBe(time); expect(g.bomb()).toBe(false); expect(g.bombs).toBe(START_BOMBS); g.resumeMenu(); expect(g.phase).toBe("playing"); g.dispose();
});
it("pre-game menu returns to ready and preserves upgrade selection", () => {
  const g = new ArenaWorld(); g.openMenu(); expect(g.phase).toBe("ready"); g.resumeMenu(); expect(g.phase).toBe("ready"); g.phase = "upgrade"; g.openMenu(); g.step(1, { x: 0, y: 0 }); g.resumeMenu(); expect(g.phase).toBe("upgrade"); g.dispose();
});
it("dash cannot be spammed and recharges", () => { const g = new ArenaWorld(); g.start(); expect(g.dash()).toBe(true); expect(g.dash()).toBe(false); g.dashCooldown = 0; expect(g.dash()).toBe(true); g.dispose(); });
it("cover blocks the moving hero", () => { const g = new ArenaWorld(); g.start(); for (let i = 0; i < 1000; i++) { g.hp = 999; g.phase = "playing"; g.step(1 / 60, { x: 1, y: 0 }); } expect(g.hero.position.x).toBeLessThan(990); g.dispose(); });
it("pause freezes simulation", () => { const g = new ArenaWorld(); g.start(); g.phase = "paused"; const x = g.hero.position.x; g.step(1 / 60, { x: 1, y: 0 }); expect(g.hero.position.x).toBe(x); g.dispose(); });
it("awards exactly one point every 3 active seconds", () => { const g = new ArenaWorld(); g.start(); advance(g, 179); expect(g.score).toBe(0); advance(g, 1); expect(g.score).toBe(1); advance(g, 180); expect(g.score).toBe(2); g.dispose(); });
it("kills and pickups never grant score", () => { const g = new ArenaWorld(); g.start(); const enemy = g.enemies[0]; if (!enemy) throw Error("Missing starting enemy"); enemy.hp = 0; g.pickups.push({ x: 500, y: 310, kind: "energy" }); advance(g, 1); expect(g.kills).toBe(1); expect(g.score).toBe(0); g.dispose(); });
it("ramps firmly for 45 s, then keeps climbing more gently", () => {
  expect(spawnInterval(0)).toBe(0.86);
  expect(spawnInterval(30)).toBeCloseTo(0.71);
  expect(spawnInterval(45)).toBeCloseTo(0.647);
  expect(spawnInterval(180)).toBeGreaterThan(0.3);
  expect(difficultyAt(30) - difficultyAt(0)).toBeCloseTo(difficultyAt(45) - difficultyAt(15));
  expect(difficultyAt(120)).toBeGreaterThan(difficultyAt(60));
  expect((difficultyAt(120) - difficultyAt(60)) / 60).toBeLessThan((difficultyAt(45) - difficultyAt(15)) / 30 * 0.5);
  expect(spawnInterval(600)).toBe(0.2);
});
it("late-game shooters fire faster, never below 0.7 s", () => {
  const g = new ArenaWorld(); g.start(); g.fire = 999; g.elapsed = 600;
  const e = g.enemies[0]; if (!e) throw Error("Missing starting enemy");
  place(e, 500, 430); e.kind = KIND.drone; e.shot = 0.001; advance(g, 1);
  expect(e.shot).toBeCloseTo(Math.max(0.7, 2 - difficultyAt(g.elapsed) * 0.09), 2); expect(e.shot).toBeLessThan(1.2); g.dispose();
});
it("enemy health grows slowly and is capped", () => {
  expect([0, 149, 150, 300, 600, 900, 3000].map(smallHpAt)).toEqual([1, 1, 2, 3, 5, 7, 7]);
  expect([0, 89, 90, 180, 300, 600, 900, 3000].map(tankHpAt)).toEqual([4, 4, 5, 6, 7, 10, 14, 14]);
  expect(bossHpAt(120, 0)).toBeLessThan(90); expect(bossHpAt(210, 1)).toBeLessThan(170); expect(bossHpAt(210, 1)).toBeGreaterThan(bossHpAt(240, 1) - 25);
  // Player level no longer inflates enemy health.
  const g = new ArenaWorld(); g.start(); g.elapsed = 300; g.level = 20;
  expect(g.spawnEnemy(KIND.melee).hp).toBe(3); expect(g.spawnEnemy(KIND.tank).hp).toBe(7); g.dispose();
});
it("drops a health pickup only every 20 kills and only one at a time", () => {
  const g = new ArenaWorld(); g.start(); g.fire = 999;
  const kill = (n: number) => { g.kills = n; const e = g.enemies.find(x => x.hp > 0); if (!e) throw Error("Missing enemy"); e.hp = 0; advance(g, 1); };
  kill(6); expect(g.pickups.some(p => p.kind === "health")).toBe(false);
  kill(19); expect(g.kills).toBe(20); expect(g.pickups.filter(p => p.kind === "health")).toHaveLength(1);
  kill(39); expect(g.kills).toBe(40); expect(g.pickups.filter(p => p.kind === "health")).toHaveLength(1);
  g.dispose();
});
it("paused and finished time never grants score", () => { const g = new ArenaWorld(); g.start(); advance(g, 179); g.phase = "paused"; advance(g, 180); expect(g.score).toBe(0); g.phase = "playing"; advance(g, 1); expect(g.score).toBe(1); g.phase = "over"; advance(g, 180); expect(g.score).toBe(1); g.dispose(); });

// ------------------------------------------------------------------ bombs
it("bombs clear regular enemies and hostile shots without awarding points", () => {
  const g = new ArenaWorld(); g.start(); g.spawn = 999; g.fire = 999; g.shoot({ x: 50, y: 50 }, 1, 0, true); g.shoot({ x: 80, y: 80 }, 1, 0, false);
  expect(g.bomb()).toBe(true); expect(g.shots).toHaveLength(1); expect(g.shots[0]?.hostile).toBe(false);
  g.step(1 / 60, { x: 0, y: 0 }); expect(g.enemies).toHaveLength(0); expect(g.kills).toBe(5); expect(g.score).toBe(0); g.dispose();
});
it("bombs recharge with kills, capped at the maximum", () => {
  const g = new ArenaWorld(); g.start(); expect(g.bombs).toBe(START_BOMBS); g.bombs--;
  g.bombProgress = BOMB_KILLS - 1; const e = g.enemies[0]; if (!e) throw Error("Missing enemy"); e.hp = 0; advance(g, 1);
  expect(g.bombs).toBe(START_BOMBS); expect(g.bombProgress).toBe(0);
  g.bombs = MAX_BOMBS; g.bombProgress = BOMB_KILLS - 1; const f = g.enemies[0]; if (!f) throw Error("Missing enemy"); f.hp = 0; advance(g, 1);
  expect(g.bombs).toBe(MAX_BOMBS); g.dispose();
});
it("kills made by a bomb do not recharge bombs", () => {
  const g = new ArenaWorld(); g.start(); g.spawn = 999; g.bombs = 1; g.bombProgress = BOMB_KILLS - 1;
  for (let i = 0; i < 10; i++) g.spawnEnemy();
  const before = g.kills; g.bomb(); advance(g, 0.1);
  expect(g.kills).toBeGreaterThan(before); expect(g.bombs).toBe(0); expect(g.bombProgress).toBe(BOMB_KILLS - 1); g.dispose();
});
it("bombs only chip a boss instead of killing it", () => {
  const g = new ArenaWorld(); g.start(); const boss = g.spawnBoss(); const hp = boss.hp; g.bomb(); g.step(1 / 60, { x: 0, y: 0 });
  expect(g.enemies).toContain(boss); expect(boss.hp).toBe(hp - Math.ceil(boss.maxHp * 0.2)); g.dispose();
});

// ------------------------------------------------------------------ progression
it("crystals give XP and trigger a choice of three distinct upgrades", () => {
  const g = new ArenaWorld(); g.start(); g.spawn = 999;
  g.gems.push({ x: g.hero.position.x + 5, y: g.hero.position.y, value: xpFor(1), pulled: false });
  g.invincible = 100; g.step(1 / 60, { x: 0, y: 0 });
  expect(g.phase).toBe("upgrade"); expect(g.level).toBe(2); expect(g.xp).toBe(0);
  expect(new Set(g.choices).size).toBe(3);
  const elapsed = g.elapsed; g.step(1, { x: 0, y: 0 }); expect(g.elapsed).toBe(elapsed);
  const pick = g.choices[0]; if (!pick) throw Error("No choice");
  g.upgrade(pick); expect(g.levels[pick]).toBe(1); expect(g.phase).toBe("playing"); g.dispose();
});
it("upgrades apply only during the choice screen and only from the offered cards", () => {
  const g = new ArenaWorld(); g.upgrade("power"); expect(g.damage).toBe(1);
  g.phase = "upgrade"; g.choices = ["rate", "multi", "orbit"]; g.upgrade("power"); expect(g.damage).toBe(1); expect(g.phase).toBe("upgrade");
  g.choices = ["power", "multi", "orbit"]; g.upgrade("power"); expect(g.damage).toBe(2); expect(g.phase).toBe("playing"); g.dispose();
});
it("never offers a maxed upgrade and falls back to a full heal", () => {
  const g = new ArenaWorld();
  for (const id of Object.keys(UPGRADES) as (keyof typeof UPGRADES)[]) if (id !== "heal") g.levels[id] = UPGRADES[id].max;
  g.rollChoices(); expect(g.choices).toEqual(["heal"]);
  g.levels.power = 0; g.rollChoices(); expect(g.choices).toEqual(["power", "heal"]); g.dispose();
});
it("multi-shot fires a spread of projectiles", () => {
  const g = new ArenaWorld(); g.start(); g.spawn = 999; g.levels.multi = 2; g.fire = 0;
  const e = g.enemies[0]; if (!e) throw Error("Missing enemy"); for (const o of g.enemies) place(o, 900, 560); place(e, 600, 310);
  advance(g, 1); expect(g.shots.filter(s => !s.hostile)).toHaveLength(3); g.dispose();
});
it("piercing shots go through several enemies", () => {
  const g = new ArenaWorld(); g.start(); clearEnemies(g); g.spawn = 999; g.fire = 999;
  const a = g.addEnemy(KIND.tank, 560, 310), b = g.addEnemy(KIND.tank, 600, 310); a.hp = b.hp = 50;
  const s = g.shoot({ x: 520, y: 310 }, 1, 0, false, { damage: 3, pierce: 1 });
  advance(g, 20); expect(a.hp).toBe(47); expect(b.hp).toBe(47); expect(g.shots).not.toContain(s); g.dispose();
});
it("orbs damage enemies that touch them", () => {
  const g = new ArenaWorld(); g.start(); clearEnemies(g); g.spawn = 999; g.fire = 999; g.levels.orbit = 1;
  const o = g.orbPositions()[0]; if (!o) throw Error("No orb");
  const e = g.addEnemy(KIND.tank, o.x, o.y); e.hp = 50; advance(g, 1); expect(e.hp).toBeLessThan(50); g.dispose();
});
it("the shield absorbs one hit and recharges", () => {
  const g = new ArenaWorld(); g.start(); g.phase = "upgrade"; g.choices = ["shield"]; g.upgrade("shield");
  expect(g.shieldReady).toBe(true); g.hurt(); expect(g.hp).toBe(5); expect(g.shieldReady).toBe(false);
  g.invincible = 0; g.hurt(); expect(g.hp).toBe(4); g.dispose();
});

// ------------------------------------------------------------------ new enemies
it("introduces kamikazes, splitters and snipers over time", () => {
  const kinds = (t: number) => new Set(Array.from({ length: 2000 }, (_, i) => enemyKindAt(t, (i + 0.5) / 2000)));
  expect(kinds(50).has(KIND.kamikaze)).toBe(false);
  expect(kinds(70).has(KIND.kamikaze)).toBe(true);
  expect(kinds(90).has(KIND.splitter)).toBe(false);
  expect(kinds(110).has(KIND.splitter)).toBe(true);
  expect(kinds(130).has(KIND.sniper)).toBe(false);
  expect(kinds(150).has(KIND.sniper)).toBe(true);
});
it("a kamikaze lights its fuse near the hero and explodes", () => {
  const g = new ArenaWorld(); g.start(); clearEnemies(g); g.spawn = 999; g.fire = 999;
  const k = g.addEnemy(KIND.kamikaze, g.hero.position.x + 50, g.hero.position.y);
  g.step(1 / 60, { x: 0, y: 0 }); expect(k.fuse).toBeGreaterThan(0);
  for (let i = 0; i < 60 && g.phase === "playing"; i++) { g.invincible = i < 30 ? 100 : 0; g.step(1 / 60, { x: 0, y: 0 }); }
  expect(g.enemies).not.toContain(k); expect(g.hp).toBe(4); expect(g.kills).toBe(0); g.dispose();
});
it("a splitter breaks into two minis on death", () => {
  const g = new ArenaWorld(); g.start(); clearEnemies(g); g.spawn = 999; g.fire = 999;
  const s = g.addEnemy(KIND.splitter, 200, 100); s.hp = 0; advance(g, 1);
  expect(g.enemies.filter(e => e.mini)).toHaveLength(2); expect(g.kills).toBe(1); g.dispose();
});
it("a sniper aims for a moment before firing a fast shot", () => {
  const g = new ArenaWorld(); g.start(); clearEnemies(g); g.spawn = 999; g.fire = 999;
  const s = g.addEnemy(KIND.sniper, 500, 310 - 360); place(s, 500, 0 + 40); s.shot = 0.001;
  // Keep the line of sight clear: hero at centre, sniper straight above in open ground.
  place(s, 500, 50); advance(g, 1); expect(s.aim).toBeGreaterThan(0); expect(g.shots.filter(x => x.hostile)).toHaveLength(0);
  advance(g, 62); expect(g.shots.some(x => x.hostile && x.big)).toBe(true); g.dispose();
});

// ------------------------------------------------------------------ waves & bosses
it("runs a special wave at 45 s and a breather afterwards", () => {
  const g = new ArenaWorld(); g.start(); g.elapsed = EVENT_START - 0.01; advance(g, 2);
  expect(g.event).toBe("swarm"); expect(g.banner?.title).toBe("ESSAIM");
  advance(g, 60 * 8 + 2); expect(g.event).toBe(null); expect(g.calm).toBe(true);
  const before = g.enemies.length; g.spawn = 0; advance(g, 1); expect(g.enemies.length).toBeLessThanOrEqual(before); g.dispose();
});
it("spawns a boss every two minutes and drops loot when it dies", () => {
  const g = new ArenaWorld(); g.start(); g.elapsed = BOSS_EVERY - 0.01; advance(g, 2);
  const boss = g.boss; if (!boss) throw Error("No boss");
  expect(boss.kind).toBe(KIND.boss); expect(g.nextBoss).toBe(SECOND_BOSS_AT);
  boss.hp = 0; advance(g, 1);
  expect(g.boss).toBe(null); expect(g.bossesKilled).toBe(1);
  expect(g.pickups.some(p => p.kind === "bomb")).toBe(true); expect(g.gems.filter(x => x.value === 5)).toHaveLength(12); g.dispose();
});
it("only every other boss leaves a bomb", () => {
  const g = new ArenaWorld(); g.start(); g.nextBoss = Infinity;
  const drops: boolean[] = [];
  for (let i = 0; i < 3; i++) { g.pickups.length = 0; const b = g.spawnBoss(); b.hp = 0; advance(g, 0.1); drops.push(g.pickups.some(p => p.kind === "bomb")); }
  expect(drops).toEqual([true, false, true]); g.dispose();
});
it("the boss cycles through its attacks", () => {
  const g = new ArenaWorld(); g.start(); clearEnemies(g); g.spawn = 999; g.fire = 999;
  let r = 0; g.rand = () => [0.1, 0.5, 0.9][r++ % 3] ?? 0; g.bossIndex = 1; const boss = g.spawnBoss(); boss.hp = boss.maxHp = 9999; const seen = new Set<string>();
  for (let i = 0; i < 60 * 40; i++) { g.invincible = 100; g.hp = 5; g.step(1 / 60, { x: 0, y: 0 }); seen.add(boss.state); }
  expect(seen).toEqual(new Set(["walk", "telegraph", "charge", "fan", "summon"])); g.dispose();
});
it("starts with a single bomb", () => { const g = new ArenaWorld(); expect(g.bombs).toBe(1); g.dispose(); });
it("wave units arrive one by one, never in a burst", () => {
  for (const cycle of [0, 1, 2, 3]) {
    const g = new ArenaWorld(); g.start(); g.spawn = 999; g.nextBoss = Infinity; g.elapsed = cycle * 60 + EVENT_START - 0.01;
    let max = 0;
    for (let i = 0; i < 60 * 8; i++) { const before = g.enemies.length; advance(g, 1); g.spawn = 999; max = Math.max(max, g.enemies.length - before); }
    expect(max).toBeLessThanOrEqual(1); g.dispose();
  }
});
it("the first boss never fires projectiles", () => {
  const g = new ArenaWorld(); g.start(); clearEnemies(g); g.spawn = 999; g.fire = 999;
  let r = 0; g.rand = () => [0.1, 0.5, 0.7, 0.9][r++ % 4] ?? 0; const boss = g.spawnBoss(); boss.hp = boss.maxHp = 9999; const seen = new Set<string>();
  for (let i = 0; i < 60 * 40; i++) { g.invincible = 100; g.hp = 5; g.step(1 / 60, { x: 0, y: 0 }); seen.add(boss.state); expect(g.shots.some(s => s.hostile)).toBe(false); }
  expect(seen.has("fan")).toBe(false); expect(seen.has("charge")).toBe(true); expect(seen.has("summon")).toBe(true); g.dispose();
});

// ------------------------------------------------------------------ cards
it("multi-shot is common for the first two levels, then rare", () => {
  expect(cardWeight("multi", 0)).toBe(1); expect(cardWeight("multi", 1)).toBe(1);
  expect(cardWeight("multi", 2)).toBeLessThan(0.25); expect(cardWeight("power", 5)).toBe(1);
  const g = new ArenaWorld(); g.levels.multi = 2; let seen = 0;
  for (let i = 0; i < 2000; i++) { g.rollChoices(); if (g.choices.includes("multi")) seen++; }
  expect(seen / 2000).toBeLessThan(0.1); g.dispose();
});

// ------------------------------------------------------------------ rooms
const walkTo = (g: ArenaWorld, x: number) => { const from = g.room; for (let i = 0; i < 120 && g.room === from; i++) { g.invincible = 100; g.xpNext = Infinity; Matter.Body.setPosition(g.hero, { x: x > 500 ? 980 : 20, y: GATE_Y }); g.step(1 / 60, { x: x > 500 ? 1 : -1, y: 0 }); } };
it("the east gate leads to the Fiery Pit and the arena's enemies chase you through it", () => {
  const g = new ArenaWorld(); g.start(); g.spawn = 999; g.fire = 999; clearEnemies(g);
  const arenaFoes = [g.addEnemy(KIND.tank, 120, 90), g.addEnemy(KIND.melee, 140, 560), g.addEnemy(KIND.melee, 900, 500)];
  walkTo(g, 1000);
  expect(g.room).toBe(1); expect(g.hero.position.x).toBeLessThan(60); expect(g.gateLock).toBeGreaterThan(GATE_LOCK - 1);
  expect(g.walls.slice(4)).toHaveLength(5);
  expect(g.followers).toHaveLength(3); expect(g.enemies.some(e => arenaFoes.includes(e))).toBe(false);
  // The closest one comes first; they come out of the west gate one at a time.
  expect(g.followers[0]?.e).toBe(arenaFoes[2]);
  let most = 0;
  for (let i = 0; i < 60 * 12; i++) { const before = g.enemies.filter(e => arenaFoes.includes(e)).length; g.invincible = 100; g.spawn = 999; g.step(1 / 60, { x: 0, y: 0 }); most = Math.max(most, g.enemies.filter(e => arenaFoes.includes(e)).length - before); }
  expect(most).toBe(1); expect(g.followers).toHaveLength(0);
  expect(arenaFoes.every(e => g.enemies.includes(e) || e.hp <= 0)).toBe(true);
  // Gate is locked: walking back does nothing until the timer ends.
  g.gateLock = 5; walkTo(g, 0); expect(g.room).toBe(1); g.dispose();
});
it("turning back early runs into the pursuers, and the pit's enemies follow in turn", () => {
  const g = new ArenaWorld(); g.start(); g.spawn = 999; g.fire = 999; clearEnemies(g);
  const a = g.addEnemy(KIND.tank, 100, 560);
  walkTo(g, 1000); expect(g.followers.map(f => f.e)).toEqual([a]);
  const pitFoes = [...g.enemies];
  g.gateLock = 0; walkTo(g, 0);
  expect(g.room).toBe(0); expect(g.hero.position.x).toBeGreaterThan(940);
  expect(g.enemies).toContain(a); expect(a.body.position.x).toBeLessThan(860);
  const ids = (l: { body: { id: number } }[]) => l.map(e => e.body.id).sort();
  expect(ids(g.followers.map(f => f.e))).toEqual(ids(pitFoes.filter(e => e.hp > 0))); g.dispose();
});
it("gates stay shut during a boss fight", () => {
  const g = new ArenaWorld(); g.start(); g.spawn = 999; g.fire = 999; g.spawnBoss();
  for (let i = 0; i < 60; i++) { g.invincible = 100; g.hp = 5; Matter.Body.setPosition(g.hero, { x: 990, y: GATE_Y }); g.step(1 / 60, { x: 1, y: 0 }); }
  expect(g.room).toBe(0); expect(g.gatesOpen).toBe(false); g.dispose();
});
it("pit crystals are worth double and geysers hurt everyone after a warning", () => {
  const g = new ArenaWorld(); g.start(); g.spawn = 999; g.fire = 999; g.switchRoom(1); clearEnemies(g);
  const e = g.addEnemy(KIND.tank, 600, 300); e.hp = 0; advance(g, 1);
  expect(g.gems.at(-1)?.value).toBe(3 * PIT_XP);
  (g as unknown as { geyserTimer: number }).geyserTimer = 999;
  // Enemy caught in an eruption, far from the hero.
  const t = g.addEnemy(KIND.tank, 800, 500); t.hp = 50; Matter.Body.setPosition(g.hero, { x: 120, y: 120 });
  g.geysers = [{ x: 800, y: 500, r: 52, t: 0.05, burst: false }]; advance(g, 5);
  expect(t.hp).toBe(50 - GEYSER_DAMAGE);
  // Hero standing in one: warned first, then hurt once.
  g.geysers = [{ x: 120, y: 120, r: 52, t: GEYSER_WARN, burst: false }];
  g.invincible = 0; const hp = g.hp;
  for (let i = 0; i < 60; i++) { g.step(1 / 60, { x: 0, y: 0 }); } expect(g.hp).toBe(hp);
  for (let i = 0; i < 30; i++) { g.step(1 / 60, { x: 0, y: 0 }); } expect(g.hp).toBe(hp - 1); g.dispose();
});
it("every pursuer walks out of the gate visibly, even with the hero camping it", () => {
  const g = new ArenaWorld(); g.start(); g.spawn = 999; g.nextBoss = Infinity; clearEnemies(g);
  g.levels.orbit = 3; g.levels.multi = 2; g.damage = 6; g.fireRate = 0.12;
  const foes = Array.from({ length: 15 }, (_, i) => g.addEnemy(i % 5 === 3 ? KIND.kamikaze : i % 3 ? KIND.melee : KIND.tank, 80 + (i % 5) * 160, 80 + Math.floor(i / 5) * 200));
  walkTo(g, 1000); expect(g.followers).toHaveLength(15);
  const out = new Set<number>(), hurtByArrival: number[] = [];
  for (let i = 0; i < 60 * 14; i++) {
    const hp = g.hp; g.invincible = 0; g.spawn = 999; g.xpNext = Infinity;
    Matter.Body.setPosition(g.hero, { x: 40, y: GATE_Y }); g.step(1 / 60, { x: 0, y: 0 });
    for (const e of g.enemies) if (foes.includes(e) && e.arriving > 0) out.add(e.body.id);
    if (g.enemies.some(e => e.arriving > 0 && e.hp < e.maxHp)) hurtByArrival.push(-i);
    g.hp = 5;
  }
  expect(out.size).toBe(15); expect(g.followers).toHaveLength(0); expect(hurtByArrival).toEqual([]); g.dispose();
});
it("never holds more than two bombs, whatever the source", () => {
  const g = new ArenaWorld(); g.start(); g.spawn = 999; g.fire = 999; expect(MAX_BOMBS).toBe(2);
  for (let i = 0; i < 4; i++) { g.bombProgress = BOMB_KILLS - 1; const e = g.enemies[0] ?? g.spawnEnemy(); e.hp = 0; advance(g, 1); }
  expect(g.bombs).toBe(2);
  const h = g.hero.position; g.pickups.push({ x: h.x, y: h.y, kind: "bomb" }); advance(g, 1);
  expect(g.bombs).toBe(2); expect(g.pickups.some(p => p.kind === "bomb")).toBe(true);
  g.bombs = 1; advance(g, 1); expect(g.bombs).toBe(2); expect(g.pickups.some(p => p.kind === "bomb")).toBe(false); g.dispose();
});

it("second boss comes at 3:30, then every two minutes", () => {
  expect([0, 119, 120, 150, 210, 300, 330, 449].map(nextBossAfter)).toEqual([120, 120, 210, 210, 330, 330, 450, 450]);
  expect(SECOND_BOSS_AT).toBeLessThan(BOSS_EVERY * 2);
});
it("adds a light, varied trickle of foes only after the first boss", () => {
  const run = (killed: number, seconds: number) => {
    const g = new ArenaWorld(); g.start(); g.spawn = 999; g.nextBoss = Infinity; clearEnemies(g); g.bossesKilled = killed;
    g.elapsed = 120; const kinds: number[] = []; const spawn = g.spawnEnemy.bind(g);
    g.spawnEnemy = (kind, edge) => { const e = spawn(kind, edge); kinds.push(e.kind); return e; };
    for (let i = 0; i < 60 * seconds; i++) { g.spawn = 999; g.step(1 / 60, { x: 0, y: 0 }); }
    g.dispose(); return kinds;
  };
  expect(run(0, 20)).toEqual([]);
  const kinds = run(1, 20); // 120 s -> 140 s: no wave and no lull in that span
  const splitters = kinds.filter(k => k === KIND.splitter).length, melee = kinds.filter(k => k === KIND.melee).length;
  expect(splitters).toBeGreaterThanOrEqual(2); expect(splitters).toBeLessThanOrEqual(Math.ceil(20 / EXTRA_GREEN_EVERY));
  expect(melee).toBeGreaterThanOrEqual(Math.floor(20 / EXTRA_MELEE_EVERY)); expect(melee).toBeLessThanOrEqual(Math.ceil(20 / EXTRA_MELEE_EVERY) + 4);
});
