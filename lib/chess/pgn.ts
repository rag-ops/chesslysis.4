import { Chess } from "chess.js";
import { generatePositions, type ParsedMove } from "./positions";

export type ParsedGame = {
  headers: Record<string, string>;
  moves: ParsedMove[];
  finalFen: string;
  moveCount: number;
};

/**
 * Parse a complete PGN into normalized headers and a main-line move sequence.
 * We fail closed: a malformed or move-less PGN is not accepted for analytics.
 */
export function parsePgn(pgn: string): ParsedGame {
  if (!pgn.trim()) throw new Error("PGN cannot be empty.");

  const chess = new Chess();
  try {
    chess.loadPgn(pgn, { strict: false });
  } catch (error) {
    throw new Error(`Invalid PGN: ${error instanceof Error ? error.message : "unknown error"}`);
  }

  const moves = generatePositions(pgn);
  if (moves.length === 0) throw new Error("Invalid PGN: no main-line moves found.");

  return {
    headers: { ...chess.getHeaders() },
    moves,
    finalFen: chess.fen(),
    moveCount: moves.length,
  };
}
