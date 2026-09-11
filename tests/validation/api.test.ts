import { describe, expect, it } from "vitest";
import { usernameSchema, analysisSchema } from "@/lib/validation/api";

describe("API validation", () => {
  it("accepts a normal username", () => {
    expect(usernameSchema.parse({ username: "player123" }).username).toBe("player123");
  });

  it("rejects an empty username", () => {
    expect(() => usernameSchema.parse({ username: " " })).toThrow();
  });

  it("rejects unsafe analysis depths", () => {
    expect(() => analysisSchema.parse({ depth: 5 })).toThrow();
    expect(() => analysisSchema.parse({ depth: 31 })).toThrow();
  });

  it("accepts supported analysis depths", () => {
    expect(analysisSchema.parse({ depth: 18 }).depth).toBe(18);
  });
});
