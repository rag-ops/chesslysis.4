import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { importPlayerGames } from "@/lib/chesscom/import-player";

export const runtime = "nodejs";

const schema = z.object({
  username: z.string().trim().regex(/^[A-Za-z0-9_-]{3,25}$/, "Invalid Chess.com username format."),
  maxGames: z.number().int().min(1).max(200).optional().default(50),
  timeClasses: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const result = await importPlayerGames(body.username, {
      maxGames: body.maxGames,
      timeClasses: body.timeClasses,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid import request", details: error.flatten() }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unable to import games.";
    const status = /not found|invalid/i.test(message) ? 404 : /rate limit/i.test(message) ? 429 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
