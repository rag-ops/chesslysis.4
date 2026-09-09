import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { parsePgn } from "@/lib/chess/pgn";
import { db } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const schema = z.object({ pgn: z.string().trim().min(20).max(200_000) });

export async function POST(request: Request) {
  try {
    const { pgn } = schema.parse(await request.json());
    const parsed = parsePgn(pgn);
    const headers = parsed.headers;
    const result = headers.Result || "*";
    if (!["1-0", "0-1", "1/2-1/2", "*"].includes(result)) throw new Error("PGN contains an unsupported result value.");
    const player = await db.player.upsert({
      where: { platform_username: { platform: "pgn", username: "manual" } },
      update: {}, create: { platform: "pgn", username: "manual" },
      select: { id: true },
    });
    const created = await db.game.create({
      data: {
        playerId: player.id,
        externalId: `manual-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
        whiteUsername: headers.White?.trim() || "White",
        blackUsername: headers.Black?.trim() || "Black",
        whiteRating: headers.WhiteElo && /^\d+$/.test(headers.WhiteElo) ? Number(headers.WhiteElo) : null,
        blackRating: headers.BlackElo && /^\d+$/.test(headers.BlackElo) ? Number(headers.BlackElo) : null,
        result,
        timeControl: headers.TimeControl || null,
        pgn,
        eco: headers.ECO || null,
        opening: headers.Opening || null,
        analysisStatus: "NOT_ANALYZED",
        moves: { create: parsed.moves },
      },
      select: { id: true },
    });
    return NextResponse.json({ gameId: created.id, moveCount: parsed.moveCount });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid PGN payload", details: error.flatten() }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to import PGN." }, { status: 400 });
  }
}
