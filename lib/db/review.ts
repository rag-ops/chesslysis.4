import { db } from "@/lib/db/prisma";

export async function getGameReview(gameId: string) {
  const game = await db.game.findUnique({
    where: { id: gameId },
    include: {
      player: true,
      statistics: true,
      moves: {
        orderBy: { ply: "asc" },
        include: { engineAnalysis: true, classification: true },
      },
    },
  });
  if (!game) return null;

  const isWhitePlayer = game.whiteUsername === game.player?.username;
  const analyses: Record<number, {
    evaluationAfter: number | null;
    bestMove: string | null;
    principalVariation: string[];
    evaluationLoss: number;
    classification: string;
  }> = {};

  for (const move of game.moves) {
    const engine = move.engineAnalysis;
    analyses[move.ply] = {
      evaluationAfter: engine?.evaluationAfter ?? null,
      bestMove: engine?.bestMove ?? null,
      principalVariation: engine?.principalVariation ? engine.principalVariation.split(/\s+/).filter(Boolean) : [],
      evaluationLoss: engine?.evaluationLoss ?? 0,
      classification: move.classification?.classification ?? "UNANALYZED",
    };
  }

  return {
    id: game.id,
    playerUsername: game.playerId ? (game.whiteUsername === game.player?.username ? game.whiteUsername : game.blackUsername) : game.whiteUsername,
    white: game.whiteUsername,
    black: game.blackUsername,
    result: game.result,
    timeControl: game.timeControl ?? "Unknown",
    date: game.playedAt?.toISOString() ?? "Unknown",
    playerAccuracy: isWhitePlayer ? game.statistics?.whiteAccuracy ?? null : game.statistics?.blackAccuracy ?? null,
    playerACPL: isWhitePlayer ? game.statistics?.whiteACPL ?? null : game.statistics?.blackACPL ?? null,
    moves: game.moves.map((m) => ({ ply: m.ply, moveNumber: m.moveNumber, color: m.color === "white" ? "w" as const : "b" as const, san: m.san, uci: m.uci, fenAfter: m.fenAfter })),
    analyses,
  };
}
