import { NextResponse } from "next/server";
import { getPlayerOpeningIntelligence } from "@/lib/openings/player-opening-intelligence";
import { errorMessage } from "@/lib/api/errors";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const normalized = username.trim();
  if (!normalized) return NextResponse.json({ error: "Username is required" }, { status: 400 });
  try {
    const data = await getPlayerOpeningIntelligence(normalized);
    if (!data) return NextResponse.json({ error: "Player not found", code: "PLAYER_NOT_FOUND" }, { status: 404 });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Opening intelligence API error:", error);
    return NextResponse.json({ error: "Opening intelligence is temporarily unavailable", detail: errorMessage(error) }, { status: 503 });
  }
}
