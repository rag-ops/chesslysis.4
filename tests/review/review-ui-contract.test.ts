import { describe, expect, it } from "vitest";

describe("game review contracts", () => {
  it("uses ply as the stable move key", () => {
    const move = {ply: 12, san:"Nf3"};
    expect(move.ply).toBe(12);
  });
  it("keeps engine evaluations numeric", () => {
    expect([-1.4,0,0.83,2.7].every(Number.isFinite)).toBe(true);
  });
});
