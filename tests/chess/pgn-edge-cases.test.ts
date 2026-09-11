import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";

describe("PGN/chess edge cases", () => {
  it("handles castling", () => {
    const chess = new Chess();
    chess.loadPgn("1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. O-O");
    expect(chess.history()).toContain("O-O");
  });

  it("handles promotion", () => {
    const chess = new Chess("8/P7/8/8/8/8/8/k6K w - - 0 1");
    const move = chess.move({ from: "a7", to: "a8", promotion: "q" });
    expect(move?.promotion).toBe("q");
  });

  it("detects checkmate", () => {
    const chess = new Chess();
    chess.loadPgn("1. f3 e5 2. g4 Qh4#");
    expect(chess.isCheckmate()).toBe(true);
  });
});
