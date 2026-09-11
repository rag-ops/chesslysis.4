import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const normalized = username.trim();
  if (!/^[A-Za-z0-9_-]{3,25}$/.test(normalized)) {
    return NextResponse.json({ error: "Invalid Chess.com username." }, { status: 400 });
  }

  try {
    const player = await db.player.findFirst({
      where: { platform: "chess.com", username: { equals: normalized, mode: "insensitive" } },
      select: { id: true, username: true },
    });
    if (!player) {
      return NextResponse.json(
        { error: "Player not imported.", code: "PLAYER_NOT_IMPORTED" },
        { status: 404 },
      );
    }

    const games = await db.game.findMany({
      where: { playerId: player.id },
      orderBy: { playedAt: "desc" },
      take: 50,
      select: {
        id: true,
        whiteUsername: true,
        blackUsername: true,
        result: true,
        timeControl: true,
        playedAt: true,
        analysisStatus: true,
      },
    });

    return NextResponse.json({
      username: player.username,
      games: games.map((game) => ({
        ...game,
        playedAt: game.playedAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    console.error("Game list failed", error);
    return NextResponse.json({ error: "Unable to load games." }, { status: 500 });
  }
}
