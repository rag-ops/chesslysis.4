export function analysisCoverage(totalMoves: number, analyzedMoves: number): number {
  if (!Number.isFinite(totalMoves) || totalMoves <= 0) return 0;
  const safeAnalyzed = Math.max(0, Math.min(analyzedMoves, totalMoves));
  return Math.round(((safeAnalyzed / totalMoves) * 100 + Number.EPSILON) * 100) / 100;
}
