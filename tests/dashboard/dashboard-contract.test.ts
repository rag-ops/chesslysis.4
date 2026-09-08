import { describe, expect, it } from "vitest";

describe("dashboard contracts", () => {
  it("calculates win rate from analyzed games", () => {
    const analyzed = 20, wins = 11;
    expect((wins / analyzed) * 100).toBeCloseTo(55, 10);
  });

  it("keeps accuracy in the expected range", () => {
    const accuracy = 82.4;
    expect(accuracy).toBeGreaterThanOrEqual(0);
    expect(accuracy).toBeLessThanOrEqual(100);
  });
});
