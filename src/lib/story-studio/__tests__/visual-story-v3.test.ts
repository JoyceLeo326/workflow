import { spawnSync } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const manifestPath = "public/story-v3/manifest.json";

function webpDimensions(bytes: Buffer) {
  expect(bytes.subarray(0, 4).toString("ascii")).toBe("RIFF");
  expect(bytes.subarray(8, 12).toString("ascii")).toBe("WEBP");
  expect(bytes.subarray(12, 16).toString("ascii")).toBe("VP8 ");
  expect(bytes.subarray(23, 26).toString("hex")).toBe("9d012a");
  return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
}

describe("创剧 visual story v3", () => {
  it("ships exactly fifty unique generated story-production scenes with exact prompts", async () => {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
      project: string;
      version: number;
      assets: Array<{ id: string; file: string; prompt: string; usedIn: string[] }>;
    };
    expect(manifest.project).toBe("workflow");
    expect(manifest.version).toBe(3);
    expect(manifest.assets).toHaveLength(50);
    expect(new Set(manifest.assets.map((asset) => asset.id)).size).toBe(50);
    expect(new Set(manifest.assets.map((asset) => asset.file)).size).toBe(50);
    expect(new Set(manifest.assets.map((asset) => asset.prompt)).size).toBe(50);

    const runtime = await readFile("src/lib/story-studio/visual-story-v3.ts", "utf8");
    for (const asset of manifest.assets) {
      expect(asset.usedIn).toEqual(["src/lib/story-studio/visual-story-v3.ts"]);
      expect(runtime).toContain(asset.file.split("/").at(-1));
      const bytes = await readFile(asset.file);
      expect(webpDimensions(bytes)).toEqual({ width: 768, height: 512 });
      expect((await stat(asset.file)).size).toBeGreaterThan(20_000);
    }

    const validation = spawnSync(
      process.execPath,
      ["qa/validate-visual-story.mjs", "--root", ".", "--manifest", manifestPath],
      { encoding: "utf8" },
    );
    expect(validation.status, validation.stderr || validation.stdout).toBe(0);
    expect(JSON.parse(validation.stdout)).toEqual({
      project: "workflow",
      assetCount: 50,
      uniqueHashes: 50,
      runtimeReachable: 50,
    });
  });

  it("connects twenty core scenes and all fifty phase scenes to the real workbench journey", async () => {
    const [runtime, component, workbench, artifactGate] = await Promise.all([
      readFile("src/lib/story-studio/visual-story-v3.ts", "utf8"),
      readFile("src/components/visual-story-v3.tsx", "utf8"),
      readFile("src/components/workbench.tsx", "utf8"),
      readFile("scripts/pages-artifact-gate.mjs", "utf8"),
    ]);

    expect(runtime.match(/coreReachable:\s*true/g)).toHaveLength(20);
    expect(component).toContain("visualStoryV3");
    expect(component).toContain("loading=\"lazy\"");
    expect(component).toContain("width={768}");
    expect(component).toContain("height={512}");
    expect(component).toContain("min-h-11");
    expect(component).toContain("查看完整 50 幕");
    expect(component).toContain("aria-pressed");
    expect(workbench).toContain("<VisualStoryV3");
    for (const stage of ["intake", "compare", "confirm", "deliver", "revise"]) {
      expect(workbench).toContain(`setVisualStoryStage(\"${stage}\")`);
    }
    expect(artifactGate).toContain("story-v3");
    expect(artifactGate).toMatch(/visualStoryV3Scenes\.length !== 50/);
  });
});
