import { describe, expect, it } from "vitest";
import { assertValidChessComUsername, isValidChessComUsername, normalizeChessComUsername } from "@/lib/chesscom/username";

describe("Chess.com username validation", () => {
  it("accepts normal Chess.com username characters", () => {
    expect(isValidChessComUsername("hikaru")).toBe(true);
    expect(isValidChessComUsername("player_123")).toBe(true);
    expect(isValidChessComUsername("name-with-dash")).toBe(true);
  });

  it("normalizes surrounding whitespace without changing identity casing", () => {
    expect(normalizeChessComUsername("  Player_Name  ")).toBe("Player_Name");
  });

  it("rejects malformed usernames", () => {
    expect(isValidChessComUsername("ab")).toBe(false);
    expect(isValidChessComUsername("bad name")).toBe(false);
    expect(isValidChessComUsername("bad/name")).toBe(false);
  });

  it("throws a stable error for invalid usernames", () => {
    expect(() => assertValidChessComUsername("bad name")).toThrow("Invalid Chess.com username format.");
  });
});
