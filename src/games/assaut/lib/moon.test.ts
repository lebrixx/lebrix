import { describe, expect, it } from "vitest";
import { moonPass } from "./moon";

describe("moon obstacle", () => {
  it("is absent before 10 s", () => expect(moonPass(9.9, 420, 800)).toBeNull());
  it("starts fully above the screen at 10 s", () => { const m = moonPass(10, 420, 800)!; expect(m.y + m.r).toBeLessThan(0); });
  it("keeps its huge size", () => { const m = moonPass(14, 420, 800)!; expect(m.r).toBeCloseTo(420 * 0.54, 5); });
  it("leaves the left half free and runs off the right edge", () => {
    const m = moonPass(14, 420, 800)!;
    expect(m.x - m.r).toBeGreaterThanOrEqual(420 * 0.5);
    expect(m.x + m.r).toBeGreaterThan(420);
  });
  it("falls once only and never comes back", () => {
    for (const t of [70, 130, 190, 250]) {
      expect(moonPass(t, 393, 742)).toBeNull();
    }
  });
});
