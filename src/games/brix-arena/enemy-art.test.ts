import { expect, it } from "vitest";
import { meleeFrame, shooterFrame } from "./enemy-art";
it("maps the eight pursuit directions to the baked character views", () => {
  expect(meleeFrame(0,0,1,0).direction).toBe(0);
  expect(meleeFrame(0,0,0,1).direction).toBe(2);
  expect(meleeFrame(0,0,-1,0).direction).toBe(4);
  expect(meleeFrame(0,0,0,-1).direction).toBe(6);
});
it("animates moving melee attackers, loops, and stays still without movement", () => {
  expect(meleeFrame(0,0,1,0).frame).toBe(0);
  expect(meleeFrame(0.1,0,1,0).frame).toBe(1);
  expect(meleeFrame(0.8,0,1,0).frame).toBe(0);
  expect(meleeFrame(0.3,0,0,0).frame).toBe(0);
});
it("keeps the drone blades spinning and faces its target in eight directions", () => {
  expect(shooterFrame(0,0,1,0).direction).toBe(0);
  expect(shooterFrame(0,0,0,1).direction).toBe(2);
  expect(shooterFrame(0,0,-1,0).direction).toBe(4);
  expect(shooterFrame(0,0,0,-1).direction).toBe(6);
  expect(shooterFrame(0,0,1,0).frame).toBe(0);
  expect(shooterFrame(1/12,0,1,0).frame).toBe(1);
  expect(shooterFrame(8/12,0,1,0).frame).toBe(0);
});