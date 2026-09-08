import { describe, expect, it } from "vitest";
import { demoMistakes } from "@/lib/demo/player-demo";

describe("recurring mistake demo contract", () => {
  it("contains ranked recurring patterns", () => {
    expect(demoMistakes.gamesAnalyzed).toBeGreaterThan(0);
    expect(demoMistakes.patterns.length).toBeGreaterThan(0);
    expect(demoMistakes.patterns[0]).toHaveProperty("severity");
    expect(demoMistakes.patterns[0]).toHaveProperty("examples");
  });
});
