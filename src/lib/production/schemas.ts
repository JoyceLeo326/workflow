import { z } from "zod";

const nonEmpty = z.string().trim().min(1);

export const productionCharacterSchema = z.object({
  id: nonEmpty,
  name: nonEmpty,
  role: z.string(),
  goal: z.string(),
  arc: z.string(),
  relationships: z.string(),
  sourceRef: nonEmpty,
});

export const productionLocationSchema = z.object({
  id: nonEmpty,
  name: nonEmpty,
  description: z.string(),
  sourceRef: nonEmpty,
});

export const productionSceneSchema = z.object({
  id: nonEmpty,
  sceneNumber: z.number().int().positive(),
  heading: nonEmpty,
  summary: z.string(),
  action: z.string(),
  characters: z.array(z.string()),
  dialogue: z.string(),
  sourceRef: nonEmpty,
  durationSeconds: z.number().int().min(1).max(3600),
});

export const productionEpisodeSchema = z.object({
  id: nonEmpty,
  episodeNumber: z.number().int().positive(),
  title: nonEmpty,
  logline: z.string(),
  endingHook: z.string(),
  scenes: z.array(productionSceneSchema),
});

export const productionDocumentSchema = z.object({
  schemaVersion: z.literal("1"),
  version: z.number().int().positive(),
  updatedAt: z.string().datetime(),
  storyBible: z.object({
    title: nonEmpty,
    logline: z.string(),
    genre: z.string(),
    themes: z.array(z.string()),
    characters: z.array(productionCharacterSchema),
    locations: z.array(productionLocationSchema),
  }),
  episodes: z.array(productionEpisodeSchema).min(1),
});
