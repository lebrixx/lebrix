import Matter from "matter-js";
const { Engine, Bodies, Body, Composite, Query } = Matter;

export const WIDTH = 1000, HEIGHT = 620;
export type Phase = "ready" | "playing" | "paused" | "upgrade" | "over";

// ---------------------------------------------------------------------------
// Score & pacing
// ---------------------------------------------------------------------------
/** Score stays purely time-based: one point every 3 active seconds. */
export const SCORE_SECONDS = 3;
export const HEALTH_KILL_EVERY = 20;
/** Each 60 s cycle: free flow, then a special wave at 45 s, then a short breather. */
export const CYCLE_SECONDS = 60;
export const EVENT_START = 45;
export const EVENT_LENGTH = 8;
export const BOSS_EVERY = 120;
/** The second boss comes 1 min 30 after the first instead of 2 min; then one every BOSS_EVERY. */
export const SECOND_BOSS_AT = 210;
export const nextBossAfter = (seconds: number) => seconds < BOSS_EVERY ? BOSS_EVERY
  : seconds < SECOND_BOSS_AT ? SECOND_BOSS_AT
  : SECOND_BOSS_AT + (Math.floor((seconds - SECOND_BOSS_AT) / BOSS_EVERY) + 1) * BOSS_EVERY;
/** Once the first boss is down, a lone melee grunt joins in this often (outside waves, bosses and lulls). */
export const EXTRA_MELEE_EVERY = 3.4;
/** Also after the first boss: a green splitter about every 4 s (3.6-4.4 s), with some variety. */
export const EXTRA_GREEN_EVERY = 4;
/** Above this many splitters alive, the green slot sends a pair of grunts instead. */
export const MAX_EXTRA_SPLITTERS = 4;
/** Bombs recharge by kills instead of being a one-off stock. */
export const BOMB_KILLS = 60;
/** Bosses leave a bomb one time out of two (1st, 3rd, 5th...). */
export const BOSS_BOMB_EVERY = 2;
/** Never more than two bombs in hand. */
export const MAX_BOMBS = 2;
export const START_BOMBS = 1;

// Progressive curve: firm ramp for the first 45 s, then the base growth drops
// to about a quarter of that speed so the climb never runs away. The 30 s steps
// keep nudging it upward, and long runs still end up at the maximum pressure.
const FIRM_SECONDS = 45;
const FIRM_RATE = 0.035;
const SOFT_RATE = 0.01;
const STEP_EVERY = 0.2;
export const difficultyAt = (seconds: number) => seconds <= FIRM_SECONDS
  ? seconds * FIRM_RATE + Math.floor(seconds / 30) * STEP_EVERY
  : FIRM_SECONDS * FIRM_RATE + (seconds - FIRM_SECONDS) * SOFT_RATE + Math.floor(seconds / 30) * STEP_EVERY;
/** Enemy health grows slowly and stops at 15 min: small foes +1 every 2 min 30, tanks +1 every 1 min 30. */
export const smallHpAt = (seconds: number) => 1 + Math.floor(Math.min(seconds, 900) / 150);
export const tankHpAt = (seconds: number) => 4 + Math.floor(Math.min(seconds, 900) / 90);
/** Boss health: 70, then +45 per boss (+25 from the second on), plus a little with the clock. */
export const bossHpAt = (seconds: number, index: number) => 70 + 45 * index + (index >= 1 ? 25 : 0) + Math.floor(difficultyAt(seconds) * 4);
export const spawnInterval = (seconds: number) => Math.max(0.2, 0.86 - difficultyAt(seconds) * 0.12);
/** XP needed to go from `level` to `level + 1`: quick first picks, slower later. */
export const xpFor = (level: number) => Math.round(22 + 16 * level + 3.4 * level * level);

// ---------------------------------------------------------------------------
// Enemies
// ---------------------------------------------------------------------------
export const KIND = { melee: 0, tank: 1, drone: 2, kamikaze: 3, splitter: 4, sniper: 5, boss: 6 } as const;
export type EnemyKind = typeof KIND[keyof typeof KIND];
/** Unlock times of the new enemy types. */
export const KAMIKAZE_FROM = 60, SPLITTER_FROM = 100, SNIPER_FROM = 140;

/**
 * Picks an enemy kind for a roll in [0, 1). Base shares (drones / tanks / melee)
 * follow the original curve; newer kinds take a slice of their family once unlocked.
 */
export function enemyKindAt(seconds: number, roll: number): EnemyKind {
  const difficulty = difficultyAt(seconds);
  const shooterChance = Math.min(0.45, 0.12 + difficulty * 0.045);
  const tankChance = (Math.min(0.72, 0.32 + difficulty * 0.05) - shooterChance) * (seconds >= 20 * SCORE_SECONDS ? 0.75 : 1);
  if (roll < shooterChance) return seconds >= SNIPER_FROM && roll < shooterChance * 0.3 ? KIND.sniper : KIND.drone;
  if (roll < shooterChance + tankChance) return seconds >= SPLITTER_FROM && roll < shooterChance + tankChance * 0.35 ? KIND.splitter : KIND.tank;
  return seconds >= KAMIKAZE_FROM && roll > 1 - (1 - shooterChance - tankChance) * 0.25 ? KIND.kamikaze : KIND.melee;
}

export const ENEMY_RADIUS: Record<EnemyKind, number> = { 0: 14, 1: 20, 2: 14, 3: 13, 4: 18, 5: 14, 6: 38 };
const GEM_VALUE: Record<EnemyKind, number> = { 0: 1, 1: 3, 2: 2, 3: 1, 4: 3, 5: 3, 6: 0 };
export const BOSS_NAMES = ["LE COLOSSE", "LE BROYEUR", "LE TITAN"];

