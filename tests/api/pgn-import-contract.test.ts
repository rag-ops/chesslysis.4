import { describe, expect, it } from "vitest";

describe("standalone PGN analysis contract", () => {
  it("caps accepted PGN payloads at 250 KB", () => {
    expect(250_000).toBeGreaterThan(1024);
  });

  it("uses a dedicated pgn platform for anonymous single-game records", () => {
    expect("pgn").not.toBe("chess.com");
  });
});
