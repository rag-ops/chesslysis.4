import { db } from "@/lib/db/prisma";

export type MistakeTheme = "Tactical oversight" | "Endgame conversion" | "Opening accuracy" | "Calculation breakdown" | "Time-pressure errors";

function phase(ply: number) { return ply <= 20 ? "opening" : ply <= 60 ? "middlegame" : "endgame"; }
function mean(xs: number[]) { return xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : 0; }

export async function getRecurringMistakes(username: string) {
  const normalized = username.trim();
  const player = await db.player.findFirst({ where: { platform: "chess.com", username: { equals: normalized, mode: "insensitive" } } });
  if (!player) return null;
  const games = await db.game.findMany({
    where: { playerId: player.id, analysisStatus: "COMPLETED" },
    include: { moves: { include: { engineAnalysis: true, classification: true } }, statistics: true },
    orderBy: { playedAt: "desc" },
  });

  const buckets: Record<string, { count: number; loss: number[]; games: Set<string>; examples: { gameId: string; san: string; ply: number; phase: string; loss: number }[] }> = {};
  const ensure = (name: string) => buckets[name] ??= { count: 0, loss: [], games: new Set(), examples: [] };
  for (const game of games) {
    const white = game.whiteUsername.toLowerCase() === normalized.toLowerCase();
    for (const move of game.moves) {
      if ((white ? move.color === "white" : move.color === "black") === false) continue;
      const cls = move.classification?.classification;
      const loss = move.engineAnalysis?.evaluationLoss ?? 0;
      if (cls !== "BLUNDER" && cls !== "MISTAKE" && loss < 0.6) continue;
      const p = phase(move.ply);
      const reason = (move.classification?.reason || "").toLowerCase();
      let theme: MistakeTheme;
      if (p === "endgame") theme = "Endgame conversion";
      else if (p === "opening") theme = "Opening accuracy";
      else if (reason.includes("time")) theme = "Time-pressure errors";
      else if (reason.includes("tactic") || reason.includes("fork") || reason.includes("pin") || reason.includes("skewer") || move.isCapture || move.isCheck) theme = "Tactical oversight";
      else theme = "Calculation breakdown";
      const b = ensure(theme); b.count++; b.loss.push(loss); b.games.add(game.id);
      if (b.examples.length < 5) b.examples.push({ gameId: game.id, san: move.san, ply: move.ply, phase: p, loss });
    }
  }
  const patterns = Object.entries(buckets).map(([theme,b]) => ({
    theme, occurrences: b.count, gamesAffected: b.games.size, averageLoss: mean(b.loss),
    severity: Math.min(100, Math.round(b.count * 8 + mean(b.loss) * 25)), examples: b.examples,
  })).sort((a,b)=>b.severity-a.severity);
  const top = patterns[0];
  return { username: player.username, gamesAnalyzed: games.length, patterns, summary: {
    primaryWeakness: top?.theme ?? "No recurring pattern detected",
    affectedGames: top?.gamesAffected ?? 0,
    totalCriticalErrors: patterns.reduce((n,p)=>n+p.occurrences,0),
  }};
}
