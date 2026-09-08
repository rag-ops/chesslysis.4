import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { getLatestAnalysisJob } from "@/lib/analysis/queue";
export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const player = await db.player.findFirst({ where: { platform: "chess.com", username: { equals: username.trim(), mode: "insensitive" } } });
  if (!player) return NextResponse.json({ error: "Player not found." }, { status: 404 });
  const groups = await db.game.groupBy({ by: ["analysisStatus"], where: { playerId: player.id }, _count: { _all: true } });
  const counts: Record<string, number> = {};
  for (const group of groups) counts[group.analysisStatus] = group._count._all;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const completed = counts.COMPLETED ?? 0;
  const job = await getLatestAnalysisJob(username);
  return NextResponse.json({ total, completed, pending: (counts.NOT_ANALYZED ?? 0) + (counts.QUEUED ?? 0), analyzing: counts.ANALYZING ?? 0, failed: counts.FAILED ?? 0, coverage: total ? Math.round((completed / total) * 1000) / 10 : 0, job });
}
