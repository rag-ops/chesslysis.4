import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const player = await db.player.findFirst({
    where: { platform: "chess.com", username: { equals: username.trim(), mode: "insensitive" } },
    select: { id: true, username: true, updatedAt: true },
  });
  if (!player) return NextResponse.json({ error: "Player has not been imported yet.", code: "PLAYER_NOT_IMPORTED" }, { status: 404 });

  const [gamesImported, gamesAnalyzed, latestGame, oldestGame] = await Promise.all([
    db.game.count({ where: { playerId: player.id } }),
    db.game.count({ where: { playerId: player.id, analysisStatus: "COMPLETED" } }),
    db.game.findFirst({ where: { playerId: player.id }, orderBy: { playedAt: "desc" }, select: { playedAt: true } }),
    db.game.findFirst({ where: { playerId: player.id }, orderBy: { playedAt: "asc" }, select: { playedAt: true } }),
  ]);

  const pendingAnalysis = Math.max(0, gamesImported - gamesAnalyzed);
  const coverage = gamesImported ? Math.round((gamesAnalyzed / gamesImported) * 10000) / 100 : 0;
  const freshnessHours = latestGame?.playedAt ? Math.max(0, Math.round((Date.now() - latestGame.playedAt.getTime()) / 36e5)) : null;

  return NextResponse.json({
    username: player.username,
    gamesImported,
    gamesAnalyzed,
    pendingAnalysis,
    analysisCoverage: coverage,
    oldestGameAt: oldestGame?.playedAt?.toISOString() ?? null,
    latestGameAt: latestGame?.playedAt?.toISOString() ?? null,
    playerUpdatedAt: player.updatedAt.toISOString(),
    latestGameAgeHours: freshnessHours,
    status: gamesImported === 0 ? "empty" : gamesAnalyzed === 0 ? "imported" : coverage < 100 ? "partial" : "complete",
  }, { headers: { "Cache-Control": "no-store" } });
}
