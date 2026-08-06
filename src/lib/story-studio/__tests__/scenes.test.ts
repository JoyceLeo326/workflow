import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { scenesForCandidate, storyScenes } from "@/lib/story-studio/scenes";

const routeIds = [
  "hook-first",
  "relationship-echo",
  "single-location",
  "ensemble-crosscut",
] as const;

describe("self-hosted story scene library", () => {
  it("publishes at least 24 individually authored WebP scenes", async () => {
    expect(storyScenes.length).toBeGreaterThanOrEqual(24);
    expect(new Set(storyScenes.map((scene) => scene.id)).size).toBe(storyScenes.length);
    expect(new Set(storyScenes.map((scene) => scene.src)).size).toBe(storyScenes.length);

    const hashes = await Promise.all(
      storyScenes.map(async (scene) => {
        expect(scene.src).toMatch(/^\/story-scenes\/[a-z0-9-]+\.webp$/);
        expect(scene.alt.length).toBeGreaterThan(12);
        expect(scene.title.length).toBeGreaterThan(3);
        expect(scene.routeIds.length).toBeGreaterThan(0);
        expect(scene.moods.length).toBeGreaterThan(0);

        const file = await readFile(path.join(process.cwd(), "public", scene.src));
        expect(file.byteLength).toBeGreaterThan(30_000);
        expect(file.subarray(0, 4).toString("ascii")).toBe("RIFF");
        expect(file.subarray(8, 12).toString("ascii")).toBe("WEBP");
        return createHash("sha256").update(file).digest("hex");
      }),
    );

    expect(new Set(hashes).size).toBe(storyScenes.length);
  });

  it("gives every candidate route a deep and mood-aware visual vocabulary", () => {
    for (const routeId of routeIds) {
      const routeScenes = storyScenes.filter((scene) => scene.routeIds.includes(routeId));
      expect(routeScenes.length).toBeGreaterThanOrEqual(6);
      expect(new Set(routeScenes.flatMap((scene) => scene.moods)).size).toBeGreaterThanOrEqual(3);
    }
  });

  it("selects usable storyboards from route and mood instead of a static gallery", () => {
    const restrained = scenesForCandidate("single-location", "温暖", 5);
    const suspenseful = scenesForCandidate("hook-first", "悬疑", 5);

    expect(restrained).toHaveLength(5);
    expect(suspenseful).toHaveLength(5);
    expect(restrained.every((scene) => scene.routeIds.includes("single-location"))).toBe(true);
    expect(suspenseful.every((scene) => scene.routeIds.includes("hook-first"))).toBe(true);
    expect(restrained.map((scene) => scene.id)).not.toEqual(
      suspenseful.map((scene) => scene.id),
    );
  });
});