type BossState = "walk" | "telegraph" | "charge" | "fan" | "summon";
export type Enemy = {
  body: Matter.Body; hp: number; maxHp: number; kind: EnemyKind; shot: number;
  mini: boolean;
  /** Kamikaze fuse (s), -1 while not lit. */
  fuse: number;
  /** Sniper aim time left (s), -1 while not aiming. */
  aim: number; aimDir: { x: number; y: number };
  /** Hit flash for the renderer. */
  flash: number;
  orbHit: number; fireHit: number;
  detonated: boolean;
  /** Killed by a bomb: does not count toward the next bomb. */
  bombed: boolean;
  /** Seconds left walking out of a gate after following the hero: untouchable and harmless. */
  arriving: number;
  state: BossState; stateTime: number;
};
export type Shot = {
  body: Matter.Body; vx: number; vy: number; life: number; hostile: boolean;
  damage: number; pierce: number; ricochet: number; hits: number[]; big: boolean;
};
export type Pickup = { x: number; y: number; kind: "health" | "energy" | "bomb" };
export type Gem = { x: number; y: number; value: number; pulled: boolean };
export type Fire = { x: number; y: number; life: number; max: number };
export type WaveEvent = "swarm" | "kamikaze" | "squadron" | "armored";
export const WAVE_EVENTS: WaveEvent[] = ["swarm", "kamikaze", "squadron", "armored"];
const EVENT_TEXT: Record<WaveEvent, [string, string]> = {
  swarm: ["ESSAIM", "Une nuée de robots déferle"],
  kamikaze: ["KAMIKAZES", "Garde tes distances !"],
  squadron: ["ESCADRILLE", "Des drones arrivent en formation"],
  armored: ["COLONNE BLINDÉE", "Les blindés avancent"],
};

/** Visual events drained each frame by the renderer. Purely cosmetic. */
export type Fx =
  | { type: "hit"; x: number; y: number; amount: number }
  | { type: "death"; x: number; y: number; kind: EnemyKind; mini: boolean }
  | { type: "explode"; x: number; y: number; r: number; hostile: boolean }
  | { type: "bomb"; x: number; y: number }
  | { type: "hurt" }
  | { type: "shield"; x: number; y: number }
  | { type: "levelup"; x: number; y: number }
  | { type: "pickup"; x: number; y: number; kind: "gem" | "health" | "bomb" }
  | { type: "bossDown"; x: number; y: number }
  | { type: "room"; room: number }
  | { type: "geyser"; x: number; y: number; r: number }
  | { type: "arrive"; x: number; y: number };

// ---------------------------------------------------------------------------
// Rooms: the arena (0) and the Fiery Pit (1), linked by the east/west gates.
// ---------------------------------------------------------------------------
export const ROOM_NAMES = ["ARÈNE", "FOSSE ARDENTE"];
/** The passage sits high on the side wall, clear of the bomb button and the health plate on phones. */
export const GATE_Y = 155, GATE_HALF = 40, GATE_LOCK = 35;
/** Followers walk to the gate and come through one at a time. */
export const FOLLOW_MIN_DELAY = 1.2, FOLLOW_MAX_DELAY = 10, FOLLOW_GAP = 0.45, ARRIVE_TIME = 0.7;
/** In the pit: crystals are worth double, enemies arrive a bit faster, lava geysers erupt. */
export const PIT_XP = 2, PIT_SPAWN_BOOST = 1.25, GEYSER_WARN = 1.3, GEYSER_BURST = 0.5, GEYSER_R = 52, GEYSER_DAMAGE = 6;
const OUTER_WALLS = [[500,-20,1040,40],[500,640,1040,40],[-20,310,40,620],[1020,310,40,620]];
export const ROOM_COVER = [
  [[260,200,150,34],[740,420,150,34],[250,440,34,90],[750,180,34,90]],
  [[330,190,60,60],[670,190,60,60],[330,430,60,60],[670,430,60,60],[500,310,44,44]],
];
export const coverBounds = (room: number) => (ROOM_COVER[room] ?? []).map(([x = 0, y = 0, w = 0, h = 0]) => ({ min: { x: x - w / 2, y: y - h / 2 }, max: { x: x + w / 2, y: y + h / 2 } }));
export type Geyser = { x: number; y: number; r: number; t: number; burst: boolean };
type RoomStash = { enemies: Enemy[]; gems: Gem[]; pickups: Pickup[]; fires: Fire[] };

export type Banner = { id: number; title: string; sub: string; tone: "event" | "boss" | "calm" | "win" };

// ---------------------------------------------------------------------------
// Upgrades
// ---------------------------------------------------------------------------
export type UpgradeId = "power" | "rate" | "multi" | "pierce" | "ricochet" | "orbit" | "blast" | "magnet" | "leech" | "trail" | "shield" | "vitality" | "speed" | "heal";
export const UPGRADES: Record<UpgradeId, { name: string; max: number; desc: (next: number) => string }> = {
  power:    { name: "Puissance",     max: 8, desc: () => "+1 dégât par tir" },
  rate:     { name: "Cadence",       max: 6, desc: () => "Tirs 15 % plus rapides" },
  multi:    { name: "Tir multiple",  max: 4, desc: n => `${n + 1} projectiles en éventail` },
  pierce:   { name: "Perforation",   max: 3, desc: n => `Les balles traversent ${n} ennemi${n > 1 ? "s" : ""}` },
  ricochet: { name: "Ricochet",      max: 3, desc: n => `Rebondit vers ${n} cible${n > 1 ? "s" : ""} proche${n > 1 ? "s" : ""}` },
  orbit:    { name: "Orbes",         max: 4, desc: n => `${n} orbe${n > 1 ? "s" : ""} tourne${n > 1 ? "nt" : ""} autour de toi` },
  blast:    { name: "Détonation",    max: 3, desc: () => "Les ennemis explosent en mourant" },
  magnet:   { name: "Aimant",        max: 3, desc: () => "Attire les cristaux de plus loin" },
  leech:    { name: "Vampirisme",    max: 3, desc: n => `+1 vie toutes les ${LEECH_KILLS[n]} éliminations` },
  trail:    { name: "Traînée de feu", max: 3, desc: () => "L'esquive enflamme le sol et recharge plus vite" },
  shield:   { name: "Bouclier",      max: 3, desc: n => `Bloque un coup, recharge en ${SHIELD_RECHARGE[n]} s` },
  vitality: { name: "Vitalité",      max: 5, desc: () => "+1 vie max et +2 soins" },
  speed:    { name: "Agilité",       max: 3, desc: () => "Déplacement 12 % plus rapide" },
  heal:     { name: "Soin complet",  max: Infinity, desc: () => "Restaure toute ta vie" },
};
const LEECH_KILLS = [0, 25, 18, 12];
const SHIELD_RECHARGE = [0, 20, 15, 10];
const CARD_POOL = (Object.keys(UPGRADES) as UpgradeId[]).filter(id => id !== "heal");
/** Draw weight of a card given its current level (default 1). Multi-shot gets rare after level 2. */
export const cardWeight = (id: UpgradeId, level: number) => id === "multi" ? (level < 2 ? 1 : level === 2 ? 0.2 : 0.12) : 1;

