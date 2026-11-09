import { expect, it } from "vitest";
import { HERO_LOOP, heroPose } from "./hero-pose";
it("idles facing the camera with arms moving outward only", () => {
  for (let t = 0; t < HERO_LOOP * 2; t += 0.05) { const p = heroPose(t); expect(p.armL).toBeGreaterThanOrEqual(0); expect(p.armR).toBeGreaterThanOrEqual(0); expect(p.armL).toBeLessThan(0.6); expect(p.armR).toBeLessThan(0.6); }
  expect(heroPose(1).row).toBe(2); expect(heroPose(1).amp).toBe(1);
});
it("turns through all eight views without deforming, then strikes a pose", () => {
  const rows = new Set<number>(); for (let t = 5; t < 6.4; t += 0.02) { const p = heroPose(t); rows.add(p.row); expect(p.amp).toBe(0); }
  expect(rows.size).toBe(8);
  expect(heroPose(9.1).armL).toBeGreaterThan(0.3); expect(heroPose(9.1).armR).toBeGreaterThan(0.3);
  expect(heroPose(2.9).armR).toBeGreaterThan(heroPose(2.9).armL);
});
