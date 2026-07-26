import type { Project } from "@/lib/workflow/types";
import type { ProductionDocument } from "./types";

function sourceRef(index: number) {
  return `原著节点 ${index + 1}`;
}

export function productionFromProject(project: Project): ProductionDocument {
  const now = new Date().toISOString();
  const results = project.results;
  const structure = results?.scriptStructure;
  const shots = results?.shots ?? [];

  return {
    schemaVersion: "1",
    version: 1,
    updatedAt: now,
    storyBible: {
      title: structure?.title || project.title,
      logline: structure?.logline || "",
      genre: structure?.genre === "待确认类型" ? "" : structure?.genre || "",
      themes: structure?.themes.filter((theme) => !theme.startsWith("待")) ?? [],
      characters:
        results?.characters.map((character, index) => ({
          id: character.id,
          name: character.name,
          role: character.role,
          goal: character.goal,
          arc: character.profile,
          relationships: character.relationship,
          sourceRef: sourceRef(index),
        })) ?? [],
      locations:
        results?.scenes.map((scene, index) => ({
          id: scene.id,
          name: scene.name,
          description: [scene.location, scene.time, scene.mood].filter(Boolean).join(" · "),
          sourceRef: sourceRef(index),
        })) ?? [],
    },
    episodes: [
      {
        id: `episode-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
        episodeNumber: 1,
        title: project.title,
        logline: structure?.logline || "",
        endingHook: shots.at(-1)?.subtitle ?? "",
        scenes: shots.map((shot, index) => ({
          id: shot.id,
          sceneNumber: index + 1,
          heading: shot.scene && !shot.scene.startsWith("待") ? shot.scene : `场景 ${index + 1}`,
          summary: shot.visual,
          action: shot.visual,
          characters: [],
          dialogue: shot.subtitle,
          sourceRef: sourceRef(index),
          durationSeconds: Math.max(1, Math.round(shot.durationSeconds)),
        })),
      },
    ],
  };
}
