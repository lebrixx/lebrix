import Matter from "matter-js";
const { Engine, Bodies, Body, Composite, Query } = Matter;
export const WIDTH = 1000, HEIGHT = 620;
export type Upgrade = "power" | "speed" | "health";
export type Enemy = { body: Matter.Body; hp: number; kind: number; shot: number };
type Shot = { body: Matter.Body; vx: number; vy: number; life: number; hostile: boolean };
export type Pickup = { x: number; y: number; kind: "health" | "energy" };
export type Phase = "ready" | "playing" | "paused" | "upgrade" | "over";
export const SCORE_SECONDS = 3;
export const UPGRADE_POINTS = 10;
export const HEALTH_KILL_EVERY = 20;
// Progressive curve: firm ramp for the first 45 s, then the base growth drops
// to about a quarter of that speed so the climb never runs away. The 30 s steps
// keep nudging it upward, and long runs still end up at the maximum pressure.
const FIRM_SECONDS = 45; // full-speed window before the climb softens
const FIRM_RATE = 0.05; // difficulty gained per second while firm
const SOFT_RATE = 0.014; // difficulty gained per second after 45 s
const STEP_EVERY = 0.3; // extra bump on top, one every 30 s
export const difficultyAt = (seconds: number) => seconds <= FIRM_SECONDS
  ? seconds * FIRM_RATE + Math.floor(seconds / 30) * STEP_EVERY
  : FIRM_SECONDS * FIRM_RATE + (seconds - FIRM_SECONDS) * SOFT_RATE + Math.floor(seconds / 30) * STEP_EVERY;
