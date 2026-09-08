import { describe, expect, it } from "vitest";
import { evaluationFromPlayerPerspective, evaluationLoss } from "@/lib/chess/evaluation";
import { classifyEvaluationLoss } from "@/lib/analysis/classifier";

describe("move analysis primitives", () => {
  it("normalizes black evaluation to the player's perspective", () => {
    expect(evaluationFromPlayerPerspective(1.25, "black")).toBe(-1.25);
  });

  it("never reports negative evaluation loss", () => {
    expect(evaluationLoss(0.5, 0.8)).toBe(0);
    expect(evaluationLoss(0.8, 0.2)).toBeCloseTo(0.6, 10);
  });

  it("classifies progressively larger losses", () => {
    expect(classifyEvaluationLoss(0.02)).toBe("BEST");
    expect(classifyEvaluationLoss(0.35)).toBe("GOOD");
    expect(classifyEvaluationLoss(1.2)).toBe("MISTAKE");
    expect(classifyEvaluationLoss(3)).toBe("BLUNDER");
  });
});
