import { describe, expect, it } from "vitest";

describe("insight phase heuristic", () => {
  const phase = (ply: number) => ply <= 20 ? "opening" : ply <= 60 ? "middlegame" : "endgame";
  it("splits opening, middlegame and endgame consistently", () => {
    expect(phase(1)).toBe("opening");
    expect(phase(21)).toBe("middlegame");
    expect(phase(61)).toBe("endgame");
  });
});
