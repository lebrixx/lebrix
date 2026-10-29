type CombatEnemy = { kind: string; hp: number; bombKill?: boolean };

export function applyBombDamage(enemy: CombatEnemy) {
  if (enemy.hp <= 0) return;
  enemy.hp -= enemy.kind === "boss" ? 25 : 999;
  if (enemy.hp <= 0) enemy.bombKill = true;
}

export function defeatReward(enemy: CombatEnemy, kills: number) {
  if (enemy.hp > 0 || enemy.bombKill) return { kills, points: 0 };
  if (enemy.kind === "boss") return { kills, points: 3 };
  const next = kills + 1;
  return { kills: next, points: next % 3 === 0 ? 2 : 0 };
}