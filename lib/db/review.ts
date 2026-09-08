import { db } from "@/lib/db/prisma";

export async function getGameReview(gameId: string) {
  const game = await db.game.findUnique({
    where: { id: gameId },
    include: {
      moves: {
        orderBy: { ply: "asc" },
        include: { engineAnalysis: true, classification: true },
      },
    },
  });
  if (!game) return null;

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
    white: game.whiteUsername,
    black: game.blackUsername,
    result: game.result,
    timeControl: game.timeControl ?? "Unknown",
    date: game.playedAt?.toISOString() ?? "Unknown",
    moves: game.moves.map((m) => ({ ply: m.ply, moveNumber: m.moveNumber, color: m.color === "white" ? "w" as const : "b" as const, san: m.san, fenAfter: m.fenAfter })),
    analyses,
  };
}
