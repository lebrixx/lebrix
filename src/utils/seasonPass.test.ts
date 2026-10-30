import { beforeEach, expect, it, vi } from 'vitest';
import {
  claimDailyQuestReward,
  getDiamonds,
  getSeasonPassData,
  hasDailyQuestReward,
  updateQuestBoostUsed,
  updateQuestScore,
} from './seasonPass';

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });
});

it('donne 1 diamant à réclamer pour chaque quête du jour, une à une', () => {
  updateQuestScore(25);
  expect(hasDailyQuestReward()).toBe(true);
  expect(claimDailyQuestReward()).toBe(1);
  expect(getDiamonds()).toBe(1);
  // La quête boost reste à récupérer
  expect(hasDailyQuestReward()).toBe(false);
  updateQuestBoostUsed();
  expect(hasDailyQuestReward()).toBe(true);
  expect(claimDailyQuestReward()).toBe(1);
  expect(getDiamonds()).toBe(2);
  // Rien de plus à réclamer aujourd'hui
  expect(hasDailyQuestReward()).toBe(false);
  expect(claimDailyQuestReward()).toBe(0);
  expect(getDiamonds()).toBe(2);
  expect(getSeasonPassData().totalDiamondsEarned).toBe(2);
});

it('donne 2 diamants quand les 2 quêtes sont réclamées en une fois', () => {
  updateQuestScore(20);
  updateQuestBoostUsed();
  expect(claimDailyQuestReward()).toBe(2);
  expect(getDiamonds()).toBe(2);
  expect(hasDailyQuestReward()).toBe(false);
});

it('ne donne rien tant qu\'aucune quête n\'est complétée', () => {
  expect(hasDailyQuestReward()).toBe(false);
  expect(claimDailyQuestReward()).toBe(0);
  expect(getDiamonds()).toBe(0);
});
