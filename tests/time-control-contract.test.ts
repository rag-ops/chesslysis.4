import { describe, expect, it } from "vitest";
import { parseTimeControl } from "@/lib/time/player-time-management";

describe("time control taxonomy", () => {
  it.each([
    ["600", "rapid", "10 min"],
    ["900", "rapid", "15 min"],
    ["180", "blitz", "3 min"],
    ["180+2", "blitz", "3 min + 2"],
    ["60", "bullet", "1 min"],
    ["120+1", "bullet", "2 min + 1"],
  ] as const)("classifies %s", (input, bucket, label) => {
    const parsed = parseTimeControl(input);

    expect(parsed.bucket).toBe(bucket);
    expect(parsed.label).toBe(label);
  });

  it("keeps raw timing values separate from display labels", () => {
    expect(parseTimeControl("180+2")).toMatchObject({
      baseSeconds: 180,
      increment: 2,
      bucket: "blitz",
      label: "3 min + 2",
    });
  });
});
