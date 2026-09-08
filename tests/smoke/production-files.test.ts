import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";

describe("production setup", () => {
  it("contains the deployment essentials", () => {
    for (const file of ["Dockerfile", "docker-compose.yml", ".dockerignore", ".env.example", ".github/workflows/ci.yml"]) {
      expect(existsSync(file)).toBe(true);
    }
  });
});
