import { describe, expect, it } from "vitest";
import { withTimeout } from "@/lib/analysis/timeout";

describe("analysis timeout", () => {
  it("returns a completed task", async () => {
    await expect(withTimeout(Promise.resolve("ok"), 100)).resolves.toBe("ok");
  });

  it("rejects a slow task", async () => {
    const slow = new Promise(resolve => setTimeout(() => resolve("late"), 50));
    await expect(withTimeout(slow, 5)).rejects.toThrow("Operation timed out");
  });
});
