import { describe, expect, it } from "vitest";
import { POSITION_INTERVAL_MS, positionUpdateDue } from "./sync";

describe("position synchronization", () => {
  it("triples the original 66 ms interval", () => {
    expect(POSITION_INTERVAL_MS).toBe(66 * 3);
    expect(positionUpdateDue(197, 0)).toBe(false);
    expect(positionUpdateDue(198, 0)).toBe(true);
    expect(positionUpdateDue(395, 198)).toBe(false);
    expect(positionUpdateDue(396, 198)).toBe(true);
  });
});