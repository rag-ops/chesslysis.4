import { Chess, type Move } from "chess.js";

export type ParsedMove = {
  moveNumber: number;
  ply: number;
  color: "white" | "black";
  san: string;
  uci: string;
  fenBefore: string;
  fenAfter: string;
  capturedPiece?: string;
  isCheck: boolean;
  isCapture: boolean;
  isCastle: boolean;
  isPromotion: boolean;
};

function toUci(move: Move): string {
  return `${move.from}${move.to}${move.promotion ?? ""}`;
}

/** Generate one position record for every move in the PGN main line. */
export function generatePositions(pgn: string): ParsedMove[] {
  const parsed = new Chess();
  try {
    parsed.loadPgn(pgn, { strict: false });
  } catch (error) {
    throw new Error(`Invalid PGN: ${error instanceof Error ? error.message : "unknown error"}`);
  }

  const history = parsed.history({ verbose: true });
  if (history.length === 0) return [];

  const replay = new Chess();

  return history.map((move, index) => {
    const fenBefore = replay.fen();
    const played = replay.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion,
    });
    const fenAfter = replay.fen();
    const isCastle = played.isKingsideCastle() || played.isQueensideCastle();

    return {
      moveNumber: Math.floor(index / 2) + 1,
      ply: index + 1,
      color: move.color === "w" ? "white" : "black",
      san: move.san,
      uci: toUci(move),
      fenBefore,
      fenAfter,
      capturedPiece: move.captured,
      isCheck: replay.isCheck(),
      isCapture: Boolean(move.captured),
      isCastle,
      isPromotion: Boolean(move.promotion),
    };
  });
}
