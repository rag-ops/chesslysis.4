import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";

describe("production setup", () => {
  it("contains the deployment essentials", () => {
    for (const file of ["Dockerfile", "docker-compose.yml", ".dockerignore", ".env.example", ".github/workflows/ci.yml", "app/analyze/page.tsx"]) {
      expect(existsSync(file)).toBe(true);
    }
  });
});

it("does not retain deleted demo-data imports in the production source graph", () => {
  const visit = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? visit(`${dir}/${entry.name}`) : [`${dir}/${entry.name}`]);
  const files = [...visit("app"), ...visit("components"), ...visit("lib")].filter(file => /\.(ts|tsx)$/.test(file));
  for (const file of files) expect(readFileSync(file, "utf8")).not.toContain("@/lib/demo/player-demo");
});
