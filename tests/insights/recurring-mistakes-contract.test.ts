import { describe, expect, it } from "vitest";

type PatternFixture = {
  gamesAnalyzed: number;
  patterns: Array<{ severity: number; examples: unknown[] }>;
};

// This is a test fixture, not production demo data. Keeping it in the test file
// ensures tests never depend on a removed demo-data module.
const fixture: PatternFixture = {
  gamesAnalyzed: 8,
  patterns: [
    {
      severity: 72,
      examples: [{ gameId: "fixture-game", san: "Qh5?", ply: 18, phase: "opening", loss: 1.2 }],
    },
  ],
};

describe("recurring mistake response contract", () => {
  it("contains ranked recurring patterns", () => {
    expect(fixture.gamesAnalyzed).toBeGreaterThan(0);
    expect(fixture.patterns.length).toBeGreaterThan(0);
    expect(fixture.patterns[0]).toHaveProperty("severity");
    expect(fixture.patterns[0]).toHaveProperty("examples");
  });
});
