import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const game = await db.game.findUnique({
    where: { id: gameId },
    select: {
      id: true,
      analysisStatus: true,
      analyzedAt: true,
      statistics: true,
      moves: {
        orderBy: { ply: "asc" },
        select: {
          id: true,
          moveNumber: true,
          ply: true,
          color: true,
          san: true,
          uci: true,
          fenBefore: true,
          fenAfter: true,
          engineAnalysis: true,
          classification: true,
        },
      },
    },
  });

  if (!game) return NextResponse.json({ error: "Game not found." }, { status: 404 });
  return NextResponse.json(game);
}
