import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

describe("Chesslysis architecture smoke test", () => {
  it("contains the core analysis layers", () => {
    const paths = [
      "lib/chess",
      "lib/chesscom",
      "lib/stockfish",
      "lib/analysis",
      "lib/db",
    ];
    for (const p of paths) expect(existsSync(resolve(process.cwd(), p))).toBe(true);
  });
});
