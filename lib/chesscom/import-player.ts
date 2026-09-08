import { db } from "@/lib/db/prisma";
import { generatePositions } from "@/lib/chess/positions";
import { getPlayerProfile, importGamesFromChessCom, type ImportOptions } from "@/lib/chesscom/client";
import { assertValidChessComUsername } from "@/lib/chesscom/username";

export type ImportResult = {
  username: string;
  found: number;
  imported: number;
  skipped: number;
  gameIds: string[];
};

export async function importPlayerGames(
  username: string,
  options: ImportOptions = {},
): Promise<ImportResult> {
  const requestedUsername = assertValidChessComUsername(username);
  // Resolve the profile first so database identity uses Chess.com's canonical casing.
  // This prevents duplicate players when the same username is entered with different case.
  const profile = await getPlayerProfile(requestedUsername);
  const normalized = profile.username.trim();
  const games = await importGamesFromChessCom(normalized, options);

  const player = await db.player.upsert({
    where: { platform_username: { platform: "chess.com", username: normalized } },
    update: { username: normalized },
    create: { username: normalized, platform: "chess.com" },
  });

  let imported = 0;
  let skipped = 0;
  const gameIds: string[] = [];

  for (const game of games) {
    if (!game.pgn) { skipped++; continue; }
    const externalId = game.uuid ?? game.url;
    try {
      const existing = await db.game.findUnique({
        where: { playerId_externalId: { playerId: player.id, externalId } },
        select: { id: true },
      });
      if (existing) { skipped++; gameIds.push(existing.id); continue; }

      const moves = generatePositions(game.pgn);
      const created = await db.game.create({
        data: {
          playerId: player.id,
          externalId,
          whiteUsername: game.white.username,
          blackUsername: game.black.username,
          whiteRating: game.white.rating,
          blackRating: game.black.rating,
          result: game.white.result === "win" ? "1-0" : game.black.result === "win" ? "0-1" : "1/2-1/2",
          timeControl: game.time_control,
          playedAt: game.end_time ? new Date(game.end_time * 1000) : null,
          pgn: game.pgn,
          eco: game.eco,
          analysisStatus: "NOT_ANALYZED",
          moves: { create: moves },
        },
        select: { id: true },
      });
      imported++;
      gameIds.push(created.id);
    } catch (error) {
      // A single malformed public PGN must not abort an entire username import.
      console.warn("Skipping Chess.com game during import", externalId, error);
      skipped++;
    }
  }

  return { username: player.username, found: games.length, imported, skipped, gameIds };
}
