import { db } from "@/lib/db/prisma";

export type InsightPhase = "opening" | "middlegame" | "endgame";

function phaseFromPly(ply: number): InsightPhase {
  if (ply <= 20) return "opening";
  if (ply <= 60) return "middlegame";
  return "endgame";
}

function mean(values: number[]) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

export async function getPlayerInsights(username: string) {
  const normalized = username.trim();
  const player = await db.player.findFirst({
    where: { platform: "chess.com", username: { equals: normalized, mode: "insensitive" } },
  });
  if (!player) return null;

  const games = await db.game.findMany({
    where: { playerId: player.id, analysisStatus: "COMPLETED" },
    orderBy: { playedAt: "asc" },
    include: {
      statistics: true,
      moves: { include: { engineAnalysis: true, classification: true } },
    },
  });

  const phase = {
    opening: { losses: [] as number[], blunders: 0, mistakes: 0, moves: 0 },
    middlegame: { losses: [] as number[], blunders: 0, mistakes: 0, moves: 0 },
    endgame: { losses: [] as number[], blunders: 0, mistakes: 0, moves: 0 },
  };
  const openings = new Map<string, { games: number; wins: number; accuracy: number[] }>();
  const timeControls = new Map<string, { games: number; wins: number; accuracy: number[] }>();
  const color = {
    white: { games: 0, wins: 0, accuracy: [] as number[] },
    black: { games: 0, wins: 0, accuracy: [] as number[] },
  };
  const trend: { date: string; accuracy: number }[] = [];

  for (const game of games) {
    const isWhite = game.whiteUsername.toLowerCase() === normalized.toLowerCase();
    const side = isWhite ? color.white : color.black;
    side.games++;
    const won = (isWhite && game.result === "1-0") || (!isWhite && game.result === "0-1");
    if (won) side.wins++;
    const accuracy = isWhite ? game.statistics?.whiteAccuracy : game.statistics?.blackAccuracy;
    if (typeof accuracy === "number") {
      side.accuracy.push(accuracy);
      if (game.playedAt) trend.push({ date: game.playedAt.toISOString(), accuracy });
    }

    const openingName = game.opening || game.eco || "Unknown opening";
    const opening = openings.get(openingName) ?? { games: 0, wins: 0, accuracy: [] };
    opening.games++;
    if (won) opening.wins++;
    if (typeof accuracy === "number") opening.accuracy.push(accuracy);
    openings.set(openingName, opening);

    const tcName = game.timeControl || "Unknown";
    const tc = timeControls.get(tcName) ?? { games: 0, wins: 0, accuracy: [] };
    tc.games++;
    if (won) tc.wins++;
    if (typeof accuracy === "number") tc.accuracy.push(accuracy);
    timeControls.set(tcName, tc);

    for (const move of game.moves) {
      const belongsToPlayer = isWhite ? move.color === "white" : move.color === "black";
      if (!belongsToPlayer) continue;
      const bucket = phase[phaseFromPly(move.ply)];
      bucket.moves++;
      const loss = move.engineAnalysis?.evaluationLoss;
      if (typeof loss === "number") bucket.losses.push(loss);
      const classification = move.classification?.classification;
      if (classification === "BLUNDER") bucket.blunders++;
      if (classification === "MISTAKE") bucket.mistakes++;
    }
  }

  const phasePerformance = (Object.keys(phase) as InsightPhase[]).map((name) => ({
    phase: name,
    moves: phase[name].moves,
    averageLoss: mean(phase[name].losses),
    accuracy: phase[name].losses.length ? mean(phase[name].losses.map((loss) => 100 * Math.exp(-loss / 1.5))) : 0,
    mistakes: phase[name].mistakes,
    blunders: phase[name].blunders,
  }));

  const weakestPhase = [...phasePerformance].sort((a, b) => a.accuracy - b.accuracy)[0]?.phase ?? "opening";

  return {
    username: player.username,
    gamesAnalyzed: games.length,
    summary: {
      strongestColor: mean(color.white.accuracy) >= mean(color.black.accuracy) ? "White" : "Black",
      weakestPhase,
      overallAccuracy: mean([...color.white.accuracy, ...color.black.accuracy]),
    },
    colorPerformance: [
      { color: "White", games: color.white.games, winRate: color.white.games ? color.white.wins / color.white.games * 100 : 0, accuracy: mean(color.white.accuracy) },
      { color: "Black", games: color.black.games, winRate: color.black.games ? color.black.wins / color.black.games * 100 : 0, accuracy: mean(color.black.accuracy) },
    ],
    phasePerformance,
    openings: [...openings.entries()].map(([opening, value]) => ({ opening, games: value.games, winRate: value.games ? value.wins / value.games * 100 : 0, accuracy: mean(value.accuracy) })).sort((a, b) => b.games - a.games),
    timeControls: [...timeControls.entries()].map(([timeControl, value]) => ({ timeControl, games: value.games, winRate: value.games ? value.wins / value.games * 100 : 0, accuracy: mean(value.accuracy) })).sort((a, b) => b.games - a.games),
    trend: trend.slice(-50),
  };
}
