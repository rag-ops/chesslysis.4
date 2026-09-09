import { describe, expect, it } from "vitest";
import { openingLabel } from "@/lib/openings/player-opening-intelligence";

describe("opening labels", () => {
  it("turns Chess.com opening URLs into readable names", () => {
    expect(openingLabel(null, "https://www.chess.com/openings/Sicilian-Defense")).toBe("Sicilian Defense");
  });
  it("keeps explicit PGN opening names", () => {
    expect(openingLabel("Queen's Gambit Declined", "D30")).toBe("Queen's Gambit Declined");
  });
});
