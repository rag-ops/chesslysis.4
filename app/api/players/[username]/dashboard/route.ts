import { NextResponse } from "next/server";
import { getPlayerDashboard } from "@/lib/db/dashboard";
import { errorMessage } from "@/lib/api/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const normalized = username.trim();
  if (!normalized) return NextResponse.json({ error: "Username is required", code: "INVALID_USERNAME" }, { status: 400 });
  try {
    const data = await getPlayerDashboard(normalized);
    if (!data) return NextResponse.json({ error: "Player not imported yet", code: "PLAYER_NOT_IMPORTED" }, { status: 404 });
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Dashboard data is temporarily unavailable", detail: errorMessage(error), code: "DASHBOARD_UNAVAILABLE" }, { status: 503 });
  }
}
