import { db } from "@/lib/db/prisma";

type Bucket = {
  games: number;
  wins: number;
  draws: number;
  losses: number;
  accuracy: number[];
  opponentRatings: number[];
};

type Color = "White" | "Black";

function emptyBucket(): Bucket {
  return { games: 0, wins: 0, draws: 0, losses: 0, accuracy: [], opponentRatings: [] };
}

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function average(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function monthKey(date: Date | null): string {
  return date
    ? `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
    : "Unknown";
}

function resultForPlayer(result: string, isWhite: boolean): "win" | "draw" | "loss" {
  if (result === "1/2-1/2") return "draw";
  if (result === "1-0") return isWhite ? "win" : "loss";
  if (result === "0-1") return isWhite ? "loss" : "win";
  return "draw";
}

function addGame(bucket: Bucket, result: "win" | "draw" | "loss", accuracy: number | null | undefined, opponentRating: number | null | undefined) {
  bucket.games += 1;
  if (result === "win") bucket.wins += 1;
  else if (result === "draw") bucket.draws += 1;
  else bucket.losses += 1;

  if (typeof accuracy === "number" && Number.isFinite(accuracy)) bucket.accuracy.push(accuracy);
  if (typeof opponentRating === "number" && Number.isFinite(opponentRating)) bucket.opponentRatings.push(opponentRating);
}

function formatBucket(label: string, bucket: Bucket) {
  return {
    label,
    games: bucket.games,
    winRate: round(bucket.games ? (bucket.wins / bucket.games) * 100 : 0),
    drawRate: round(bucket.games ? (bucket.draws / bucket.games) * 100 : 0),
    accuracy: bucket.accuracy.length ? round(average(bucket.accuracy)) : null,
    averageOpponentRating: bucket.opponentRatings.length ? round(average(bucket.opponentRatings)) : null,
  };
}

export async function getPlayerPerformance(username: string) {
  const normalized = username.trim();
  const player = await db.player.findFirst({
    where: {
      platform: "chess.com",
      username: { equals: normalized, mode: "insensitive" },
    },
  });
  if (!player) return null;

  const games = await db.game.findMany({
    where: { playerId: player.id },
    orderBy: { playedAt: "asc" },
    include: { statistics: true },
  });

  const byTimeControl = new Map<string, Bucket>();
  const byColor: Record<Color, Bucket> = { White: emptyBucket(), Black: emptyBucket() };
  const byMonth = new Map<string, Bucket>();

  for (const game of games) {
    const isWhite = game.whiteUsername.toLowerCase() === player.username.toLowerCase();
    const color: Color = isWhite ? "White" : "Black";
    const result = resultForPlayer(game.result, isWhite);
    const accuracy = isWhite ? game.statistics?.whiteAccuracy : game.statistics?.blackAccuracy;
    const opponentRating = isWhite ? game.blackRating : game.whiteRating;

    const timeLabel = game.timeControl || "Unknown";
    const monthLabel = monthKey(game.playedAt);
    const timeBucket = byTimeControl.get(timeLabel) ?? emptyBucket();
    const monthBucket = byMonth.get(monthLabel) ?? emptyBucket();

    byTimeControl.set(timeLabel, timeBucket);
    byMonth.set(monthLabel, monthBucket);

    addGame(byColor[color], result, accuracy, opponentRating);
    addGame(timeBucket, result, accuracy, opponentRating);
    addGame(monthBucket, result, accuracy, opponentRating);
  }

  return {
    username: player.username,
    totalGames: games.length,
    byColor: [formatBucket("White", byColor.White), formatBucket("Black", byColor.Black)],
    byTimeControl: [...byTimeControl.entries()]
      .map(([label, bucket]) => formatBucket(label, bucket))
      .sort((a, b) => b.games - a.games || a.label.localeCompare(b.label)),
    monthly: [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([label, bucket]) => formatBucket(label, bucket)),
  };
}
