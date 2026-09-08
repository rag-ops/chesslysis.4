import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { parsePgn } from "@/lib/chess/pgn";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_PGN_BYTES = 250_000;

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => ({}));
    const pgn = body && typeof body === "object" && "pgn" in body && typeof (body as { pgn?: unknown }).pgn === "string"
      ? (body as { pgn: string }).pgn
      : "";

    if (!pgn.trim()) {
      return NextResponse.json({ error: "PGN cannot be empty.", code: "PGN_EMPTY" }, { status: 400 });
    }
    if (new TextEncoder().encode(pgn).length > MAX_PGN_BYTES) {
      return NextResponse.json({ error: "PGN is too large.", code: "PGN_TOO_LARGE" }, { status: 413 });
    }

    const parsed = parsePgn(pgn);
    const headers = parsed.headers;
    const white = headers.White?.trim() || "White";
    const black = headers.Black?.trim() || "Black";
    const result = ["1-0", "0-1", "1/2-1/2", "*"].includes(headers.Result ?? "*") ? headers.Result ?? "*" : "*";
    const playedAt = headers.Date && /^\d{4}\.\d{2}\.\d{2}$/.test(headers.Date)
      ? new Date(headers.Date.replace(/\./g, "-") + "T00:00:00.000Z")
      : null;

    const guestUsername = `pgn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`.slice(0, 25);
    const player = await db.player.create({
      data: { platform: "pgn", username: guestUsername },
      select: { id: true },
    });

    const externalId = `pgn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    const game = await db.game.create({
      data: {
        playerId: player.id,
        externalId,
        whiteUsername: white,
        blackUsername: black,
        whiteRating: headers.WhiteElo && /^\d+$/.test(headers.WhiteElo) ? Number(headers.WhiteElo) : null,
        blackRating: headers.BlackElo && /^\d+$/.test(headers.BlackElo) ? Number(headers.BlackElo) : null,
        result,
        timeControl: headers.TimeControl || null,
        playedAt,
        pgn,
        eco: headers.ECO || null,
        opening: headers.Opening || null,
        analysisStatus: "NOT_ANALYZED",
        moves: { create: parsed.moves },
      },
      select: { id: true },
    });

    return NextResponse.json({ gameId: game.id, moveCount: parsed.moveCount, status: "CREATED" }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create game from PGN.";
    return NextResponse.json({ error: message, code: "PGN_IMPORT_FAILED" }, { status: 400 });
  }
}
