import { describe, expect, it } from "vitest";
import { detectTacticalPatterns } from "@/lib/analysis/patterns";

describe("tactical pattern detector", () => {
  it("does not invent a pattern when the destination is invalid", () => {
    expect(detectTacticalPatterns("8/8/8/8/8/8/8/8 w - - 0 1", "e2e4")).toEqual([]);
  });
  it("detects a simple knight fork geometry", () => {
    // White knight on e5 attacks c6/c4/d7/f7/g6/g4/c?; black rooks on c6 and f7.
    const tags = detectTacticalPatterns("8/5r2/2r5/4N3/8/8/8/4K3 b - - 0 1", "f3e5");
    expect(tags).toContain("fork");
  });

  it("labels a pin as 'pin', not 'skewer', when the more valuable piece is behind", () => {
    // White bishop lands on b2. Diagonal b2-c3-d4-e5-f6: black knight on d4 (first
    // blocker) with the black king behind it on f6. The knight is pinned to its king.
    const tags = detectTacticalPatterns("8/8/5k2/8/3n4/8/1B6/6K1 b - - 0 1", "a1b2");
    expect(tags).toContain("pin");
    expect(tags).not.toContain("skewer");
  });

  it("labels a skewer as 'skewer', not 'pin', when the more valuable piece is in front", () => {
    // White rook lands on e1. It attacks the black queen on e5 first; a black rook
    // sits behind the queen on e8. The queen (worth more) must move, dropping the rook.
    const tags = detectTacticalPatterns("k3r3/8/8/4q3/8/8/6K1/4R3 b - - 0 1", "a1e1");
    expect(tags).toContain("skewer");
    expect(tags).not.toContain("pin");
  });

  it("flags a move that allows the opponent to deliver mate in one", () => {
    // White king on g1 is boxed in by its own f2/g2/h2 pawns. Black rook on d5 can
    // play ...Rd1#: the back rank is clear, and the rook covers g1's only escape
    // squares (f1/h1) once the king is removed from g1. White has no other piece
    // that can block or capture on d1. The a2-a4 pawn push is an unrelated "last move"
    // included only so the function has a valid moved-piece square to key off of.
    const tags = detectTacticalPatterns("k7/8/8/3r4/P7/8/5PPP/6K1 b - - 0 1", "a2a4");
    expect(tags).toContain("allows mate in 1");
  });
});
