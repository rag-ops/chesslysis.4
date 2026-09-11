import { NextResponse } from "next/server";
import { getPlayerTimeManagement } from "@/lib/time/player-time-management";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  if (!username.trim()) return NextResponse.json({ error: "Username is required" }, { status: 400 });
  try {
    const data = await getPlayerTimeManagement(username);
    if (!data) return NextResponse.json({ error: "Player not found", code: "PLAYER_NOT_FOUND" }, { status: 404 });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Time management API error", error);
    return NextResponse.json({ error: "Time management data is temporarily unavailable" }, { status: 503 });
  }
}
