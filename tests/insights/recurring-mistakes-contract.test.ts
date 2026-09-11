import { describe, expect, it } from "vitest";
import { rankRecurringPatterns } from "@/lib/insights/recurring-mistakes";

describe("recurring mistake intelligence contract", () => {
  it("ranks recurring patterns and preserves examples", () => {
    const patterns = rankRecurringPatterns([
      { theme: "Tactical oversight", gameId: "g1", san: "Nf3", ply: 11, phase: "middlegame", loss: 2.1 },
      { theme: "Tactical oversight", gameId: "g2", san: "Qh5", ply: 23, phase: "middlegame", loss: 1.7 },
      { theme: "Opening accuracy", gameId: "g3", san: "a3", ply: 5, phase: "opening", loss: 0.4 },
    ]);
    expect(patterns).toHaveLength(2);
    expect(patterns[0]?.theme).toBe("Tactical oversight");
    expect(patterns[0]?.severity).toBeGreaterThan(patterns[1]?.severity ?? 0);
    expect(patterns[0]?.examples).toHaveLength(2);
    expect(patterns[0]?.gamesAffected).toBe(2);
  });
});
