import { db } from "@/lib/db/prisma";

export type TimeBucket = "bullet" | "blitz" | "rapid" | "daily" | "unknown";

export type TimeControlDetail = TimeControlInsight & { rawControls: string[] };

export type TimeControlInsight = {
  bucket: TimeBucket;
  label: string;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  averageAccuracy: number | null;
  averageACPL: number | null;
  blundersPerGame: number | null;
};

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
function mean(values: number[]) { return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0; }

export function parseTimeControl(value?: string | null): { bucket: TimeBucket; label: string; baseSeconds: number | null; increment: number | null } {
  if (!value) return { bucket: "unknown", label: "Unknown", baseSeconds: null, increment: null };
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("daily") || /^1\/(86400|259200|604800)$/.test(normalized)) return { bucket: "daily", label: "Daily", baseSeconds: null, increment: null };
  const match = normalized.match(/^(\d+)(?:[+|](\d+))?$/);
  if (!match) return { bucket: "unknown", label: value, baseSeconds: null, increment: null };
  const baseSeconds = Number(match[1]);
  const increment = Number(match[2] ?? 0);
  // Widely used Chess.com classification approximation: estimated game duration.
  const estimate = baseSeconds + increment * 40;
  const bucket: TimeBucket = estimate < 180 ? "bullet" : estimate < 600 ? "blitz" : "rapid";
  const label = `${Math.floor(baseSeconds / 60)}${baseSeconds % 60 ? `:${String(baseSeconds % 60).padStart(2, "0")}` : ""}${increment ? ` + ${increment}` : ""}`;
  return { bucket, label, baseSeconds, increment };
}

function isWin(result: string, isWhite: boolean) { return (isWhite && result === "1-0") || (!isWhite && result === "0-1"); }

export async function getPlayerTimeManagement(username: string) {
  const normalized = username.trim();
  const player = await db.player.findFirst({ where: { platform: "chess.com", username: { equals: normalized, mode: "insensitive" } } });
  if (!player) return null;

  const games = await db.game.findMany({
    where: { playerId: player.id },
    include: { statistics: true },
    orderBy: { playedAt: "desc" },
  });

  const groups = new Map<TimeBucket, typeof games>();
  const exactGroups = new Map<string, typeof games>();
  for (const game of games) {
    const bucket = parseTimeControl(game.timeControl).bucket;
    const list = groups.get(bucket) ?? [];
    list.push(game); groups.set(bucket, list);
    const parsed = parseTimeControl(game.timeControl); const exact = `${parsed.bucket}|${parsed.label}`; const exactList = exactGroups.get(exact) ?? []; exactList.push(game); exactGroups.set(exact, exactList);
  }

  const insights: TimeControlInsight[] = [...groups.entries()].map(([bucket, rows]) => {
    const wins = rows.filter(g => isWin(g.result, g.whiteUsername.toLowerCase() === normalized.toLowerCase())).length;
    const draws = rows.filter(g => g.result === "1/2-1/2").length;
    const analyzed = rows.filter(g => g.analysisStatus === "COMPLETED" && g.statistics);
    const accuracy = analyzed.map(g => g.whiteUsername.toLowerCase() === normalized.toLowerCase() ? g.statistics!.whiteAccuracy : g.statistics!.blackAccuracy).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const acpl = analyzed.map(g => g.whiteUsername.toLowerCase() === normalized.toLowerCase() ? g.statistics!.whiteACPL : g.statistics!.blackACPL).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const blunders = analyzed.map(g => g.whiteUsername.toLowerCase() === normalized.toLowerCase() ? g.statistics!.whiteBlunders : g.statistics!.blackBlunders).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    return { bucket, label: bucket[0].toUpperCase() + bucket.slice(1), games: rows.length, wins, draws, losses: rows.length - wins - draws, winRate: round(rows.length ? wins / rows.length * 100 : 0), averageAccuracy: accuracy.length ? round(mean(accuracy)) : null, averageACPL: acpl.length ? round(mean(acpl)) : null, blundersPerGame: blunders.length ? round(mean(blunders), 2) : null };
  }).sort((a,b) => b.games - a.games);

  const controlsByTime = [...exactGroups.entries()].map(([key, rows]) => {
    const [bucket,label] = key.split("|",2) as [TimeBucket,string];
    const wins = rows.filter(g => isWin(g.result, g.whiteUsername.toLowerCase() === normalized.toLowerCase())).length;
    const draws = rows.filter(g => g.result === "1/2-1/2").length;
    const analyzed = rows.filter(g => g.analysisStatus === "COMPLETED" && g.statistics);
    const accuracy = analyzed.map(g => g.whiteUsername.toLowerCase() === normalized.toLowerCase() ? g.statistics!.whiteAccuracy : g.statistics!.blackAccuracy).filter((v): v is number => typeof v === "number");
    const acpl = analyzed.map(g => g.whiteUsername.toLowerCase() === normalized.toLowerCase() ? g.statistics!.whiteACPL : g.statistics!.blackACPL).filter((v): v is number => typeof v === "number");
    const bl = analyzed.map(g => g.whiteUsername.toLowerCase() === normalized.toLowerCase() ? g.statistics!.whiteBlunders : g.statistics!.blackBlunders).filter((v): v is number => typeof v === "number");
    return { bucket, label, games:rows.length, wins, draws, losses:rows.length-wins-draws, winRate:round(rows.length?wins/rows.length*100:0), averageAccuracy:accuracy.length?round(mean(accuracy)):null, averageACPL:acpl.length?round(mean(acpl)):null, blundersPerGame:bl.length?round(mean(bl),2):null, rawControls:[...new Set(rows.map(g=>g.timeControl??"Unknown"))] };
  }).sort((a,b)=> b.games-a.games || a.label.localeCompare(b.label));

  const analyzedInsights = insights.filter(i => i.averageAccuracy !== null);
  const best = analyzedInsights.length ? [...analyzedInsights].sort((a,b) => (b.averageAccuracy! - a.averageAccuracy!) || a.averageACPL! - b.averageACPL!)[0] : null;
  const weakest = analyzedInsights.length ? [...analyzedInsights].sort((a,b) => (a.averageAccuracy! - b.averageAccuracy!) || b.averageACPL! - a.averageACPL!)[0] : null;
  const primary = insights[0] ?? null;

  let summary = "Import games across multiple time controls to reveal time-control-specific patterns.";
  if (best && weakest && best.bucket !== weakest.bucket) summary = `Your strongest analyzed performance is in ${best.label}, while ${weakest.label} currently shows the most room for improvement.`;
  else if (primary) summary = `Most of your imported games are ${primary.label}. Analyze more games across time controls for a stronger comparison.`;

  return {
    username: player.username, gamesImported: games.length, gamesAnalyzed: games.filter(g => g.analysisStatus === "COMPLETED").length,
    confidence: games.length >= 40 && insights.length >= 2 ? "high" as const : games.length >= 15 ? "medium" as const : "low" as const,
    note: "This phase compares performance by time control. Per-move clock usage is not inferred unless clock annotations are available.",
    summary, bestControl: best, weakestControl: weakest, controls: insights, controlsByTime,
  };
}
