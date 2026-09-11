import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { analyzeGame } from "@/lib/analysis/game-analyzer";

export const runtime = "nodejs";
export const maxDuration = 300;

function boundedInteger(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.trunc(parsed), min), max) : fallback;
}

export async function POST(request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const body: unknown = await request.json().catch(() => ({}));
  const payload = body && typeof body === "object" ? body as { limit?: unknown; depth?: unknown } : {};
  const limit = boundedInteger(payload.limit, 5, 1, 5);
  // Render's free CPU is intentionally conservative. Cached N+1 position
  // analysis at depth 10 gives a reliable first-pass batch; deeper single-game
  // analysis remains available through the game endpoint.
  const depth = boundedInteger(payload.depth, 10, 8, 16);

  const player = await db.player.findFirst({ where: { platform: "chess.com", username: { equals: username.trim(), mode: "insensitive" } } });
  if (!player) return NextResponse.json({ error: "Player not found. Sync games first." }, { status: 404 });

  const games = await db.game.findMany({ where: { playerId: player.id, analysisStatus: { in: ["NOT_ANALYZED", "FAILED"] } }, orderBy: { playedAt: "desc" }, take: limit, select: { id: true } });
  const failures: { gameId: string; message: string }[] = [];
  let completed = 0;
  for (const game of games) {
    try { await analyzeGame(game.id, { depth }); completed++; }
    catch (error) { failures.push({ gameId: game.id, message: error instanceof Error ? error.message : "Unknown analysis error" }); }
  }

  const remaining = await db.game.count({ where: { playerId: player.id, analysisStatus: { in: ["NOT_ANALYZED", "FAILED"] } } });
  return NextResponse.json({ requested: games.length, completed, failed: failures.length, failures, remaining, depth });
}
