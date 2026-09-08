import { describe, expect, it } from "vitest";
import { classifyMove } from "@/lib/analysis/classifier";

describe("move classifier", () => {
  it("keeps negligible loss as best", () => {
    expect(classifyMove(0.01)).toBe("BEST");
  });

  it("classifies a large loss as a blunder", () => {
    expect(classifyMove(2.5)).toBe("BLUNDER");
  });
});
