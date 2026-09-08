import { NextResponse } from "next/server";
import { importPlayerGames } from "@/lib/chesscom/import-player";
import { isValidChessComUsername } from "@/lib/chesscom/username";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function boundedInteger(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), min), max);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  if (!isValidChessComUsername(username)) {
    return NextResponse.json(
      { error: "Invalid Chess.com username format.", code: "INVALID_USERNAME" },
      { status: 400 },
    );
  }

  try {
    const body: unknown = await request.json().catch(() => ({}));
    const payload = body && typeof body === "object" ? body as { maxGames?: unknown } : {};
    const maxGames = boundedInteger(payload.maxGames, 30, 1, 100);
    const result = await importPlayerGames(username, { maxGames });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to sync player.";
    if (/invalid chess\.com username/i.test(message)) {
      return NextResponse.json({ error: message, code: "INVALID_USERNAME" }, { status: 400 });
    }
    if (/not found/i.test(message)) {
      return NextResponse.json({ error: message, code: "CHESSCOM_NOT_FOUND" }, { status: 404 });
    }
    if (/rate.limit/i.test(message)) {
      return NextResponse.json({ error: message, code: "CHESSCOM_RATE_LIMITED" }, { status: 429 });
    }
    if (/timed out/i.test(message)) {
      return NextResponse.json({ error: message, code: "CHESSCOM_TIMEOUT" }, { status: 504 });
    }
    return NextResponse.json({ error: message, code: "CHESSCOM_SYNC_FAILED" }, { status: 502 });
  }
}
