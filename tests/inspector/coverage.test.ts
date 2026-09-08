import { describe, expect, it } from "vitest";
import { analysisCoverage } from "@/lib/inspector/coverage";

describe("game inspector analysis coverage", () => {
  it("handles empty and bounded coverage safely", () => {
    expect(analysisCoverage(0, 0)).toBe(0);
    expect(analysisCoverage(40, 10)).toBe(25);
    expect(analysisCoverage(10, 99)).toBe(100);
  });

  it("rounds calculated decimal coverage", () => {
    expect(analysisCoverage(3, 1)).toBeCloseTo(33.33, 2);
  });
});
