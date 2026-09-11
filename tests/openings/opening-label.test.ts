import { describe, expect, it } from "vitest";
import { openingLabel } from "@/lib/openings/player-opening-intelligence";

describe("opening labels", () => {
  it("turns Chess.com opening URLs into readable names", () => {
    expect(openingLabel(null, "https://www.chess.com/openings/Sicilian-Defense")).toBe("Sicilian Defense");
  });
  it("normalizes an opening URL to a readable name", () => {
    expect(openingLabel("https://www.chess.com/openings/Queen-s-Gambit-Declined", null)).toBe("Queen's Gambit Declined");
  });
  it("restores possessives from Chess.com slugs without changing normal names", () => {
    expect(openingLabel("https://www.chess.com/openings/King-s-Indian-Defense", null)).toBe("King's Indian Defense");
    expect(openingLabel("https://www.chess.com/openings/Sicilian-Defense", null)).toBe("Sicilian Defense");
  });
  it("keeps explicit PGN opening names", () => {
    expect(openingLabel("Queen's Gambit Declined", "D30")).toBe("Queen's Gambit Declined");
  });
});
