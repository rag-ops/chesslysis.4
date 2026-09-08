import { NextResponse } from "next/server";
import { getGameReview } from "@/lib/db/review";

export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const game = await getGameReview(gameId);
  if (!game) return NextResponse.json({ error: "Game not found." }, { status: 404 });
  return NextResponse.json(game);
}