export class ArenaWorld {
  engine = Engine.create({ gravity: { x: 0, y: 0 } });
  hero = Bodies.circle(WIDTH / 2, HEIGHT / 2, 15, { frictionAir: 0, inertia: Infinity, label: "hero" });
  walls: Matter.Body[] = [];
  enemies: Enemy[] = [];
  shots: Shot[] = [];
  pickups: Pickup[] = [];
  gems: Gem[] = [];
  fires: Fire[] = [];
  fx: Fx[] = [];
  phase: Phase = "ready";
  /** Injectable for deterministic tests. */
  rand: () => number = Math.random;

  hp = 5; maxHp = 5; score = 0; kills = 0;
  damage = 1; fireRate = 0.44; moveSpeed = 3.3;
  dashCooldown = 0; dashTime = 0; invincible = 0;
  facing = { x: 1, y: 0 }; aim = { x: 1, y: 0 };
  fire = 0; spawn = 0; elapsed = 0;
  bombs = START_BOMBS; bombProgress = 0; bombFlash = 0;
  menuOpen = false;

  // Progression
  level = 1; xp = 0; xpNext = xpFor(1);
  levels: Record<UpgradeId, number> = Object.fromEntries(Object.keys(UPGRADES).map(k => [k, 0])) as Record<UpgradeId, number>;
  choices: UpgradeId[] = [];
  shieldReady = false; shieldTimer = 0;
  private leechCount = 0;
  private trailDrop = 0;

  // Waves
  boss: Enemy | null = null;
  bossIndex = 0; bossesKilled = 0;
  nextBoss = BOSS_EVERY;
  extraMelee = EXTRA_MELEE_EVERY;
  extraGreen = EXTRA_GREEN_EVERY; extraGreenCount = 0;
  event: WaveEvent | null = null; eventTime = 0;
  private eventCycle = -1;
  private eventTick = 0;
  private eventSpawned = 0;
  private eventEdge = 0;
  banner: Banner | null = null; bannerTime = 0;
  private bannerId = 0;

  private menuPhase: Phase = "ready";

  // Rooms
  room = 0;
  gateLock = 0;
  geysers: Geyser[] = [];
  private geyserTimer = 2.5;
  private outer: Matter.Body[] = [];
  private cover: Matter.Body[][] = [];
  private stash: (RoomStash | null)[] = [null, null];
  /** Enemies from the room you left, on their way through the gate (t = seconds before they come out). */
  followers: { e: Enemy; t: number }[] = [];

  constructor() {
    const make = ([x = 0, y = 0, w = 0, h = 0]: number[]) => Bodies.rectangle(x, y, w, h, { isStatic: true, label: "wall" });
    this.outer = OUTER_WALLS.map(make);
    this.cover = ROOM_COVER.map(list => list.map(make));
    this.walls = [...this.outer, ...(this.cover[0] ?? [])];
    Composite.add(this.engine.world, [this.hero, ...this.walls]);
  }

  // ---------------------------------------------------------------- menu
  openMenu() {
    if (this.menuOpen) return;
    this.menuPhase = this.phase;
    this.menuOpen = true;
    if (this.phase === "playing") this.phase = "paused";
  }
  resumeMenu() {
    if (!this.menuOpen) return;
    this.phase = this.menuPhase;
    this.menuOpen = false;
  }

  // ---------------------------------------------------------------- actions
  start() { this.phase = "playing"; for (let i = 0; i < 5; i++) this.spawnEnemy(); this.spawn = spawnInterval(0); }

  get dashCooldownMax() { return 2.5 - 0.3 * this.levels.trail; }
  get magnetRadius() { return 70 + 60 * this.levels.magnet; }
  get calm() {
    const off = this.elapsed % CYCLE_SECONDS;
    return off >= EVENT_START + EVENT_LENGTH;
  }

  dash() {
    if (this.phase !== "playing" || this.dashCooldown > 0) return false;
    this.dashTime = 0.2; this.dashCooldown = this.dashCooldownMax; this.invincible = Math.max(this.invincible, 0.3); return true;
  }

  bomb() {
    if (this.phase !== "playing" || this.menuOpen || this.bombs <= 0) return false;
    this.bombs--;
    this.bombFlash = 0.5;
    for (const enemy of this.enemies) {
      if (enemy.kind === KIND.boss) { enemy.hp -= Math.ceil(enemy.maxHp * 0.2); enemy.flash = 0.3; }
      else if (enemy.hp > 0) { enemy.hp = 0; enemy.bombed = true; }
    }
    for (const gem of this.gems) gem.pulled = true;
    this.shots = this.shots.filter(shot => {
      if (!shot.hostile) return true;
      Composite.remove(this.engine.world, shot.body);
      return false;
    });
    this.emit({ type: "bomb", x: this.hero.position.x, y: this.hero.position.y });
    return true;
  }

  /** Draws up to three distinct, non-maxed upgrade cards. */
  rollChoices() {
    const open = CARD_POOL.filter(id => this.levels[id] < UPGRADES[id].max);
    const picks: UpgradeId[] = [];
    while (picks.length < 3 && open.length) {
      const weights = open.map(id => cardWeight(id, this.levels[id]));
      let roll = this.rand() * weights.reduce((a, b) => a + b, 0), i = 0;
      while (i < open.length - 1 && roll >= (weights[i] ?? 0)) { roll -= weights[i] ?? 0; i++; }
      picks.push(...open.splice(i, 1));
    }
    if (picks.length < 3) picks.push("heal");
    this.choices = picks;
  }

  upgrade(choice: UpgradeId) {
    if (this.phase !== "upgrade" || !this.choices.includes(choice)) return;
    const lvl = ++this.levels[choice];
    if (choice === "power") this.damage++;
    if (choice === "rate") this.fireRate = Math.max(0.12, this.fireRate * 0.85);
    if (choice === "vitality") { this.maxHp++; this.hp = Math.min(this.maxHp, this.hp + 2); }
    if (choice === "speed") this.moveSpeed = 3.3 * (1 + 0.12 * lvl);
    if (choice === "shield" && lvl === 1) { this.shieldReady = true; this.shieldTimer = 0; }
    if (choice === "heal") this.hp = this.maxHp;
    this.choices = [];
    this.phase = "playing";
  }

  // ---------------------------------------------------------------- spawning
  private edgePoint(edge = Math.floor(this.rand() * 4)) {
    const x = edge === 0 ? 35 : edge === 1 ? WIDTH - 35 : 50 + this.rand() * (WIDTH - 100);
    const y = edge === 2 ? 35 : edge === 3 ? HEIGHT - 35 : 50 + this.rand() * (HEIGHT - 100);
    return { x, y };
  }

