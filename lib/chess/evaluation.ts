/** Convert a Stockfish score expressed from White's perspective into the player's perspective. */
export function evaluationFromPlayerPerspective(evaluation: number, playerColor: "white" | "black") {
  return playerColor === "white" ? evaluation : -evaluation;
}

/** Difference between the best position and the position reached after the played move. */
export function evaluationLoss(bestForPlayer: number, afterForPlayer: number) {
  return Math.max(0, bestForPlayer - afterForPlayer);
}
