import { describe, expect, it } from "vitest";
import { BOSS_EVERY, bossDue, bossStats, bossVolley, canSpawnRegular, difficulty, nextBossTime, pickKind, retainEnemiesWithBoss, shooterCooldown, TANK_START, tankDelay, tankDue } from "./difficulty";

describe("difficulté progressive", () => {
  it('retarde uniquement le deuxième boss de 15 secondes supplémentaires', () => {
    expect(nextBossTime(53, 1)).toBe(103);
    expect(bossDue(102.99, nextBossTime(53, 1), false)).toBe(false);
    expect(bossDue(103, nextBossTime(53, 1), false)).toBe(true);
    expect(nextBossTime(120, 2)).toBe(155);
    expect(nextBossTime(180, 3)).toBe(215);
  });
  it("fait arriver les tireurs dès 10 secondes", () => {
    expect(difficulty(9).weights.shooter).toBe(0);
    expect(difficulty(10).weights.shooter).toBeGreaterThan(0);
  });
  it("ralentit les tirs des tireurs", () => {
    expect(shooterCooldown(10)).toBeGreaterThan(2.9);
    expect(shooterCooldown(1000)).toBe(2.4);
  });
  it("attend 35 secondes après la mort du boss sans superposition", () => {
    expect(BOSS_EVERY).toBe(35);
    expect(bossDue(34.99, 35, false)).toBe(false);
    expect(bossDue(35, 35, false)).toBe(true);
    expect(nextBossTime(35)).toBe(70);
    expect(bossDue(70, 70, true)).toBe(false);
    expect(bossDue(70, 70, false)).toBe(true);
    expect(nextBossTime(53)).toBe(88);
    expect(bossDue(87.99, nextBossTime(53), false)).toBe(false);
    expect(bossDue(88, nextBossTime(53), false)).toBe(true);
  });
  it("augmente les petits avions rouges dès le début avec des groupes", () => {
    expect(difficulty(0).groupChance).toBe(0.2);
    expect(difficulty(5).groupChance).toBeGreaterThanOrEqual(0.2);
  });
  it("garde les avions présents à l’arrivée du boss", () => {
    const aircraft = { kind: 'shooter', hp: 5 };
    const boss = { kind: 'boss', hp: 95 };
    const enemies = retainEnemiesWithBoss([aircraft], boss);
    expect(enemies).toEqual([aircraft, boss]);
    expect(enemies[0]).toBe(aircraft);
  });
  it("interdit les nouvelles apparitions d’avions pendant un boss", () => {
    expect(canSpawnRegular(true)).toBe(false);
    expect(canSpawnRegular(false)).toBe(true);
  });
  it("rend chaque boss plus résistant et plus difficile", () => {
    for (let rank = 1; rank < 20; rank++) {
      expect(bossStats(rank + 1).hp).toBeGreaterThan(bossStats(rank).hp);
      expect(bossStats(rank + 1).speed).toBeGreaterThanOrEqual(bossStats(rank).speed);
    }
    expect(bossStats(2).cooldown).toBeLessThan(bossStats(1).cooldown);
    for (let rank = 1; rank < 6; rank++) expect(bossStats(rank + 1).cooldown).toBeLessThan(bossStats(rank).cooldown);
  });
  it("renforce le boss 2 : plus de vie et des tirs plus rapides", () => {
    expect(bossStats(2).hp).toBe(175);
    expect(bossStats(2).speed).toBe(163);
    expect(bossStats(2).cooldown).toBeCloseTo(1.0239);
    expect(bossStats(2).count).toBe(7);
    expect(bossStats(2).hp).toBeGreaterThan(bossStats(1).hp);
    expect(bossStats(3).hp).toBeGreaterThan(bossStats(2).hp);
  });
  it("varie les attaques sur cinq motifs distincts", () => {
    const patterns = new Set();
    for (const age of [1, 4.5, 8, 11.5, 15]) {
      const volley = bossVolley(1, age, false, Math.PI / 2);
      patterns.add(volley.pattern);
      expect(volley.velocities.length).toBeGreaterThan(1);
      expect(new Set(volley.velocities.map(v => v.vx)).size).toBeGreaterThan(1);
    }
    expect(patterns.size).toBe(5);
  });
  it("renforce tous les motifs dès le premier boss et rapproche les salves", () => {
    for (const age of [1, 4.5, 8, 11.5, 15]) {
      const volley = bossVolley(1, age, true, Math.PI / 2);
      expect(volley.cooldown).toBeCloseTo(0.9775);
      expect(volley.velocities.length).toBeGreaterThanOrEqual(5);
      expect(Math.hypot(volley.velocities[0]?.vx ?? 0, volley.velocities[0]?.vy ?? 0)).toBeCloseTo(145);
      for(let rank=1;rank<30;rank++) {
        const current=bossVolley(rank,age,false,Math.PI/2), next=bossVolley(rank+1,age,false,Math.PI/2);
        expect(next.cooldown).toBeLessThan(current.cooldown);
        expect(next.velocities.length).toBeGreaterThanOrEqual(current.velocities.length);
      }
    }
    for(const velocity of bossVolley(1,8,false,Math.PI/2).velocities) expect(Math.abs(Math.atan2(velocity.vy,velocity.vx)-Math.PI/2)).toBeGreaterThanOrEqual(0.39);
  });
  it("les apparitions s'accélèrent avec le temps", () => {
    expect(difficulty(0).interval).toBeGreaterThan(difficulty(180).interval);
  });
  it("au début seuls les drones apparaissent", () => {
    expect(pickKind(5, 0.99)).toBe("drone");
  });
  it("fait arriver un blindé seul toutes les 6 à 10 secondes dès 40s", () => {
    expect(TANK_START).toBe(40);
    expect(tankDelay(0)).toBe(6);
    expect(tankDelay(0.5)).toBe(8);
    expect(tankDelay(1)).toBe(10);
    expect(difficulty(200).weights).not.toHaveProperty("tank");
    for (const r of [0, 0.5, 0.999]) expect(pickKind(200, r)).not.toBe("tank");
    expect(tankDue(39.9, 0, false)).toBe(false);
    expect(tankDue(40, 0, false)).toBe(true);
    expect(tankDue(60, 0, true)).toBe(false);
    expect(tankDue(60, 0.01, false)).toBe(false);
    expect(tankDue(60, 0, false)).toBe(true);
  });
});