  private enemyHp(kind: EnemyKind, mini: boolean) {
    const small = smallHpAt(this.elapsed), tank = tankHpAt(this.elapsed);
    if (mini) return Math.max(1, Math.floor(small / 2));
    if (kind === KIND.tank) return tank;
    if (kind === KIND.splitter) return Math.max(3, Math.round(tank * 0.75));
    if (kind === KIND.sniper) return small + 1;
    if (kind === KIND.boss) return bossHpAt(this.elapsed, this.bossIndex);
    return small;
  }

  addEnemy(kind: EnemyKind, x: number, y: number, mini = false) {
    const radius = mini ? 10 : ENEMY_RADIUS[kind];
    const body = Bodies.circle(x, y, radius, { frictionAir: 0, inertia: Infinity, label: kind === KIND.boss ? "boss" : "enemy" });
    const hp = this.enemyHp(kind, mini);
    const enemy: Enemy = {
      body, hp, maxHp: hp, kind, shot: kind === KIND.sniper ? 1.5 : 1, mini,
      fuse: -1, aim: -1, aimDir: { x: 1, y: 0 }, flash: 0, orbHit: 0, fireHit: 0, detonated: false, bombed: false, arriving: 0,
      state: "walk", stateTime: 2.5,
    };
    this.enemies.push(enemy);
    Composite.add(this.engine.world, body);
    return enemy;
  }

  spawnEnemy(kind: EnemyKind = enemyKindAt(this.elapsed, this.rand()), edge?: number) {
    const { x, y } = this.edgePoint(edge);
    return this.addEnemy(kind, x, y);
  }

  spawnBoss() {
    const boss = this.addEnemy(KIND.boss, WIDTH / 2, 50);
    this.boss = boss;
    this.announce(`BOSS : ${BOSS_NAMES[this.bossIndex % BOSS_NAMES.length]}`, "Abats-le pour un gros butin", "boss");
    this.bossIndex++;
    return boss;
  }

  private announce(title: string, sub: string, tone: Banner["tone"]) {
    this.banner = { id: ++this.bannerId, title, sub, tone };
    this.bannerTime = 2.6;
  }

  private emit(fx: Fx) {
    if (this.fx.length > 400) this.fx.splice(0, 100);
    this.fx.push(fx);
  }

  /** Varied green reinforcement: mostly a lone splitter, sometimes a pair of grunts from one side. */
  private spawnExtraGreen() {
    const n = this.extraGreenCount++;
    const splitters = this.enemies.filter(e => e.kind === KIND.splitter && e.hp > 0).length;
    if (n % 3 === 2 || splitters >= MAX_EXTRA_SPLITTERS) {
      const edge = Math.floor(this.rand() * 4);
      this.spawnEnemy(KIND.melee, edge); this.spawnEnemy(KIND.melee, edge);
    } else this.spawnEnemy(KIND.splitter);
  }

  private updateWaves(dt: number) {
    const t = this.elapsed, cycle = Math.floor(t / CYCLE_SECONDS), off = t - cycle * CYCLE_SECONDS;
    if (t >= this.nextBoss) {
      this.nextBoss = nextBossAfter(t);
      if (!this.boss) this.spawnBoss();
    }
    if (cycle !== this.eventCycle && off >= EVENT_START && off < EVENT_START + EVENT_LENGTH) {
      this.eventCycle = cycle;
      if (!this.boss) {
        const ev = WAVE_EVENTS[cycle % WAVE_EVENTS.length] ?? "swarm";
        this.event = ev; this.eventTime = EVENT_LENGTH; this.eventTick = 0; this.eventSpawned = 0; this.eventEdge = Math.floor(this.rand() * 4);
        const [title, sub] = EVENT_TEXT[ev];
        this.announce(title, sub, "event");
      }
    }
    if (this.event) {
      this.eventTime -= dt;
      this.eventTick -= dt;
      // Wave units arrive one after another rather than all at once.
      if (this.eventTick <= 0) {
        if (this.event === "swarm") { this.eventTick = 0.42; this.spawnEnemy(KIND.melee); }
        if (this.event === "kamikaze") { this.eventTick = 1.0; this.spawnEnemy(KIND.kamikaze); }
        if (this.event === "squadron" && this.eventSpawned < 3) { this.eventTick = 0.7; this.eventSpawned++; this.spawnEnemy(KIND.drone, this.eventEdge); }
        if (this.event === "armored" && this.eventSpawned < 3) { this.eventTick = 1.2; this.eventSpawned++; this.spawnEnemy(this.eventSpawned === 2 && t >= SPLITTER_FROM ? KIND.splitter : KIND.tank); }
      }
      if (this.eventTime <= 0) { this.event = null; this.announce("ACCALMIE", "Ramasse tes cristaux", "calm"); }
    }
    if (this.bossesKilled > 0 && !this.boss && !this.event && !this.calm) {
      this.extraMelee -= dt;
      if (this.extraMelee <= 0) { this.extraMelee = EXTRA_MELEE_EVERY; if (this.enemies.length < 80) this.spawnEnemy(KIND.melee); }
      this.extraGreen -= dt;
      if (this.extraGreen <= 0) {
        this.extraGreen = EXTRA_GREEN_EVERY + (this.rand() - 0.5) * 0.8;
        if (this.enemies.length < 80) this.spawnExtraGreen();
      }
    }
    this.spawn -= dt;
    if (this.spawn <= 0) {
      const quiet = this.calm && !this.event;
      if (!quiet && this.enemies.length < 80) this.spawnEnemy();
      const base = spawnInterval(t);
      this.spawn = (this.boss ? base * 1.7 : this.event ? base * 1.6 : base) / (this.room === 1 ? PIT_SPAWN_BOOST : 1);
    }
  }

  // ---------------------------------------------------------------- combat
  shoot(from: Matter.Vector, dx: number, dy: number, hostile: boolean, opts: Partial<Pick<Shot, "damage" | "pierce" | "ricochet" | "big">> & { speed?: number } = {}) {
    const len = Math.hypot(dx, dy) || 1, speed = opts.speed ?? (hostile ? 4 : 9);
    const vx = dx / len * speed, vy = dy / len * speed;
    const body = Bodies.circle(from.x + dx / len * 24, from.y + dy / len * 24, hostile ? 6 : 4, { isSensor: true, frictionAir: 0 });
    Composite.add(this.engine.world, body);
    const shot: Shot = { body, vx, vy, life: 2, hostile, damage: opts.damage ?? 1, pierce: opts.pierce ?? 0, ricochet: opts.ricochet ?? 0, hits: [], big: opts.big ?? false };
    this.shots.push(shot);
    return shot;
  }

