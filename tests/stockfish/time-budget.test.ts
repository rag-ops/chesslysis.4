import { describe, expect, it } from "vitest";

describe("bounded engine search contract", () => {
  it("keeps dashboard profiles within a practical per-position budget", async () => {
    const { ANALYSIS_PROFILES } = await import("@/lib/analysis/queue");
    for (const profile of Object.values(ANALYSIS_PROFILES)) {
      expect(profile.moveTimeMs).toBeGreaterThanOrEqual(50);
      expect(profile.moveTimeMs).toBeLessThanOrEqual(1000);
    }
  });
});
