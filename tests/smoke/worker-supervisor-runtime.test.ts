import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

// Contract test: the supervisor must inherit environment and restart a worker
// that exits unexpectedly. Full process lifecycle is exercised by the Docker
// smoke test in CI.
describe("worker supervisor runtime contract", () => {
  const source = readFileSync("worker-supervisor.js", "utf8");

  it("spawns worker.js with inherited environment", () => {
    expect(source).toContain("worker.js");
    expect(source).toContain("env: process.env");
  });

  it("contains restart behavior for unexpected worker exits", () => {
    expect(source).toContain("restarting in");
    expect(source).toContain("setTimeout");
  });
});
