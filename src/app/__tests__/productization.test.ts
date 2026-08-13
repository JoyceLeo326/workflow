import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("public product focus", () => {
  it("puts the story task before any standalone image archive", async () => {
    const workbench = await readFile("src/components/workbench.tsx", "utf8");

    expect(workbench).not.toContain("VisualStoryV3");
    expect(workbench).not.toContain("visualStoryStage");
  });

  it("keeps every primary stage reachable in the mobile header", async () => {
    const workbench = await readFile("src/components/workbench.tsx", "utf8");

    expect(workbench).not.toMatch(/<nav[^>]*className="[^"]*hidden[^"]*md:flex/);
    for (const stage of ["#brief", "#candidates", "#delivery"]) {
      expect(workbench).toContain(`href="${stage}"`);
    }
  });

  it("does not gate the public release on an image quantity", async () => {
    const [pkg, workflow, artifactGate, build] = await Promise.all([
      readFile("package.json", "utf8"),
      readFile(".github/workflows/ci.yml", "utf8"),
      readFile("scripts/pages-artifact-gate.mjs", "utf8"),
      readFile("scripts/build-product.mjs", "utf8"),
    ]);

    expect(JSON.parse(pkg).scripts.quality).not.toContain("visual-story:validate");
    expect(workflow).not.toMatch(/validate-image-delta|fifty newly added/i);
    expect(artifactGate).not.toMatch(/visualStoryV3Scenes|Expected 50 visual story/);
    expect(build).toContain('resolve(root, "out", "story-v3")');
  });
});
