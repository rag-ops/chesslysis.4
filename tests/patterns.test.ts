import { describe, expect, it } from "vitest";
import { detectTacticalPatterns } from "@/lib/analysis/patterns";

describe("tactical pattern detector", () => {
  it("does not invent a pattern when the destination is invalid", () => {
    expect(detectTacticalPatterns("8/8/8/8/8/8/8/8 w - - 0 1", "e2e4")).toEqual([]);
  });
  it("detects a simple knight fork geometry", () => {
    // White knight on e5 attacks c6/c4/d7/f7/g6/g4/c?; black rooks on c6 and f7.
    const tags = detectTacticalPatterns("8/5r2/2r5/4N3/8/8/8/4K3 b - - 0 1", "f3e5");
    expect(tags).toContain("fork");
  });
});