// Per-minute health gains level off instead of climbing forever: +1/min for
// tanks for the first 3 minutes then half as fast, +1 per 2 min for the small
// enemies for 4 minutes then a third as fast.
export const hpMinutesTank = (minutes: number) => minutes <= 3 ? minutes : 3 + Math.floor((minutes - 3) / 2);
export const hpMinutesSmall = (minutes: number) => minutes <= 4 ? Math.floor(minutes / 2) : 2 + Math.floor((minutes - 4) / 3);
export const spawnInterval = (seconds: number) => Math.max(0.16, 0.9 - difficultyAt(seconds) * 0.13);
export function enemyKindAt(seconds: number, roll: number) {
  const difficulty = difficultyAt(seconds);
  const shooterChance = Math.min(0.45, 0.12 + difficulty * 0.045);
  const tankChance = (Math.min(0.72, 0.32 + difficulty * 0.05) - shooterChance) * (seconds >= 20 * SCORE_SECONDS ? 0.75 : 1);
  return roll < shooterChance ? 2 : roll < shooterChance + tankChance ? 1 : 0;
}
export class ArenaWorld {
  engine = Engine.create({ gravity: { x: 0, y: 0 } });
  hero = Bodies.circle(WIDTH / 2, HEIGHT / 2, 15, { frictionAir: 0, inertia: Infinity, label: "hero" });
  walls: Matter.Body[] = [];
  enemies: Enemy[] = [];
  shots: Shot[] = [];
  pickups: Pickup[] = [];
  phase: Phase = "ready";
  hp = 5; maxHp = 5; score = 0; kills = 0; nextUpgrade = UPGRADE_POINTS;
  damage = 1; fireRate = 0.44; moveSpeed = 3.3;
  dashCooldown = 0; dashTime = 0; invincible = 0;
  facing = { x: 1, y: 0 }; aim = { x: 1, y: 0 };
  fire = 0; spawn = 0; elapsed = 0;
  bombs = 2;
  bombFlash = 0;
  menuOpen = false;
  private menuPhase: Phase = "ready";
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
  bomb() {
    if (this.phase !== "playing" || this.menuOpen || this.bombs <= 0) return false;
    this.bombs--;
    this.bombFlash = 0.5;
    for (const enemy of this.enemies) enemy.hp = 0;
    this.shots = this.shots.filter(shot => {
      if (!shot.hostile) return true;
      Composite.remove(this.engine.world, shot.body);
      return false;
    });
    return true;
  }
  constructor() {
    const rects = [[500,-20,1040,40],[500,640,1040,40],[-20,310,40,620],[1020,310,40,620],[260,200,150,34],[740,420,150,34],[250,440,34,90],[750,180,34,90]];
    this.walls = rects.map(([x,y,w,h]) => Bodies.rectangle(x ?? 0,y ?? 0,w ?? 0,h ?? 0,{ isStatic: true, label: "wall" }));
    Composite.add(this.engine.world, [this.hero, ...this.walls]);
  }
  start() { this.phase = "playing"; for (let i=0;i<5;i++) this.spawnEnemy(); this.spawn = spawnInterval(0); }
  dash() {
    if (this.phase !== "playing" || this.dashCooldown > 0) return false;
    this.dashTime = 0.2; this.dashCooldown = 2.5; this.invincible = Math.max(this.invincible, 0.3); return true;
  }
  upgrade(choice: Upgrade) {
    if (this.phase !== "upgrade") return;
    if (choice === "power") this.damage++;
    if (choice === "speed") this.fireRate = Math.max(0.12, this.fireRate * 0.8);
    if (choice === "health") { this.maxHp++; this.hp = Math.min(this.maxHp, this.hp + 3); }
    this.phase = "playing";
  }
  spawnEnemy() {
    const edge = Math.floor(Math.random() * 4);
    const x = edge === 0 ? 35 : edge === 1 ? WIDTH-35 : 50 + Math.random() * (WIDTH-100);
    const y = edge === 2 ? 35 : edge === 3 ? HEIGHT-35 : 50 + Math.random() * (HEIGHT-100);
    const difficulty = difficultyAt(this.elapsed), roll = Math.random();
    // Health also steps up a bit every full minute survived, then slows down.
    const minutes = Math.floor(this.elapsed / 60);
    const kind = enemyKindAt(this.elapsed, roll);
    const body = Bodies.circle(x,y,kind === 1 ? 20 : 14,{ frictionAir: 0, inertia: Infinity, label: "enemy" });
    this.enemies.push({body,hp: kind === 1 ? 4 + Math.floor(difficulty/2) + hpMinutesTank(minutes) : 1 + Math.floor(difficulty/3) + hpMinutesSmall(minutes),kind,shot: 1});
    Composite.add(this.engine.world,body);
  }
  shoot(from: Matter.Vector, dx: number, dy: number, hostile: boolean) {
    const len = Math.hypot(dx,dy) || 1, vx = dx/len * (hostile ? 4 : 9), vy = dy/len * (hostile ? 4 : 9);
    const body = Bodies.circle(from.x + dx/len * 24, from.y + dy/len * 24, hostile ? 6 : 4,{ isSensor: true, frictionAir: 0 });
    Composite.add(this.engine.world,body); this.shots.push({body,vx,vy,life: 2,hostile});
  }
  hurt() { if (this.invincible > 0 || this.dashTime > 0) return; this.hp--; this.invincible = 1; if (this.hp <= 0) this.phase = "over"; }
  step(dt: number, input: { x: number; y: number }) {
    if (this.phase !== "playing" || this.menuOpen) return;
    this.bombFlash = Math.max(0, this.bombFlash - dt);
    this.elapsed += dt; this.invincible = Math.max(0,this.invincible-dt); this.dashCooldown = Math.max(0,this.dashCooldown-dt); this.dashTime = Math.max(0,this.dashTime-dt);
    const len = Math.hypot(input.x,input.y);
    if (len > 0.05) this.facing = { x: input.x / Math.max(1,len), y: input.y / Math.max(1,len) };
    const dir = this.dashTime > 0 ? this.facing : {x:input.x/Math.max(1,len),y:input.y/Math.max(1,len)};
    Body.setVelocity(this.hero,{x:dir.x*(this.dashTime > 0 ? 11 : this.moveSpeed),y:dir.y*(this.dashTime > 0 ? 11 : this.moveSpeed)});
    this.spawn -= dt;
    if (this.spawn <= 0) { if(this.enemies.length<80) this.spawnEnemy(); this.spawn = spawnInterval(this.elapsed); }
    const h = this.hero.position;
    let nearest: Enemy | undefined, distance = Infinity;
    for (const e of this.enemies) {
      const dx = h.x-e.body.position.x, dy=h.y-e.body.position.y, d=Math.hypot(dx,dy) || 1;
      const blocked = Query.ray(this.walls,h,e.body.position).length > 0;
      if (d < distance && !blocked) { nearest=e; distance=d; }
      let mx=dx/d, my=dy/d;
      // Detour around cover when a straight pursuit runs into it.
      if (Query.ray(this.walls,e.body.position,{x:e.body.position.x+mx*65,y:e.body.position.y+my*65}).length) { const turn = e.body.id % 2 ? 1 : -1; mx=-dy/d*turn; my=dx/d*turn; }
      const difficulty = difficultyAt(this.elapsed);
      const speed = e.kind === 1 ? Math.min(2.0,0.95+difficulty*0.07) : e.kind === 2 && d < 230 ? 0.2 : Math.min(3.0,1.4+difficulty*0.11);
      Body.setVelocity(e.body,{x:mx*speed,y:my*speed});
      if (e.kind === 2) { e.shot -= dt; if (e.shot <= 0 && !blocked) { this.shoot(e.body.position,dx,dy,true); e.shot=Math.max(0.7,2-difficulty*0.09); } }
    }
    this.fire -= dt;
    if (nearest && this.fire <= 0) { const dx=nearest.body.position.x-h.x, dy=nearest.body.position.y-h.y; this.aim={x:dx/(distance || 1),y:dy/(distance || 1)}; this.shoot(h,dx,dy,false); this.fire=this.fireRate; }
    for (const s of this.shots) Body.setVelocity(s.body,{x:s.vx,y:s.vy});
    Engine.update(this.engine,dt*1000);
    for (const e of this.enemies) if (Math.hypot(e.body.position.x-h.x,e.body.position.y-h.y) < (e.kind === 1 ? 34 : 29)) this.hurt();
    this.shots = this.shots.filter(s => {
      s.life -= dt;
      let remove=s.life <= 0 || Query.collides(s.body,this.walls).length > 0;
      if (!remove && s.hostile && Math.hypot(s.body.position.x-h.x,s.body.position.y-h.y)<21) { this.hurt(); remove=true; }
      if (!remove && !s.hostile) {
        const hit=this.enemies.find(e => e.hp > 0 && Math.hypot(e.body.position.x-s.body.position.x,e.body.position.y-s.body.position.y)<(e.kind === 1 ? 25 : 19));
        if (hit) { hit.hp -= this.damage; remove=true; }
      }
      if (remove) Composite.remove(this.engine.world,s.body); return !remove;
    });
    this.enemies = this.enemies.filter(e => {
      if (e.hp > 0) return true;
      this.kills++;
      if(this.kills%HEALTH_KILL_EVERY===0 && !this.pickups.some(p => p.kind === "health")) this.pickups.push({x:e.body.position.x,y:e.body.position.y,kind:"health"});
      Composite.remove(this.engine.world,e.body); return false;
    });
    this.pickups=this.pickups.filter(p => { if (Math.hypot(p.x-h.x,p.y-h.y)>28) return true; if(p.kind==="health") this.hp=Math.min(this.maxHp,this.hp+1); return false; });
    this.score = Math.floor((this.elapsed + 1e-9) / SCORE_SECONDS);
    if (this.phase === "playing" && this.score >= this.nextUpgrade) { this.nextUpgrade += UPGRADE_POINTS; this.phase="upgrade"; }
  }
  dispose() { Composite.clear(this.engine.world,false); Engine.clear(this.engine); }
}