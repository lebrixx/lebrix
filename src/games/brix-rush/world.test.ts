import { describe, it, expect } from "vitest";
import { laneAt, carsAt, MAX_PLAYERS, SAFE_START, FREE_GREEN_UNTIL, MIN_ROADS_BETWEEN_GREEN } from "./world";

describe("world", () => {
  it("rooms hold at most 6 players", () => expect(MAX_PLAYERS).toBe(6));
  it("same room code gives everyone the same lanes and traffic", () => {
    expect(laneAt("ABCD", 12)).toEqual(laneAt("ABCD", 12));
    expect(carsAt(laneAt("ABCD", 12), 3.5)).toEqual(carsAt(laneAt("ABCD", 12), 3.5));
  });
  it("starting zone is safe so everyone starts together", () => {
    for (let c = 0; c < SAFE_START; c++) expect(laneAt("ABCD", c).safe).toBe(true);
  });
  it("traffic stays easy enough to slip through, even far along", () => {
    for (let col = SAFE_START; col < 400; col++) {
      const lane = laneAt("ABCD", col);
      if (lane.safe === true) continue;
      // cars never run away from the player
      expect(lane.speed).toBeLessThanOrEqual(180);
      // always a real gap to slip between two cars
      expect(lane.period - lane.carLen * 40).toBeGreaterThanOrEqual(176);
    }
  });
  it("rest strips are rarer now, but never vanish", () => {
    let safe = 0;
    for (let col = SAFE_START; col < 40; col++) if (laneAt("ABCD", col).safe) safe++;
    expect(safe).toBeGreaterThanOrEqual(5);
    expect(safe).toBeLessThanOrEqual(18);
  });
  it("green strips never touch once past score 12", () => {
    for (let col = FREE_GREEN_UNTIL + 1; col < 300; col++) {
      expect(laneAt("ABCD", col).safe && laneAt("ABCD", col - 1).safe).toBe(false);
    }
  });
  it("at least 4 roads between green strips once past score 12", () => {
    let roads = 0;
    for (let col = SAFE_START; col < 300; col++) {
      if (!laneAt("ABCD", col).safe) roads++;
      else {
        if (col > FREE_GREEN_UNTIL) expect(roads).toBeGreaterThanOrEqual(MIN_ROADS_BETWEEN_GREEN);
        roads = 0;
      }
    }
  });
  it("the first strips may still bunch up", () => {
    expect(laneAt("K7MQ", 4).safe).toBe(true);
    expect(laneAt("K7MQ", 5).safe).toBe(true);
  });
});

import { fencesAt, MAX_FENCES_PER_GREEN, SAFE_START as SS, laneAt as la } from "./world";
describe("fences", () => {
  it("green strips hold at most 2 fences, roads and start none", () => {
    for (let col = 0; col < 400; col++) {
      const f = fencesAt("FENCE", col);
      expect(f.length).toBeLessThanOrEqual(MAX_FENCES_PER_GREEN);
      if (col < SS || !la("FENCE", col).safe) expect(f).toEqual([]);
    }
  });
});