  hurt() {
    if (this.invincible > 0 || this.dashTime > 0 || this.phase !== "playing") return;
    if (this.shieldReady) {
      this.shieldReady = false; this.shieldTimer = SHIELD_RECHARGE[this.levels.shield] ?? 20; this.invincible = 0.6;
      this.emit({ type: "shield", x: this.hero.position.x, y: this.hero.position.y });
      return;
    }
    this.hp--; this.invincible = 1;
    this.emit({ type: "hurt" });
    if (this.hp <= 0) this.phase = "over";
  }

  /** Area damage. Friendly blasts hit enemies; hostile ones also hit the hero. */
  explode(x: number, y: number, r: number, damage: number, hostile: boolean) {
    for (const e of this.enemies) {
      if (e.hp <= 0 || e.arriving > 0) continue;
      const d = Math.hypot(e.body.position.x - x, e.body.position.y - y);
      if (d < r + ENEMY_RADIUS[e.kind]) { e.hp -= damage; e.flash = 0.12; }
    }
    if (hostile && Math.hypot(this.hero.position.x - x, this.hero.position.y - y) < r) this.hurt();
    this.emit({ type: "explode", x, y, r, hostile });
  }

  orbPositions() {
    const n = this.levels.orbit, h = this.hero.position, out: { x: number; y: number }[] = [];
    for (let i = 0; i < n; i++) { const a = this.elapsed * 3 + i * Math.PI * 2 / n; out.push({ x: h.x + Math.cos(a) * 64, y: h.y + Math.sin(a) * 64 }); }
    return out;
  }

  private nearestEnemy(x: number, y: number, maxDist: number, skip: number[]) {
    let best: Enemy | undefined, bestD = maxDist;
    for (const e of this.enemies) {
      if (e.hp <= 0 || e.arriving > 0 || skip.includes(e.body.id)) continue;
      const d = Math.hypot(e.body.position.x - x, e.body.position.y - y);
      if (d < bestD) { best = e; bestD = d; }
    }
    return best;
  }

