import { describe, expect, it } from "vitest";
import { ANIMALS, assignAnimals, randomAnimal } from "./animals";

describe("automatic animal at launch", () => {
  it("can select each of the six animals from the random draw", () => {
    expect(Array.from({ length: 6 }, (_, i) => randomAnimal(() => (i + 0.5) / 6)))
      .toEqual(["dog", "kitty", "tiger", "horse", "deer", "pinguin"]);
  });
  it("gives six different valid animals even when all launch draws match", () => {
    const assigned = assignAnimals(Array.from({ length: 6 }, (_, i) => ({ id: `player${i}`, wants: randomAnimal(() => 0.5) })));
    expect(Object.values(assigned).sort()).toEqual(ANIMALS.map((a) => a.id).sort());
  });
});

describe("assignAnimals", () => {
  it("never gives the same animal twice in a room", () => {
    const a = assignAnimals(Array.from({ length: 6 }, (_, i) => ({ id: `p${i}`, wants: "dog" })));
    expect(new Set(Object.values(a)).size).toBe(6);
  });
  it("the earliest joiner keeps a contested animal", () => {
    const a = assignAnimals([{ id: "first", wants: "tiger" }, { id: "late", wants: "tiger" }]);
    expect(a["first"]).toBe("tiger");
    expect(a["late"]).not.toBe("tiger");
  });
});
