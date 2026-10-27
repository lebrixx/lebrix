import { describe, expect, it } from "vitest";
import { vehicleVariant } from "./vehicle-variants";

describe("vehicle artwork selection", () => {
  it("uses cars for small obstacles and trucks for larger obstacles", () => {
    expect(vehicleVariant("ABCD", 3, 0, 1).kind).toBe("car");
    expect(vehicleVariant("ABCD", 3, 0, 2).kind).toBe("truck");
    expect(vehicleVariant("ABCD", 3, 0, 3).kind).toBe("truck");
  });
  it("varies models across vehicles while keeping everyone's view identical", () => {
    const variants = new Set<number>();
    for (let i = 0; i < 30; i++) {
      const a = vehicleVariant("ABCD", 3, i, 1);
      expect(a).toEqual(vehicleVariant("ABCD", 3, i, 1));
      variants.add(a.variant);
    }
    expect(variants.size).toBe(6);
  });
});