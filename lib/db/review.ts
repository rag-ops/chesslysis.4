import { db } from "@/lib/db/prisma";

export async function getGameReview(gameId: string) {
  const game = await db.game.findUnique({
    where: { id: gameId },
    include: {
      player: { select: { username: true } },
      statistics: true,
      moves: {
        orderBy: { ply: "asc" },
        include: { engineAnalysis: true, classification: true },
      },
    },
  });
  if (!game) return null;

  const isPlayerWhite = game.whiteUsername.toLowerCase() === game.player.username.toLowerCase();
  const playerAccuracy = game.statistics
    ? (isPlayerWhite ? game.statistics.whiteAccuracy : game.statistics.blackAccuracy)
    : null;
  const playerACPL = game.statistics
    ? (isPlayerWhite ? game.statistics.whiteACPL : game.statistics.blackACPL)
    : null;

  const analyses: Record<number, {
    evaluationAfter: number | null;
    bestMove: string | null;
    principalVariation: string[];
    evaluationLoss: number;
    classification: string;
    reason: string | null;
  }> = {};

  for (const move of game.moves) {
    const engine = move.engineAnalysis;
    analyses[move.ply] = {
      evaluationAfter: engine?.evaluationAfter ?? null,
      bestMove: engine?.bestMove ?? null,
      principalVariation: engine?.principalVariation
        ? engine.principalVariation.split(/\s+/).filter(Boolean)
        : [],
      evaluationLoss: engine?.evaluationLoss ?? 0,
      classification: move.classification?.classification ?? "UNANALYZED",
      reason: move.classification?.reason ?? null,
    };
  }

  return {
    id: game.id,
    playerUsername: game.player.username,
    white: game.whiteUsername,
    black: game.blackUsername,
    result: game.result,
    timeControl: game.timeControl ?? "Unknown",
    date: game.playedAt?.toISOString() ?? "Unknown",
    playerAccuracy,
    playerACPL,
    moves: game.moves.map((m) => ({
      ply: m.ply,
      moveNumber: m.moveNumber,
      color: m.color === "white" ? "w" as const : "b" as const,
      san: m.san,
      uci: m.uci,
      fenBefore: m.fenBefore,
      fenAfter: m.fenAfter,
    })),
    analyses,
  };
}
