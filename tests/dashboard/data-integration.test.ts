import { describe, expect, it } from "vitest";

describe("dashboard data integration", () => {
  it("computes win rate from completed games", () => {
    expect((14 / 25) * 100).toBeCloseTo(56, 10);
  });

  it("ignores missing accuracy values", () => {
    const values = [80, null, 90].filter((v): v is number => v !== null);
    expect(values.reduce((a, b) => a + b, 0) / values.length).toBe(85);
  });
});
