import { db } from "@/lib/db/prisma";
import { safeEvaluationLoss } from "@/lib/analysis/metrics";

export type MistakeTheme = "Tactical oversight" | "Endgame conversion" | "Opening accuracy" | "Calculation breakdown" | "Time-pressure errors";

function phase(ply: number) { return ply <= 20 ? "opening" : ply <= 60 ? "middlegame" : "endgame"; }
function mean(xs: number[]) { return xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : 0; }

export type RecurringMistakeExample = { gameId: string; san: string; ply: number; phase: string; loss: number };
export type RecurringMistakePattern = {
  theme: MistakeTheme; occurrences: number; gamesAffected: number; averageLoss: number; severity: number; examples: RecurringMistakeExample[];
};

/** Pure ranking helper kept independent of Prisma so the intelligence contract is testable. */
export function rankRecurringPatterns(input: Array<{ theme: MistakeTheme; gameId: string; san: string; ply: number; phase: string; loss: number }>): RecurringMistakePattern[] {
  const buckets = new Map<MistakeTheme, { count: number; loss: number[]; games: Set<string>; examples: RecurringMistakeExample[] }>();
  for (const item of input) {
    const bucket = buckets.get(item.theme) ?? { count: 0, loss: [], games: new Set<string>(), examples: [] };
    bucket.count++; bucket.loss.push(item.loss); bucket.games.add(item.gameId);
    if (bucket.examples.length < 5) bucket.examples.push({ gameId: item.gameId, san: item.san, ply: item.ply, phase: item.phase, loss: item.loss });
    buckets.set(item.theme, bucket);
  }
  return [...buckets.entries()].map(([theme, b]) => ({
    theme, occurrences: b.count, gamesAffected: b.games.size, averageLoss: mean(b.loss),
    severity: Math.min(100, Math.round(b.count * 8 + mean(b.loss) * 25)), examples: b.examples,
  })).sort((a, b) => b.severity - a.severity);
}

export async function getRecurringMistakes(username: string) {
  const normalized = username.trim();
  const player = await db.player.findFirst({ where: { platform: "chess.com", username: { equals: normalized, mode: "insensitive" } } });
  if (!player) return null;
  const games = await db.game.findMany({
    where: { playerId: player.id, analysisStatus: "COMPLETED" },
    include: { moves: { include: { engineAnalysis: true, classification: true } }, statistics: true },
    orderBy: { playedAt: "desc" },
  });

  const observations: Array<{ theme: MistakeTheme; gameId: string; san: string; ply: number; phase: string; loss: number }> = [];
  for (const game of games) {
    const white = game.whiteUsername.toLowerCase() === normalized.toLowerCase();
    for (const move of game.moves) {
      if ((white ? move.color === "white" : move.color === "black") === false) continue;
      const cls = move.classification?.classification;
      const loss = safeEvaluationLoss(move.engineAnalysis?.evaluationLoss) ?? 0;
      if (cls !== "BLUNDER" && cls !== "MISTAKE" && loss < 0.6) continue;
      const p = phase(move.ply);
      const reason = (move.classification?.reason || "").toLowerCase();
      let theme: MistakeTheme;
      if (p === "endgame") theme = "Endgame conversion";
      else if (p === "opening") theme = "Opening accuracy";
      else if (reason.includes("time")) theme = "Time-pressure errors";
      else if (reason.includes("tactic") || reason.includes("fork") || reason.includes("pin") || reason.includes("skewer") || move.isCapture || move.isCheck) theme = "Tactical oversight";
      else theme = "Calculation breakdown";
      observations.push({ theme, gameId: game.id, san: move.san, ply: move.ply, phase: p, loss });
    }
  }
  const patterns = rankRecurringPatterns(observations);
  const top = patterns[0];
  return { username: player.username, gamesAnalyzed: games.length, patterns, summary: {
    primaryWeakness: top?.theme ?? "No recurring pattern detected",
    affectedGames: top?.gamesAffected ?? 0,
    totalCriticalErrors: patterns.reduce((n,p)=>n+p.occurrences,0),
  }};
}
