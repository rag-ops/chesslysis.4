import { describe, expect, it } from "vitest";
import { generatePositions } from "@/lib/chess/positions";
import { parsePgn } from "@/lib/chess/pgn";

const STANDARD_PGN = `
[Event "Test"]
[Site "Chess.com"]
[White "Alice"]
[Black "Bob"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 1-0
`;

const PROMOTION_PGN = `
[Event "Promotion"]
[White "Alice"]
[Black "Bob"]
[Result "1-0"]

1. a4 h5 2. a5 h4 3. a6 h3 4. axb7 hxg2 5. bxa8=Q gxf1=Q+ 6. Kxf1 1-0
`;

describe("PGN position generation", () => {
  it("creates one record per ply with correct FEN transitions", () => {
    const moves = generatePositions(STANDARD_PGN);
    expect(moves).toHaveLength(17);
    expect(moves[0]).toMatchObject({
      ply: 1,
      moveNumber: 1,
      color: "white",
      san: "e4",
      uci: "e2e4",
      fenBefore: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    });
    expect(moves[8]).toMatchObject({ san: "O-O", isCastle: true });
  });

  it("detects checks, captures, castling and promotion", () => {
    const moves = generatePositions(PROMOTION_PGN);
    const promotion = moves.find((move) => move.isPromotion && move.color === "white");
    const check = moves.find((move) => move.isCheck);

    expect(promotion).toMatchObject({ san: "bxa8=Q", isPromotion: true, isCapture: true });
    expect(check?.isCheck).toBe(true);
  });

  it("rejects malformed or move-less PGNs", () => {
    expect(() => parsePgn("this is not a pgn")).toThrow();
    expect(() => parsePgn('[Event "No moves"]\n[Result "*"]')).toThrow(/no main-line moves/i);
  });
});

describe("PGN parsing", () => {
  it("normalizes headers and exposes final position", () => {
    const result = parsePgn(STANDARD_PGN);
    expect(result.headers.White).toBe("Alice");
    expect(result.headers.Black).toBe("Bob");
    expect(result.headers.Result).toBe("1-0");
    expect(result.moveCount).toBe(17);
    expect(result.finalFen.split(" ")[1]).toBe("b");
  });
});
