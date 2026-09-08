import { db } from "@/lib/db/prisma";

export type OpeningSide = "White" | "Black";
export type OpeningInsight = {
  key: string;
  opening: string;
  eco: string | null;
  side: OpeningSide;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  averageAccuracy: number | null;
  averageACPL: number | null;
  blundersPerGame: number | null;
  confidence: "low" | "medium" | "high";
};

export type OpeningRecommendation = {
  type: "strength" | "risk" | "coverage";
  title: string;
  detail: string;
};

const round = (value: number, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};
const mean = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

export function openingLabel(opening: string | null, eco: string | null) {
  const clean = opening?.trim();
  if (clean) return clean;
  if (eco?.trim()) return `ECO ${eco.trim()}`;
  return "Unclassified opening";
}

export function openingConfidence(games: number): OpeningInsight["confidence"] {
  if (games >= 12) return "high";
  if (games >= 5) return "medium";
  return "low";
}

export async function getPlayerOpeningIntelligence(username: string) {
  const normalized = username.trim();
  const player = await db.player.findFirst({
    where: { platform: "chess.com", username: { equals: normalized, mode: "insensitive" } },
  });
  if (!player) return null;

  const games = await db.game.findMany({
    where: { playerId: player.id },
    include: { statistics: true },
    orderBy: { playedAt: "desc" },
  });

  type Bucket = { opening: string; eco: string | null; side: OpeningSide; games: number; wins: number; draws: number; accuracy: number[]; acpl: number[]; blunders: number[] };
  const buckets = new Map<string, Bucket>();

  for (const game of games) {
    const isWhite = game.whiteUsername.toLowerCase() === normalized.toLowerCase();
    const side: OpeningSide = isWhite ? "White" : "Black";
    const opening = openingLabel(game.opening, game.eco);
    const key = `${side}|${game.eco ?? ""}|${opening}`;
    const bucket = buckets.get(key) ?? { opening, eco: game.eco ?? null, side, games: 0, wins: 0, draws: 0, accuracy: [], acpl: [], blunders: [] };
    bucket.games++;
    const won = (isWhite && game.result === "1-0") || (!isWhite && game.result === "0-1");
    if (won) bucket.wins++;
    if (game.result === "1/2-1/2") bucket.draws++;
    if (game.analysisStatus === "COMPLETED" && game.statistics) {
      const accuracy = isWhite ? game.statistics.whiteAccuracy : game.statistics.blackAccuracy;
      const acpl = isWhite ? game.statistics.whiteACPL : game.statistics.blackACPL;
      const blunders = isWhite ? game.statistics.whiteBlunders : game.statistics.blackBlunders;
      if (typeof accuracy === "number" && Number.isFinite(accuracy)) bucket.accuracy.push(accuracy);
      if (typeof acpl === "number" && Number.isFinite(acpl)) bucket.acpl.push(acpl);
      if (typeof blunders === "number" && Number.isFinite(blunders)) bucket.blunders.push(blunders);
    }
    buckets.set(key, bucket);
  }

  const openings: OpeningInsight[] = [...buckets.entries()].map(([key, b]) => ({
    key, opening: b.opening, eco: b.eco, side: b.side, games: b.games, wins: b.wins, draws: b.draws,
    losses: b.games - b.wins - b.draws,
    winRate: round((b.wins / b.games) * 100),
    averageAccuracy: b.accuracy.length ? round(mean(b.accuracy)) : null,
    averageACPL: b.acpl.length ? round(mean(b.acpl)) : null,
    blundersPerGame: b.blunders.length ? round(mean(b.blunders), 2) : null,
    confidence: openingConfidence(b.games),
  })).sort((a, b) => b.games - a.games || b.winRate - a.winRate);

  const analyzed = openings.filter(o => o.averageAccuracy !== null);
  const strongest = analyzed.length ? [...analyzed].sort((a,b) => (b.averageAccuracy! - a.averageAccuracy!) || (a.averageACPL! - b.averageACPL!))[0] : null;
  const weakest = analyzed.length ? [...analyzed].filter(o => o.games >= 3).sort((a,b) => (a.averageAccuracy! - b.averageAccuracy!) || (b.averageACPL! - a.averageACPL!))[0] ?? null : null;
  const whiteGames = openings.filter(o => o.side === "White").reduce((n,o) => n + o.games, 0);
  const blackGames = openings.filter(o => o.side === "Black").reduce((n,o) => n + o.games, 0);

  const recommendations: OpeningRecommendation[] = [];
  if (strongest) recommendations.push({ type: "strength", title: `Reliable: ${strongest.opening}`, detail: `${strongest.averageAccuracy}% average accuracy across ${strongest.games} games as ${strongest.side}.` });
  if (weakest && weakest.key !== strongest?.key) recommendations.push({ type: "risk", title: `Review: ${weakest.opening}`, detail: `${weakest.averageAccuracy}% average accuracy across ${weakest.games} games. Treat this as a candidate for targeted opening review, not a verdict from one game.` });
  if (Math.min(whiteGames, blackGames) < Math.max(3, Math.max(whiteGames, blackGames) * 0.25)) recommendations.push({ type: "coverage", title: "Repertoire coverage is uneven", detail: `Imported sample: ${whiteGames} games as White and ${blackGames} as Black. More balanced samples improve opening comparisons.` });
  if (!recommendations.length) recommendations.push({ type: "coverage", title: "Build an analyzed opening sample", detail: "Import and analyze several games in each recurring opening before drawing repertoire conclusions." });

  return {
    username: player.username,
    gamesImported: games.length,
    gamesAnalyzed: games.filter(g => g.analysisStatus === "COMPLETED").length,
    openings,
    strongest,
    weakest,
    recommendations,
    note: "Opening conclusions are based on imported games and persisted engine statistics. Low-sample openings are explicitly marked with lower confidence.",
  };
}
