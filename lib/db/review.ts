import { db } from '@/lib/db/prisma';
import { Chess } from 'chess.js';
import { uciToSan } from '@/lib/analysis/game-analyzer';
import { safeACPL, safeAccuracy, safeEvaluationLoss } from '@/lib/analysis/metrics';

export async function getGameReview(gameId: string) {
  const game = await db.game.findUnique({
    where: { id: gameId },
    include: {
      player: true,
      statistics: true,
      moves: {
        orderBy: { ply: 'asc' },
        include: { engineAnalysis: true, classification: true },
      },
    },
  });
  if (!game) return null;

  const normalizedPlayer = game.player?.username.toLowerCase();
  const isWhitePlayer = game.whiteUsername.toLowerCase() === normalizedPlayer;
  const analyses: Record<number, {
    evaluationAfter: number | null;
    mate: number | null;
    bestMove: string | null;
    bestMoveSan: string | null;
    principalVariation: string[];
    evaluationLoss: number | null;
    classification: string;
  }> = {};

  for (const move of game.moves) {
    const engine = move.engineAnalysis;
    const bestMove = engine?.bestMove ?? null;
    let terminalMate: number | null = null;
    try {
      const position = new Chess(move.fenAfter);
      if (position.isCheckmate()) terminalMate = move.color === 'white' ? 1 : -1;
    } catch { /* keep persisted engine mate when available */ }
    analyses[move.ply] = {
      evaluationAfter: Number.isFinite(engine?.evaluationAfter) ? engine?.evaluationAfter ?? null : null,
      mate: terminalMate ?? engine?.mate ?? null,
      bestMove,
      bestMoveSan: uciToSan(move.fenBefore, bestMove),
      principalVariation: engine?.principalVariation ? engine.principalVariation.split(/\s+/).filter(Boolean) : [],
      evaluationLoss: safeEvaluationLoss(engine?.evaluationLoss),
      classification: move.classification?.classification ?? 'UNANALYZED',
    };
  }

  const storedWhiteACPL = safeACPL(game.statistics?.whiteACPL);
  const storedBlackACPL = safeACPL(game.statistics?.blackACPL);
  const storedWhiteAccuracy = safeAccuracy(game.statistics?.whiteAccuracy);
  const storedBlackAccuracy = safeAccuracy(game.statistics?.blackAccuracy);

  return {
    id: game.id,
    playerUsername: game.playerId ? (isWhitePlayer ? game.whiteUsername : game.blackUsername) : game.whiteUsername,
    white: game.whiteUsername,
    black: game.blackUsername,
    result: game.result,
    timeControl: game.timeControl ?? 'Unknown',
    date: game.playedAt?.toISOString() ?? 'Unknown',
    playerAccuracy: isWhitePlayer ? storedWhiteAccuracy : storedBlackAccuracy,
    playerACPL: isWhitePlayer ? storedWhiteACPL : storedBlackACPL,
    moves: game.moves.map((m) => ({ ply: m.ply, moveNumber: m.moveNumber, color: m.color === 'white' ? 'w' as const : 'b' as const, san: m.san, uci: m.uci, fenBefore: m.fenBefore, fenAfter: m.fenAfter })),
    analyses,
  };
}
