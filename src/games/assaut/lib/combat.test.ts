import { expect, it } from "vitest";
import { applyBombDamage, defeatReward } from "./combat";

it("bomb kills award zero points and never advance the third-kill score", () => {
  for (const kind of ["drone", "zig", "tank", "shooter", "boss"]) {
    const enemy = { kind, hp: kind === "boss" ? 25 : 10 };
    applyBombDamage(enemy);
    expect(enemy.hp).toBeLessThanOrEqual(0);
    expect(defeatReward(enemy, 2)).toEqual({ kills: 2, points: 0 });
  }
  expect(defeatReward({ kind: "drone", hp: 0 }, 2)).toEqual({ kills: 3, points: 2 });
});

it("a surviving boss hit by a bomb remains eligible for a later normal kill", () => {
  const boss = { kind: "boss", hp: 95 };
  applyBombDamage(boss);
  expect(boss.hp).toBe(70);
  expect(defeatReward(boss, 2)).toEqual({ kills: 2, points: 0 });
  boss.hp = 0;
  expect(defeatReward(boss, 2)).toEqual({ kills: 2, points: 3 });
});