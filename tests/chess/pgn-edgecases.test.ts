import { describe, expect, it } from "vitest";
import { generatePositions } from "@/lib/chess/positions";

const ANNOTATED_PGN = `
[Event "Annotated"]
[White "Alice"]
[Black "Bob"]
[Result "1-0"]

1. e4 {King pawn} e5 2. Nf3 Nc6 (2... Nf6 3. Nxe5) 3. Bb5 a6 4. Ba4 Nf6 5. O-O 1-0
`;

const CHECKMATE_PGN = `
[Event "Mate"]
[White "Alice"]
[Black "Bob"]
[Result "1-0"]

1. f3 e5 2. g4 Qh4# 1-0
`;

describe("PGN edge cases", () => {
  it("ignores comments and variations while preserving the main line", () => {
    const moves = generatePositions(ANNOTATED_PGN);
    expect(moves.map((move) => move.san)).toEqual([
      "e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O",
    ]);
  });

  it("marks a checkmate move as check", () => {
    const moves = generatePositions(CHECKMATE_PGN);
    expect(moves.at(-1)).toMatchObject({ san: "Qh4#", isCheck: true });
  });
});
