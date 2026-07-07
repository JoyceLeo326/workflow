import { z } from "zod";

const scriptActSchema = z.object({
  name: z.string(),
  purpose: z.string(),
  beats: z.array(z.string()),
});

const scriptStructureSchema = z.object({
  title: z.string(),
  logline: z.string(),
  genre: z.string(),
  themes: z.array(z.string()),
  acts: z.array(scriptActSchema),
});

const characterSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  profile: z.string(),
  goal: z.string(),
  relationship: z.string(),
  visualPrompt: z.string(),
});

const sceneSchema = z.object({
  id: z.string(),
  name: z.string(),
  time: z.string(),
  location: z.string(),
  mood: z.string(),
  keyEvents: z.array(z.string()),
  visualPrompt: z.string(),
});

const shotSchema = z.object({
  id: z.string(),
  shotNumber: z.string(),
  sceneId: z.string(),
  scene: z.string(),
  visual: z.string(),
  shotSize: z.string(),
  cameraMove: z.string(),
  narration: z.string(),
  subtitle: z.string(),
  durationSeconds: z.number(),
  firstFramePrompt: z.string(),
  lastFramePrompt: z.string(),
});

const timelineItemSchema = z.object({
  shotNumber: z.string(),
  startSeconds: z.number(),
  endSeconds: z.number(),
  subtitle: z.string(),
  narration: z.string(),
  visualPrompt: z.string(),
});

const timelineSchema = z.object({
  totalDurationSeconds: z.number(),
  items: z.array(timelineItemSchema),
  narrationTrack: z.array(z.string()),
  subtitleTrack: z.array(z.string()),
  visualPromptTrack: z.array(z.string()),
});

const directorNotesSchema = z.object({
  summary: z.string(),
  qualityChecks: z.array(z.string()),
  nextSteps: z.array(z.string()),
});

export const workflowResultsSchema = z.object({
  scriptStructure: scriptStructureSchema,
  characters: z.array(characterSchema),
  scenes: z.array(sceneSchema),
  shots: z.array(shotSchema),
  timeline: timelineSchema,
  directorNotes: directorNotesSchema,
});
