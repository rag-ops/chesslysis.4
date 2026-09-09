import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("production worker runtime", () => {
  it("starts only after health and emits a heartbeat", () => {
    const start = readFileSync("scripts-start.sh", "utf8");
    const worker = readFileSync("worker.js", "utf8");
    expect(start).toContain("/api/health");
    expect(worker).toContain("chesslysis-worker-heartbeat");
    expect(worker).toContain("ANALYSIS_WORKER_TOKEN");
  });
});
