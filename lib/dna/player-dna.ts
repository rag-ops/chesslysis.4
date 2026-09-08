import { db } from "@/lib/db/prisma";

export type DnaDimension = {
  key: "tactical" | "aggression" | "activity" | "discipline" | "endgame" | "consistency";
  label: string;
  score: number;
  evidence: string;
};

function clamp(value: number) { return Math.max(0, Math.min(100, Math.round(value * 10) / 10)); }
function mean(values: number[]) { return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0; }
function stddev(values: number[]) { const m = mean(values); return values.length ? Math.sqrt(mean(values.map(v => (v - m) ** 2))) : 0; }
function phase(ply: number) { return ply <= 20 ? "opening" : ply <= 60 ? "middlegame" : "endgame"; }

export async function getPlayerDNA(username: string) {
  const normalized = username.trim();
  const player = await db.player.findFirst({
    where: { platform: "chess.com", username: { equals: normalized, mode: "insensitive" } },
  });
  if (!player) return null;

  const games = await db.game.findMany({
    where: { playerId: player.id, analysisStatus: "COMPLETED" },
    include: { statistics: true, moves: { include: { classification: true } } },
    orderBy: { playedAt: "asc" },
  });

  const counts = { moves: 0, captures: 0, checks: 0, castles: 0, promotions: 0, best: 0, good: 0, inaccuracies: 0, mistakes: 0, blunders: 0, endgameMoves: 0 };
  const accuracies: number[] = [];

  for (const game of games) {
    const isWhite = game.whiteUsername.toLowerCase() === normalized.toLowerCase();
    const accuracy = game.statistics ? (isWhite ? game.statistics.whiteAccuracy : game.statistics.blackAccuracy) : null;
    if (typeof accuracy === "number" && Number.isFinite(accuracy)) accuracies.push(accuracy);
    for (const move of game.moves) {
      if ((isWhite && move.color !== "white") || (!isWhite && move.color !== "black")) continue;
      counts.moves++;
      if (move.isCapture) counts.captures++;
      if (move.isCheck) counts.checks++;
      if (move.isCastle) counts.castles++;
      if (move.isPromotion) counts.promotions++;
      if (phase(move.ply) === "endgame") counts.endgameMoves++;
      switch (move.classification?.classification) {
        case "BEST": counts.best++; break;
        case "EXCELLENT":
        case "GOOD": counts.good++; break;
        case "INACCURACY": counts.inaccuracies++; break;
        case "MISTAKE": counts.mistakes++; break;
        case "BLUNDER": counts.blunders++; break;
      }
    }
  }

  if (!games.length || !counts.moves) {
    return { username: player.username, gamesAnalyzed: 0, confidence: "low" as const, archetype: "Analysis pending", summary: "Analyze more games to build a reliable player fingerprint.", dimensions: [] as DnaDimension[], evidence: counts };
  }

  const captureRate = counts.captures / counts.moves;
  const checkRate = counts.checks / counts.moves;
  const errorRate = (counts.inaccuracies + counts.mistakes * 2 + counts.blunders * 4) / counts.moves;
  const strongRate = (counts.best + counts.good * 0.7) / counts.moves;
  const endgameShare = counts.endgameMoves / counts.moves;
  const tactical = clamp((captureRate * 0.55 + checkRate * 0.45) * 320);
  const aggression = clamp((captureRate * 0.7 + checkRate * 0.3) * 300 + Math.min(12, counts.promotions * 2));
  const activity = clamp((checkRate * 0.45 + captureRate * 0.35 + Math.min(0.2, counts.castles / Math.max(games.length, 1)) * 0.2) * 330);
  const discipline = clamp(100 - errorRate * 230 + strongRate * 22);
  const consistency = accuracies.length >= 2 ? clamp(100 - stddev(accuracies) * 3.2) : clamp(60 + strongRate * 40);
  const endgame = clamp(endgameShare * 190 + discipline * 0.35);

  const dimensions: DnaDimension[] = [
    { key: "tactical", label: "Tactical intensity", score: tactical, evidence: `${counts.captures} captures and ${counts.checks} checking moves across ${counts.moves} analyzed moves` },
    { key: "aggression", label: "Aggression", score: aggression, evidence: `${(captureRate * 100).toFixed(1)}% of moves were captures` },
    { key: "activity", label: "Piece activity", score: activity, evidence: `${counts.castles} castling moves; active-move rate ${(captureRate + checkRate) * 100 > 100 ? "100" : ((captureRate + checkRate) * 100).toFixed(1)}%` },
    { key: "discipline", label: "Decision discipline", score: discipline, evidence: `${counts.blunders} blunders and ${counts.mistakes} mistakes in analyzed moves` },
    { key: "endgame", label: "Endgame resilience", score: endgame, evidence: `${counts.endgameMoves} analyzed moves reached the endgame phase` },
  ];

  const highest = [...dimensions].sort((a, b) => b.score - a.score)[0];
  const lowest = [...dimensions].sort((a, b) => a.score - b.score)[0];
  const archetype = highest.key === "tactical" || highest.key === "aggression" ? "Dynamic tactician" : highest.key === "discipline" ? "Controlled strategist" : highest.key === "endgame" ? "Technical converter" : "Active all-rounder";

  return {
    username: player.username,
    gamesAnalyzed: games.length,
    confidence: games.length >= 30 ? "high" as const : games.length >= 10 ? "medium" as const : "low" as const,
    archetype,
    summary: `Your current fingerprint is strongest in ${highest.label.toLowerCase()} (${highest.score}/100) and has the most room to improve in ${lowest.label.toLowerCase()} (${lowest.score}/100).`,
    dimensions: [...dimensions, { key: "consistency", label: "Consistency", score: consistency, evidence: accuracies.length ? `Accuracy variation measured across ${accuracies.length} completed games` : "More completed games improve confidence" }],
    evidence: counts,
  };
}
