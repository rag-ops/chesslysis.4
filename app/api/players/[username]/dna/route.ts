import { NextResponse } from "next/server";
import { getPlayerDNA } from "@/lib/dna/player-dna";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  if (!username.trim()) return NextResponse.json({ error: "Username is required" }, { status: 400 });
  try {
    const data = await getPlayerDNA(username);
    if (!data) return NextResponse.json({ error: "Player not found", code: "PLAYER_NOT_FOUND" }, { status: 404 });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Player DNA API error", error);
    return NextResponse.json({ error: "Player DNA is temporarily unavailable" }, { status: 503 });
  }
}
