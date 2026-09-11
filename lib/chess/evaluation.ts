import { MATE_EVALUATION } from '@/lib/stockfish/uci';

/** Convert a White-perspective evaluation into the player's perspective. */
export function evaluationFromPlayerPerspective(evaluation: number, playerColor: 'white' | 'black') {
  return playerColor === 'white' ? evaluation : -evaluation;
}

/**
 * Difference between the best position and the position reached after the
 * played move. Mate scores are deliberately bounded; raw UCI mate sentinels
 * must never enter ACPL, accuracy, or other aggregate metrics.
 */
export function evaluationLoss(bestForPlayer: number, afterForPlayer: number) {
  if (!Number.isFinite(bestForPlayer) || !Number.isFinite(afterForPlayer)) return MATE_EVALUATION;
  return Math.min(MATE_EVALUATION, Math.max(0, bestForPlayer - afterForPlayer));
}
