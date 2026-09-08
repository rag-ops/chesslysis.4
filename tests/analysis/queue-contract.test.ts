import { describe, expect, it } from "vitest";
import { ANALYSIS_PROFILES, isAnalysisProfile } from "@/lib/analysis/queue";

describe("phase 4 analysis queue contract", () => {
  it("exposes bounded quality profiles", () => {
    expect(ANALYSIS_PROFILES.quick.depth).toBe(10);
    expect(ANALYSIS_PROFILES.standard.depth).toBe(14);
    expect(ANALYSIS_PROFILES.deep.depth).toBe(18);
  });
  it("accepts only supported profile names", () => {
    expect(isAnalysisProfile("quick")).toBe(true);
    expect(isAnalysisProfile("deep")).toBe(true);
    expect(isAnalysisProfile("turbo")).toBe(false);
  });
});

it("uses a durable job-item model and an internal worker boundary", async () => {
  const fs = await import("node:fs/promises");
  const schema = await fs.readFile("prisma/schema.prisma", "utf8");
  const queue = await fs.readFile("lib/analysis/queue.ts", "utf8");
  expect(schema).toContain("model AnalysisJobItem");
  expect(queue).toContain("processNextAnalysisJob");
  expect(queue).toContain("updateMany");
});
