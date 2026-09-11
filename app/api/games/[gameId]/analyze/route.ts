import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { analysisSchema } from "@/lib/validation/api";
import { analyzeGame } from "@/lib/analysis/game-analyzer";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  try {
    const raw = await request.json().catch(() => ({}));
    const body = analysisSchema.parse(raw);
    const result = await analyzeGame(gameId, { depth: body.depth ?? 12 });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid analysis options", details: error.flatten() }, { status: 400 });
    const message = error instanceof Error ? error.message : "Unable to analyze game.";
    const status = message === "Game not found." ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
