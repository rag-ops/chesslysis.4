import type { MoveClassificationType } from "@prisma/client";

/**
 * Conservative v1 classifier. Thresholds are intentionally centralized so they
 * can be calibrated against real games without changing the rest of the pipeline.
 */
export function classifyEvaluationLoss(loss: number): MoveClassificationType {
  if (loss <= 0.05) return "BEST";
  if (loss <= 0.20) return "EXCELLENT";
  if (loss <= 0.50) return "GOOD";
  if (loss <= 1.00) return "INACCURACY";
  if (loss <= 2.00) return "MISTAKE";
  return "BLUNDER";
}

/** Backward-compatible shorthand used by tests and callers. */
export const classifyMove = classifyEvaluationLoss;
