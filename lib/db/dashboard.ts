import { db } from "@/lib/db/prisma";

type GameRow = Awaited<ReturnType<typeof getPlayerGames>>[number];

async function getPlayerGames(playerId: string) {
  return db.game.findMany({
    where: { playerId },
    orderBy: { playedAt: "desc" },
    include: { statistics: true },
  });
}

export async function getPlayerDashboard(username: string) {
  const normalized = username.trim();
  const player = await db.player.findFirst({
    where: { platform: "chess.com", username: { equals: normalized, mode: "insensitive" } },
  });
  if (!player) return null;

  const games = await getPlayerGames(player.id);
  const completed = games.filter(g => g.analysisStatus === "COMPLETED" && g.statistics);
  const wins = games.filter(g => isWin(g, normalized)).length;
  const draws = games.filter(g => g.result === "1/2-1/2").length;
  const accuracy = completed.map(g => playerAccuracy(g, normalized)).filter(isNumber);
  const acpl = completed.map(g => playerACPL(g, normalized)).filter(isNumber);
  const blunders = completed.map(g => playerBlunders(g, normalized)).filter(isNumber);

  return {
    username: player.username,
    stats: {
      gamesImported: games.length,
      gamesAnalyzed: completed.length,
      winRate: round(games.length ? (wins / games.length) * 100 : 0),
      drawRate: round(games.length ? (draws / games.length) * 100 : 0),
      averageAccuracy: round(mean(accuracy)),
      averageACPL: round(mean(acpl)),
      blundersPerGame: round(mean(blunders)),
    },
    resultSeries: [...games].reverse().map(g => ({
      result: isWin(g, normalized) ? "win" as const : g.result === "1/2-1/2" ? "draw" as const : "loss" as const,
      date: dateString(g.playedAt),
    })),
    accuracyTrend: [...completed].reverse().map(g => ({ date: dateString(g.playedAt), accuracy: playerAccuracy(g, normalized) }))
      .filter((p): p is {date:string; accuracy:number} => isNumber(p.accuracy)),
    recentGames: games.slice(0, 20).map(g => ({
      id: g.id, date: dateString(g.playedAt),
      opponent: g.whiteUsername.toLowerCase() === normalized.toLowerCase() ? g.blackUsername : g.whiteUsername,
      color: g.whiteUsername.toLowerCase() === normalized.toLowerCase() ? "White" as const : "Black" as const,
      result: isWin(g, normalized) ? "Win" as const : g.result === "1/2-1/2" ? "Draw" as const : "Loss" as const,
      accuracy: playerAccuracy(g, normalized), timeControl: g.timeControl ?? "Unknown",
      analysisStatus: g.analysisStatus,
    })),
  };
}
function dateString(v: Date | null) { return v ? v.toISOString() : "Unknown"; }
function isNumber(v: number | null): v is number { return typeof v === "number" && Number.isFinite(v); }
function isWin(g: GameRow, u: string) { const white=g.whiteUsername.toLowerCase()===u.toLowerCase(); return (white&&g.result==="1-0")||(!white&&g.result==="0-1"); }
function playerAccuracy(g: GameRow,u:string):number|null { return g.statistics ? (g.whiteUsername.toLowerCase()===u.toLowerCase()?g.statistics.whiteAccuracy:g.statistics.blackAccuracy) : null; }
function playerACPL(g: GameRow,u:string):number|null { return g.statistics ? (g.whiteUsername.toLowerCase()===u.toLowerCase()?g.statistics.whiteACPL:g.statistics.blackACPL) : null; }
function playerBlunders(g: GameRow,u:string):number|null { return g.statistics ? (g.whiteUsername.toLowerCase()===u.toLowerCase()?g.statistics.whiteBlunders:g.statistics.blackBlunders) : null; }
function mean(v:number[]) { return v.length ? v.reduce((a,b)=>a+b,0)/v.length : 0; }
function round(v:number) { return Math.round((v + Number.EPSILON) * 100) / 100; }
