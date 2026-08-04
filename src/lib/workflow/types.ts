import type { ProductionDocument, ProductionVersion } from "@/lib/production/types";

export type ProjectStatus = "draft" | "running" | "completed" | "failed";
export type AgentStepStatus = "waiting" | "running" | "completed" | "failed";

export type AgentKey =
  | "novel-analyst"
  | "script-adapter"
  | "character-extractor"
  | "scene-extractor"
  | "storyboard-artist"
  | "frame-prompt-engineer"
  | "director";

export type ModelConfig = {
  baseUrl?: string;
  model?: string;
};

export type CreatorRole = "编剧" | "制片统筹" | "IP责编";
export type TargetAudience = "悬疑追更" | "情感共鸣" | "轻喜反转";
export type AdaptationPriority = "人物情感" | "悬念节奏" | "低成本拍摄";
export type EpisodeMinutes = 1 | 3 | 5;

export type CreativeBrief = {
  creatorName: string;
  creatorRole: CreatorRole;
  targetAudience: TargetAudience;
  priority: AdaptationPriority;
  episodeMinutes: EpisodeMinutes;
  deliveryTime: string;
};

export type AdaptationDecision = {
  owner: string;
  deliveryTime: string;
  conflict: string;
  choice: string;
  audienceEffect: string;
  expectedOutcome: string;
  reviewPrompt: string;
};

export type AgentDefinition = {
  id: AgentKey;
  name: string;
  description: string;
};

export type AgentStep = AgentDefinition & {
  status: AgentStepStatus;
  progress: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
};

export type ScriptAct = {
  name: string;
  purpose: string;
  beats: string[];
};

export type ScriptStructure = {
  title: string;
  logline: string;
  genre: string;
  themes: string[];
  acts: ScriptAct[];
};

export type CharacterCard = {
  id: string;
  name: string;
  role: string;
  profile: string;
  goal: string;
  relationship: string;
  visualPrompt: string;
};

export type SceneCard = {
  id: string;
  name: string;
  time: string;
  location: string;
  mood: string;
  keyEvents: string[];
  visualPrompt: string;
};

export type ShotCard = {
  id: string;
  shotNumber: string;
  sceneId: string;
  scene: string;
  visual: string;
  shotSize: string;
  cameraMove: string;
  narration: string;
  subtitle: string;
  durationSeconds: number;
  firstFramePrompt: string;
  lastFramePrompt: string;
};

export type TimelineItem = {
  shotNumber: string;
  startSeconds: number;
  endSeconds: number;
  subtitle: string;
  narration: string;
  visualPrompt: string;
};

export type TimelinePreview = {
  totalDurationSeconds: number;
  items: TimelineItem[];
  narrationTrack: string[];
  subtitleTrack: string[];
  visualPromptTrack: string[];
};

export type DirectorNotes = {
  summary: string;
  qualityChecks: string[];
  nextSteps: string[];
};

export type WorkflowResults = {
  adaptationDecision: AdaptationDecision;
  scriptStructure: ScriptStructure;
  characters: CharacterCard[];
  scenes: SceneCard[];
  shots: ShotCard[];
  timeline: TimelinePreview;
  directorNotes: DirectorNotes;
};

export type Project = {
  id: string;
  title: string;
  sourceText: string;
  status: ProjectStatus;
  modelConfig: ModelConfig;
  creativeBrief?: CreativeBrief;
  steps: AgentStep[];
  results?: WorkflowResults;
  production?: ProductionDocument;
  productionHistory?: ProductionVersion[];
  error?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateProjectInput = {
  title: string;
  sourceText: string;
  modelConfig?: ModelConfig;
  creativeBrief?: CreativeBrief;
};

export type WorkflowInput = {
  title: string;
  sourceText: string;
  creativeBrief?: CreativeBrief;
};

export type RunEvent =
  | { type: "step"; step: AgentStep; project?: Project }
  | { type: "complete"; project: Project }
  | { type: "error"; error: string; project?: Project };
