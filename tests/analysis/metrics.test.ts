import { describe, expect, it } from "vitest";
import { safeACPL, safeAccuracy, safeEvaluationLoss } from "@/lib/analysis/metrics";

describe("persisted analysis metric guardrails", () => {
  it("rejects raw engine mate sentinels and absurd ACPL values", () => {
    expect(safeACPL(646009.4)).toBeNull();
    expect(safeACPL(1000000)).toBeNull();
    expect(safeACPL(99.9)).toBe(99.9);
  });

  it("rejects corrupted move-level evaluation loss instead of converting it to a fake maximum", () => {
    expect(safeEvaluationLoss(646009.4)).toBeNull();
    expect(safeEvaluationLoss(Number.NaN)).toBeNull();
    expect(safeEvaluationLoss(9.5)).toBe(9.5);
  });

  it("rejects non-finite or out-of-range accuracy", () => {
    expect(safeAccuracy(Number.NaN)).toBeNull();
    expect(safeAccuracy(101)).toBeNull();
    expect(safeAccuracy(87.5)).toBe(87.5);
  });
});
