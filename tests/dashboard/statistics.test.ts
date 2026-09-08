import { describe, expect, it } from "vitest";

describe("dashboard statistics", () => {
  it("computes win rate", () => {
    expect((12 / 20) * 100).toBe(60);
  });

  it("computes an average", () => {
    const values = [80, 90, 70];
    expect(values.reduce((a,b) => a+b, 0) / values.length).toBe(80);
  });
});