  private onDeath(e: Enemy) {
    const { x, y } = e.body.position;
    Composite.remove(this.engine.world, e.body);
    this.emit({ type: "death", x, y, kind: e.kind, mini: e.mini });
    if (e.detonated) return;
    this.kills++;
    if (this.kills % HEALTH_KILL_EVERY === 0 && !this.pickups.some(p => p.kind === "health")) this.pickups.push({ x, y, kind: "health" });
    if (!e.bombed && this.bombs < MAX_BOMBS && ++this.bombProgress >= BOMB_KILLS) { this.bombs++; this.bombProgress = 0; }
    const leech = LEECH_KILLS[this.levels.leech] ?? 0;
    if (leech && ++this.leechCount >= leech) { this.leechCount = 0; this.hp = Math.min(this.maxHp, this.hp + 1); }
    const value = GEM_VALUE[e.kind];
    if (value) this.gems.push({ x, y, value: value * (this.room === 1 ? PIT_XP : 1), pulled: false });
    if (this.levels.blast && e.kind !== KIND.boss) this.explode(x, y, 40 + 15 * this.levels.blast, this.levels.blast + Math.floor(this.damage / 2), false);
    if (e.kind === KIND.kamikaze) this.explode(x, y, 70, 2 + this.damage, false);
    if (e.kind === KIND.splitter) for (const side of [-1, 1]) this.addEnemy(KIND.melee, x + side * 16, y + side * 8, true);
    if (e.kind === KIND.boss) {
      this.boss = null; this.bossesKilled++;
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; this.gems.push({ x: x + Math.cos(a) * 40, y: y + Math.sin(a) * 40, value: 5, pulled: false }); }
      this.pickups.push({ x: x - 26, y, kind: "health" });
      if ((this.bossesKilled - 1) % BOSS_BOMB_EVERY === 0) this.pickups.push({ x: x + 26, y, kind: "bomb" });
      this.emit({ type: "bossDown", x, y });
      this.announce("BOSS VAINCU", "Butin au sol !", "win");
    }
  }

  private bossAI(e: Enemy, dt: number, dx: number, dy: number, d: number) {
    e.stateTime -= dt;
    const walkSpeed = 1.1 + 0.05 * this.bossIndex;
    if (e.state === "walk") {
      Body.setVelocity(e.body, { x: dx / d * walkSpeed, y: dy / d * walkSpeed });
      if (e.stateTime <= 0) {
        const r = this.rand();
        const crowded = this.enemies.length > 50;
        // The first boss only charges and summons: no projectiles yet.
        if (this.bossIndex <= 1) e.state = r < 0.55 || crowded ? "telegraph" : "summon";
        else e.state = r < 0.4 ? "telegraph" : r < 0.75 || crowded ? "fan" : "summon";
        e.stateTime = e.state === "telegraph" ? 0.75 : e.state === "fan" ? 1.1 : 0.8;
        e.aimDir = { x: dx / d, y: dy / d };
        e.shot = 0;
      }
    } else if (e.state === "telegraph") {
      Body.setVelocity(e.body, { x: 0, y: 0 });
      if (e.stateTime > 0.2) e.aimDir = { x: dx / d, y: dy / d };
      if (e.stateTime <= 0) { e.state = "charge"; e.stateTime = 0.55; }
    } else if (e.state === "charge") {
      Body.setVelocity(e.body, { x: e.aimDir.x * 9, y: e.aimDir.y * 9 });
      if (e.stateTime <= 0) { e.state = "walk"; e.stateTime = 2; }
    } else if (e.state === "fan") {
      Body.setVelocity(e.body, { x: 0, y: 0 });
      const volleys = e.stateTime < 0.5 ? 2 : 1;
      while (e.shot < volleys) {
        const n = 10 + 2 * Math.min(4, this.bossIndex - 1), off = e.shot * Math.PI / n;
        for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + off; this.shoot(e.body.position, Math.cos(a), Math.sin(a), true, { speed: 3.4 }); }
        e.shot++;
      }
      if (e.stateTime <= 0) { e.state = "walk"; e.stateTime = 2.2; }
    } else {
      Body.setVelocity(e.body, { x: 0, y: 0 });
      if (e.shot === 0) {
        for (let i = 0; i < 3 + Math.min(3, this.bossIndex - 1); i++) { const a = this.rand() * Math.PI * 2; this.addEnemy(KIND.melee, e.body.position.x + Math.cos(a) * 60, e.body.position.y + Math.sin(a) * 60); }
        e.shot = 1;
      }
      if (e.stateTime <= 0) { e.state = "walk"; e.stateTime = 2.4; }
    }
  }

  /** Gates are open unless they were just used or a boss is on the field. */
  get gatesOpen() { return this.gateLock <= 0 && !this.boss; }

  /** Position of the passage inside a room, and the direction pointing into the room. */
  gatePoint(room: number) { return room === 0 ? { x: WIDTH - 30, y: GATE_Y, inward: -1 } : { x: 30, y: GATE_Y, inward: 1 }; }

  /**
   * Moves the fight to another room. Crystals, kits and flames stay where they were,
   * but the enemies of the room you leave chase you: they reach the gate one after
   * another and come out of it in your new room. If you turn back before they arrive,
   * you run into them on the way.
   */
  switchRoom(target: number) {
    if (target === this.room || target < 0 || target >= ROOM_COVER.length) return;
    const world = this.engine.world, from = this.room;
    for (const e of this.enemies) Composite.remove(world, e.body);
    for (const sh of this.shots) Composite.remove(world, sh.body);
    for (const w of this.cover[from] ?? []) Composite.remove(world, w);
    // Those still in transit were heading out of the target room: they are met on arrival.
    const intercepted = this.followers.map(f => f.e);
    // Everyone left behind (bosses never leave their room) sets off after the hero.
    const exit = this.gatePoint(from);
    const chasers = this.enemies.filter(e => e.hp > 0 && e.kind !== KIND.boss).map(e => {
      const speed = e.kind === KIND.tank || e.kind === KIND.splitter ? 60 : 95;
      return { e, t: Math.min(FOLLOW_MAX_DELAY, FOLLOW_MIN_DELAY + Math.hypot(e.body.position.x - exit.x, e.body.position.y - exit.y) / speed) };
    }).sort((p, q) => p.t - q.t);
    for (let i = 1; i < chasers.length; i++) { const prev = chasers[i - 1], cur = chasers[i]; if (prev && cur) cur.t = Math.max(cur.t, prev.t + FOLLOW_GAP); }
    this.stash[from] = { enemies: [], gems: this.gems, pickups: this.pickups, fires: this.fires };
    const saved = this.stash[target];
    this.stash[target] = null;
    this.room = target;
    this.enemies = saved?.enemies ?? []; this.gems = saved?.gems ?? []; this.pickups = saved?.pickups ?? []; this.fires = saved?.fires ?? [];
    this.shots = []; this.geysers = []; this.geyserTimer = 2.5;
    const entry = this.gatePoint(target);
    for (const e of intercepted) Body.setPosition(e.body, { x: entry.x + entry.inward * (170 + this.rand() * 110), y: Math.min(HEIGHT - 40, Math.max(40, GATE_Y + (this.rand() - 0.5) * 220)) });
    this.enemies.push(...intercepted);
    for (const e of this.enemies) Composite.add(world, e.body);
    this.followers = chasers;
    const cover = this.cover[target] ?? [];
    Composite.add(world, cover);
    this.walls = [...this.outer, ...cover];
    // Arrive through the gate on the other side.
    const east = target > from;
    Body.setPosition(this.hero, { x: entry.x + entry.inward * 10, y: GATE_Y }); Body.setVelocity(this.hero, { x: 0, y: 0 });
    this.facing = { x: east ? 1 : -1, y: 0 }; this.dashTime = 0;
    this.invincible = Math.max(this.invincible, 1.2);
    this.gateLock = GATE_LOCK;
    if (!saved && !intercepted.length) for (let i = 0; i < 2; i++) this.spawnEnemy(undefined, east ? 1 : 0);
    const sub = chasers.length ? `${chasers.length} ennemi${chasers.length > 1 ? "s" : ""} te poursui${chasers.length > 1 ? "vent" : "t"}` : target === 1 ? "Cristaux ×2 · gare aux geysers" : "La herse se referme derrière toi";
    if (target === 1) this.announce("LA FOSSE ARDENTE", sub, "event");
    else this.announce("RETOUR À L’ARÈNE", sub, "calm");
    this.emit({ type: "room", room: target });
  }

  /** Brings followers out of the gate when their time comes. */
  private updateFollowers(dt: number) {
    if (!this.followers.length) return;
    for (const f of this.followers) f.t -= dt;
    const gate = this.gatePoint(this.room);
    while (this.followers[0] && this.followers[0].t <= 0) {
      const f = this.followers.shift(); if (!f) break;
      Body.setPosition(f.e.body, { x: gate.x + gate.inward * 4, y: GATE_Y + (this.rand() - 0.5) * 60 });
      Body.setVelocity(f.e.body, { x: gate.inward * 2.4, y: 0 });
      f.e.arriving = ARRIVE_TIME; f.e.fuse = -1; f.e.aim = -1;
      Composite.add(this.engine.world, f.e.body);
      this.enemies.push(f.e);
      this.emit({ type: "arrive", x: gate.x, y: GATE_Y });
    }
  }

  private updateGeysers(dt: number) {
    const d = difficultyAt(this.elapsed), h = this.hero.position;
    this.geyserTimer -= dt;
    if (this.geyserTimer <= 0) {
      this.geyserTimer = Math.max(1.8, 3.4 - d * 0.1);
      const n = Math.min(4, 2 + Math.floor(d / 4));
      for (let i = 0; i < n; i++) {
        // One geyser always lands close to the hero; the others anywhere.
        const x = i === 0 ? h.x + (this.rand() - 0.5) * 160 : 60 + this.rand() * (WIDTH - 120);
        const y = i === 0 ? h.y + (this.rand() - 0.5) * 120 : 60 + this.rand() * (HEIGHT - 120);
        this.geysers.push({ x: Math.min(WIDTH - 50, Math.max(50, x)), y: Math.min(HEIGHT - 50, Math.max(50, y)), r: GEYSER_R, t: GEYSER_WARN, burst: false });
      }
    }
    this.geysers = this.geysers.filter(g => {
      g.t -= dt;
      if (!g.burst && g.t <= 0) {
        g.burst = true; g.t = GEYSER_BURST;
        for (const e of this.enemies) if (e.hp > 0 && e.arriving <= 0 && Math.hypot(e.body.position.x - g.x, e.body.position.y - g.y) < g.r + ENEMY_RADIUS[e.kind]) { e.hp -= GEYSER_DAMAGE; e.flash = 0.15; }
        if (Math.hypot(h.x - g.x, h.y - g.y) < g.r) this.hurt();
        this.emit({ type: "geyser", x: g.x, y: g.y, r: g.r });
      }
      return !(g.burst && g.t <= 0);
    });
  }

  private keepInside(body: Matter.Body, r: number) {
    const { x, y } = body.position;
    const cx = Math.min(WIDTH - r, Math.max(r, x)), cy = Math.min(HEIGHT - r, Math.max(r, y));
    if (cx !== x || cy !== y) Body.setPosition(body, { x: cx, y: cy });
  }

  // ---------------------------------------------------------------- tick
  step(dt: number, input: { x: number; y: number }) {
    if (this.phase !== "playing" || this.menuOpen) return;
    this.bombFlash = Math.max(0, this.bombFlash - dt);
    this.bannerTime = Math.max(0, this.bannerTime - dt);
    if (this.bannerTime === 0) this.banner = null;
    this.elapsed += dt; this.invincible = Math.max(0, this.invincible - dt); this.dashCooldown = Math.max(0, this.dashCooldown - dt); this.dashTime = Math.max(0, this.dashTime - dt);
    if (this.levels.shield && !this.shieldReady) { this.shieldTimer -= dt; if (this.shieldTimer <= 0) this.shieldReady = true; }
    this.gateLock = Math.max(0, this.gateLock - dt);
    this.updateWaves(dt);
    this.updateFollowers(dt);

    // Hero movement
    const len = Math.hypot(input.x, input.y);
    if (len > 0.05) this.facing = { x: input.x / Math.max(1, len), y: input.y / Math.max(1, len) };
    const dir = this.dashTime > 0 ? this.facing : { x: input.x / Math.max(1, len), y: input.y / Math.max(1, len) };
    const heroSpeed = this.dashTime > 0 ? 11 : this.moveSpeed;
    Body.setVelocity(this.hero, { x: dir.x * heroSpeed, y: dir.y * heroSpeed });
    const h = this.hero.position;
    if (this.levels.trail && this.dashTime > 0) {
      this.trailDrop -= dt;
      if (this.trailDrop <= 0) { this.trailDrop = 0.035; const max = 1.5 + 0.5 * this.levels.trail; this.fires.push({ x: h.x, y: h.y, life: max, max }); }
    }

    // Enemy AI
    const difficulty = difficultyAt(this.elapsed);
    let nearest: Enemy | undefined, distance = Infinity;
    for (const e of this.enemies) {
      e.flash = Math.max(0, e.flash - dt); e.orbHit = Math.max(0, e.orbHit - dt); e.fireHit = Math.max(0, e.fireHit - dt);
      const dx = h.x - e.body.position.x, dy = h.y - e.body.position.y, d = Math.hypot(dx, dy) || 1;
      const blocked = Query.ray(this.walls, h, e.body.position).length > 0;
      if (d < distance && !blocked && e.arriving <= 0) { nearest = e; distance = d; }
      if (e.arriving > 0) { e.arriving = Math.max(0, e.arriving - dt); Body.setVelocity(e.body, { x: (e.body.position.x > WIDTH / 2 ? -1 : 1) * 2.4, y: 0 }); continue; }
      if (e.kind === KIND.boss) { this.bossAI(e, dt, dx, dy, d); continue; }
      let mx = dx / d, my = dy / d;
      // Detour around cover when a straight pursuit runs into it.
      if (Query.ray(this.walls, e.body.position, { x: e.body.position.x + mx * 65, y: e.body.position.y + my * 65 }).length) { const turn = e.body.id % 2 ? 1 : -1; mx = -dy / d * turn; my = dx / d * turn; }
      const runner = Math.min(3.0, 1.4 + difficulty * 0.11);
      const heavy = Math.min(2.0, 0.95 + difficulty * 0.07);
      let speed = runner;
      if (e.kind === KIND.melee) speed = e.mini ? runner * 1.15 : runner;
      else if (e.kind === KIND.tank) speed = heavy;
      else if (e.kind === KIND.splitter) speed = heavy * 1.1;
      else if (e.kind === KIND.drone) speed = d < 230 ? 0.2 : runner;
      else if (e.kind === KIND.kamikaze) {
        speed = Math.min(3.8, 2.2 + difficulty * 0.1);
        if (e.fuse < 0 && d < 70) e.fuse = 0.65;
        if (e.fuse >= 0) {
          speed = 0.4; e.fuse -= dt;
          if (e.fuse <= 0) { e.detonated = true; e.hp = 0; this.explode(e.body.position.x, e.body.position.y, 75, 3, true); }
        }
      } else if (e.kind === KIND.sniper) {
        if (e.aim >= 0) speed = 0;
        else if (d < 300) { speed = 1.2; mx = -mx; my = -my; }
        else if (d > 420) speed = 1.4;
        else { const turn = e.body.id % 2 ? 1 : -1; mx = -dy / d * turn; my = dx / d * turn; speed = 0.6; }
      }
      Body.setVelocity(e.body, { x: mx * speed, y: my * speed });
      if (e.kind === KIND.drone) { e.shot -= dt; if (e.shot <= 0 && !blocked) { this.shoot(e.body.position, dx, dy, true); e.shot = Math.max(0.7, 2 - difficulty * 0.09); } }
      if (e.kind === KIND.sniper) {
        if (e.aim < 0) { e.shot -= dt; if (e.shot <= 0 && !blocked && d < 560) { e.aim = 1.0; e.aimDir = { x: dx / d, y: dy / d }; } }
        else {
          if (e.aim > 0.25) e.aimDir = { x: dx / d, y: dy / d };
          e.aim -= dt;
          if (e.aim <= 0) { this.shoot(e.body.position, e.aimDir.x, e.aimDir.y, true, { speed: 11, big: true }); e.aim = -1; e.shot = Math.max(2, 3.2 - difficulty * 0.08); }
        }
      }
    }

    // Hero fire: auto-aim, with spread, pierce and ricochet from upgrades.
    this.fire -= dt;
    if (nearest && this.fire <= 0) {
      const dx = nearest.body.position.x - h.x, dy = nearest.body.position.y - h.y;
      this.aim = { x: dx / (distance || 1), y: dy / (distance || 1) };
      const count = 1 + this.levels.multi, base = Math.atan2(dy, dx), spread = 0.16;
      for (let i = 0; i < count; i++) {
        const a = base + (i - (count - 1) / 2) * spread;
        this.shoot(h, Math.cos(a), Math.sin(a), false, { damage: this.damage, pierce: this.levels.pierce, ricochet: this.levels.ricochet });
      }
      this.fire = this.fireRate;
    }

    // Orbs & fire patches
    const orbs = this.orbPositions(), orbDamage = 1 + Math.floor(this.damage / 2);
    for (const o of orbs) for (const e of this.enemies) {
      if (e.hp <= 0 || e.orbHit > 0 || e.arriving > 0) continue;
      if (Math.hypot(e.body.position.x - o.x, e.body.position.y - o.y) < 14 + ENEMY_RADIUS[e.kind]) { e.hp -= orbDamage; e.orbHit = 0.45; e.flash = 0.1; this.emit({ type: "hit", x: e.body.position.x, y: e.body.position.y, amount: orbDamage }); }
    }
    this.fires = this.fires.filter(f => {
      f.life -= dt;
      for (const e of this.enemies) {
        if (e.hp <= 0 || e.fireHit > 0 || e.arriving > 0) continue;
        if (Math.hypot(e.body.position.x - f.x, e.body.position.y - f.y) < 22 + ENEMY_RADIUS[e.kind]) { const dmg = 1 + this.levels.trail; e.hp -= dmg; e.fireHit = 0.35; e.flash = 0.1; this.emit({ type: "hit", x: e.body.position.x, y: e.body.position.y, amount: dmg }); }
      }
      return f.life > 0;
    });

    if (this.room === 1) this.updateGeysers(dt);
    for (const s of this.shots) Body.setVelocity(s.body, { x: s.vx, y: s.vy });
    Engine.update(this.engine, dt * 1000);
    // Crowd pressure or a boss charge can squeeze bodies through the outer walls: keep everyone inside.
    this.keepInside(this.hero, 15);
    for (const e of this.enemies) this.keepInside(e.body, e.mini ? 10 : ENEMY_RADIUS[e.kind]);

    // Contact damage
    for (const e of this.enemies) if (e.hp > 0 && e.arriving <= 0 && Math.hypot(e.body.position.x - h.x, e.body.position.y - h.y) < ENEMY_RADIUS[e.kind] + 15) this.hurt();

    // Shots
    this.shots = this.shots.filter(s => {
      s.life -= dt;
      let remove = s.life <= 0 || Query.collides(s.body, this.walls).length > 0;
      if (!remove && s.hostile && Math.hypot(s.body.position.x - h.x, s.body.position.y - h.y) < (s.big ? 19 : 21)) { this.hurt(); remove = true; }
      if (!remove && !s.hostile) {
        const p = s.body.position;
        const hit = this.enemies.find(e => e.hp > 0 && e.arriving <= 0 && !s.hits.includes(e.body.id) && Math.hypot(e.body.position.x - p.x, e.body.position.y - p.y) < ENEMY_RADIUS[e.kind] + 5);
        if (hit) {
          hit.hp -= s.damage; hit.flash = 0.1; s.hits.push(hit.body.id);
          this.emit({ type: "hit", x: p.x, y: p.y, amount: s.damage });
          if (s.pierce > 0) s.pierce--;
          else if (s.ricochet > 0) {
            const next = this.nearestEnemy(p.x, p.y, 260, s.hits);
            if (next) { s.ricochet--; s.life = 1; const dx = next.body.position.x - p.x, dy = next.body.position.y - p.y, l = Math.hypot(dx, dy) || 1; s.vx = dx / l * 9; s.vy = dy / l * 9; }
            else remove = true;
          } else remove = true;
        }
      }
      if (remove) Composite.remove(this.engine.world, s.body);
      return !remove;
    });

    // Deaths (explosions may chain into the next frame)
    const dead = this.enemies.filter(e => e.hp <= 0);
    if (dead.length) { this.enemies = this.enemies.filter(e => e.hp > 0); for (const e of dead) this.onDeath(e); }

    // Gems: magnet pull, then collect
    const magnet = this.magnetRadius;
    this.gems = this.gems.filter(g => {
      const dx = h.x - g.x, dy = h.y - g.y, d = Math.hypot(dx, dy) || 1;
      if (d < magnet) g.pulled = true;
      if (g.pulled) { const pull = Math.min(d, 9 * dt * 60); g.x += dx / d * pull; g.y += dy / d * pull; }
      if (d > 20) return true;
      this.xp += g.value;
      this.emit({ type: "pickup", x: g.x, y: g.y, kind: "gem" });
      return false;
    });
    if (this.gems.length > 160) {
      // Merge the oldest gems so long runs stay light.
      const old = this.gems.splice(0, 40), value = old.reduce((a, g) => a + g.value, 0), first = old[0];
      if (first) this.gems.unshift({ x: first.x, y: first.y, value, pulled: false });
    }

    this.pickups = this.pickups.filter(p => {
      if (Math.hypot(p.x - h.x, p.y - h.y) > 28) return true;
      // A bomb on the ground waits there while your hands are full.
      if (p.kind === "bomb" && this.bombs >= MAX_BOMBS) return true;
      if (p.kind === "health") this.hp = Math.min(this.maxHp, this.hp + 1);
      if (p.kind === "bomb") this.bombs = Math.min(MAX_BOMBS, this.bombs + 1);
      if (p.kind !== "energy") this.emit({ type: "pickup", x: p.x, y: p.y, kind: p.kind });
      return false;
    });

    // Walking into the open gate leads to the other room.
    if (this.phase === "playing" && this.gatesOpen && Math.abs(h.y - GATE_Y) < GATE_HALF) {
      if (this.room === 0 && h.x > WIDTH - 18) this.switchRoom(1);
      else if (this.room === 1 && h.x < 18) this.switchRoom(0);
    }
    this.score = Math.floor((this.elapsed + 1e-9) / SCORE_SECONDS);
    if (this.phase === "playing" && this.xp >= this.xpNext) {
      this.xp -= this.xpNext; this.level++; this.xpNext = xpFor(this.level);
      this.rollChoices();
      this.emit({ type: "levelup", x: h.x, y: h.y });
      this.phase = "upgrade";
    }
  }

  dispose() { Composite.clear(this.engine.world, false); Engine.clear(this.engine); }
}
