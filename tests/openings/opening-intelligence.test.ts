import { describe, expect, it } from "vitest";
import { openingConfidence, openingLabel } from "@/lib/openings/player-opening-intelligence";

describe("opening intelligence helpers", () => {
  it("prefers a named opening and falls back to ECO", () => {
    expect(openingLabel("Sicilian Defense", "B20")).toBe("Sicilian Defense");
    expect(openingLabel(null, "B20")).toBe("ECO B20");
    expect(openingLabel(null, null)).toBe("Unclassified opening");
  });
  it("marks sample confidence conservatively", () => {
    expect(openingConfidence(1)).toBe("low");
    expect(openingConfidence(5)).toBe("medium");
    expect(openingConfidence(12)).toBe("high");
  });
});
