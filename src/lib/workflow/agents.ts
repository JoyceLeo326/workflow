import type { AgentDefinition, AgentStep } from "./types";

export const AGENT_DEFINITIONS: AgentDefinition[] = [
  {
    id: "novel-analyst",
    name: "原著分析",
    description: "识别主题、人物关系、冲突和章节结构",
  },
  {
    id: "script-adapter",
    name: "改编规划",
    description: "形成剧本结构、节奏与场次安排",
  },
  {
    id: "character-extractor",
    name: "人物候选",
    description: "整理人物卡、关系与视觉方向",
  },
  {
    id: "scene-extractor",
    name: "场景候选",
    description: "整理场景卡、情绪和关键事件",
  },
  {
    id: "storyboard-artist",
    name: "镜头草案",
    description: "组织镜头表、景别、运镜和字幕",
  },
  {
    id: "frame-prompt-engineer",
    name: "画面提示",
    description: "整理每个镜头的首尾帧画面提示词",
  },
  {
    id: "director",
    name: "导演检查",
    description: "核对时序、连续性与交付完整度",
  },
];

export function createInitialSteps(): AgentStep[] {
  return AGENT_DEFINITIONS.map((definition) => ({
    ...definition,
    status: "waiting",
    progress: 0,
  }));
}
