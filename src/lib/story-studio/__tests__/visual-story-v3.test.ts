import { readFile } from "node:fs/promises";
import { expect, it } from "vitest";

it("keeps the reviewed scene archive outside the public workbench and release", async () => {
  const [workbench, artifactGate, build] = await Promise.all([
    readFile("src/components/workbench.tsx", "utf8"),
    readFile("scripts/pages-artifact-gate.mjs", "utf8"),
    readFile("scripts/build-product.mjs", "utf8"),
  ]);

  expect(workbench).not.toContain("VisualStoryV3");
  expect(artifactGate).not.toContain("story-v3");
  expect(build).toContain('resolve(root, "out", "story-v3")');
});
