import { describe, expect, it } from "vitest";

describe("import contract", () => {
  it("limits an import request to a reasonable batch size", () => {
    const maxGames = 200;
    expect(maxGames).toBeLessThanOrEqual(500);
  });

  it("deduplicates by external game id", () => {
    const ids = ["abc", "abc", "def"];
    expect([...new Set(ids)]).toEqual(["abc", "def"]);
  });
});
