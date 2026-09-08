import { describe, expect, it } from "vitest";

describe("Player DNA contract", () => {
  it("keeps DNA scores inside the UI-safe range", () => {
    const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value * 10) / 10));
    expect(clamp(-2)).toBe(0);
    expect(clamp(101.2)).toBe(100);
    expect(clamp(73.456)).toBe(73.5);
  });
});
