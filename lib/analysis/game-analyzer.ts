import { db } from "@/lib/db/prisma";
import { classifyEvaluationLoss } from "@/lib/analysis/classifier";
import { evaluationFromPlayerPerspective, evaluationLoss } from "@/lib/chess/evaluation";
import { createStockfishEngine, type ChessEngine } from "@/lib/stockfish/engine";
import { detectTacticalPatterns } from "@/lib/analysis/patterns";

export type AnalysisProgress = { gameId: string; totalMoves: number; analyzedMoves: number; status: "ANALYZING" | "COMPLETED" | "FAILED" };
export type AnalyzeGameOptions = { depth?: number; moveTimeMs?: number; onProgress?: (progress: AnalysisProgress) => void };

function accuracyFromLoss(loss: number): number { return 100 * Math.exp(-loss / 1.5); }

/**
 * Analyze every played move. Position evaluations are cached, so adjacent moves
 * reuse the previous move's resulting-position analysis. This reduces engine
 * calls from roughly 2N to N+1 and makes batch analysis viable on Render.
 */
export async function analyzeGame(gameId: string, options: AnalyzeGameOptions = {}): Promise<AnalysisProgress> {
  const depth = options.depth ?? 12;
  if (depth < 8 || depth > 30) throw new Error("Analysis depth must be between 8 and 30.");

  const game = await db.game.findUnique({ where: { id: gameId }, include: { moves: { orderBy: { ply: "asc" } } } });
  if (!game) throw new Error("Game not found.");
  if (game.moves.length === 0) throw new Error("Game has no moves to analyze.");

  await db.game.update({ where: { id: gameId }, data: { analysisStatus: "ANALYZING" } });
  let engine: ChessEngine | null = null;
  const totals = {
    white: { losses: [] as number[], best: 0, inaccuracies: 0, mistakes: 0, blunders: 0 },
    black: { losses: [] as number[], best: 0, inaccuracies: 0, mistakes: 0, blunders: 0 },
  };

  try {
    engine = createStockfishEngine();
    const cache = new Map<string, Awaited<ReturnType<ChessEngine["analyze"]>>>();
    const evaluate = async (fen: string) => {
      const cached = cache.get(fen);
      if (cached) return cached;
      const result = await engine!.analyze(fen, depth, { moveTimeMs: options.moveTimeMs });
      cache.set(fen, result);
      return result;
    };

    for (let index = 0; index < game.moves.length; index++) {
      const move = game.moves[index];
      const playerColor = move.color as "white" | "black";
      const before = await evaluate(move.fenBefore);
      const after = await evaluate(move.fenAfter);
      const loss = evaluationLoss(
        evaluationFromPlayerPerspective(before.evaluation, playerColor),
        evaluationFromPlayerPerspective(after.evaluation, playerColor),
      );
      const classification = classifyEvaluationLoss(loss);
      const bucket = totals[playerColor];
      bucket.losses.push(loss);
      if (classification === "BEST") bucket.best++;
      if (classification === "INACCURACY") bucket.inaccuracies++;
      if (classification === "MISTAKE") bucket.mistakes++;
      if (classification === "BLUNDER") bucket.blunders++;

      const patterns = detectTacticalPatterns(move.fenAfter, move.uci);
      const reason = `${move.san} lost approximately ${loss.toFixed(2)} pawns from the player's perspective.${patterns.length ? ` Tactical pattern: ${patterns.join(", ")}.` : ""}`;
      await Promise.all([
        db.engineAnalysis.upsert({
          where: { moveId: move.id },
          create: { moveId: move.id, depth: Math.min(before.depth, after.depth), evaluation: before.evaluation, mate: before.mate, bestMove: before.bestMove, principalVariation: before.principalVariation.join(" "), evaluationAfter: after.evaluation, evaluationLoss: loss, engineVersion: process.env.STOCKFISH_VERSION ?? "Stockfish" },
          update: { depth: Math.min(before.depth, after.depth), evaluation: before.evaluation, mate: before.mate, bestMove: before.bestMove, principalVariation: before.principalVariation.join(" "), evaluationAfter: after.evaluation, evaluationLoss: loss, engineVersion: process.env.STOCKFISH_VERSION ?? "Stockfish", analyzedAt: new Date() },
        }),
        db.moveClassification.upsert({
          where: { moveId: move.id },
          create: { moveId: move.id, classification, severity: loss, reason },
          update: { classification, severity: loss, reason, createdAt: new Date() },
        }),
      ]);
      options.onProgress?.({ gameId, totalMoves: game.moves.length, analyzedMoves: index + 1, status: "ANALYZING" });
    }

    const summarize = (losses: number[]) => losses.length ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;
    const whiteLoss = summarize(totals.white.losses), blackLoss = summarize(totals.black.losses);
    await db.gameStatistics.upsert({
      where: { gameId },
      create: { gameId, whiteAccuracy: totals.white.losses.length ? totals.white.losses.reduce((a,l)=>a+accuracyFromLoss(l),0)/totals.white.losses.length : 0, blackAccuracy: totals.black.losses.length ? totals.black.losses.reduce((a,l)=>a+accuracyFromLoss(l),0)/totals.black.losses.length : 0, whiteACPL: whiteLoss*100, blackACPL: blackLoss*100, whiteBestMoves: totals.white.best, blackBestMoves: totals.black.best, whiteInaccuracies: totals.white.inaccuracies, blackInaccuracies: totals.black.inaccuracies, whiteMistakes: totals.white.mistakes, blackMistakes: totals.black.mistakes, whiteBlunders: totals.white.blunders, blackBlunders: totals.black.blunders },
      update: { whiteAccuracy: totals.white.losses.length ? totals.white.losses.reduce((a,l)=>a+accuracyFromLoss(l),0)/totals.white.losses.length : 0, blackAccuracy: totals.black.losses.length ? totals.black.losses.reduce((a,l)=>a+accuracyFromLoss(l),0)/totals.black.losses.length : 0, whiteACPL: whiteLoss*100, blackACPL: blackLoss*100, whiteBestMoves: totals.white.best, blackBestMoves: totals.black.best, whiteInaccuracies: totals.white.inaccuracies, blackInaccuracies: totals.black.inaccuracies, whiteMistakes: totals.white.mistakes, blackMistakes: totals.black.mistakes, whiteBlunders: totals.white.blunders, blackBlunders: totals.black.blunders },
    });
    await db.game.update({ where: { id: gameId }, data: { analysisStatus: "COMPLETED", analyzedAt: new Date() } });
    return { gameId, totalMoves: game.moves.length, analyzedMoves: game.moves.length, status: "COMPLETED" };
  } catch (error) {
    await db.game.update({ where: { id: gameId }, data: { analysisStatus: "FAILED" } }).catch(() => undefined);
    throw error;
  } finally {
    const closable = engine as (ChessEngine & { close?: () => Promise<void> }) | null;
    await closable?.close?.();
  }
}
