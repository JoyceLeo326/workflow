import type { AgentDefinition, AgentStep } from "./types";

export const AGENT_DEFINITIONS: AgentDefinition[] = [
  {
    id: "novel-analyst",
    name: "小说分析师",
    description: "提取主题、人物关系、冲突和章节结构",
  },
  {
    id: "script-adapter",
    name: "剧本改编师",
    description: "生成剧本结构和场次安排",
  },
  {
    id: "character-extractor",
    name: "角色提取师",
    description: "生成角色卡和人物视觉方向",
  },
  {
    id: "scene-extractor",
    name: "场景提取师",
    description: "生成场景卡、情绪和关键事件",
  },
  {
    id: "storyboard-artist",
    name: "分镜师",
    description: "生成镜头表、景别、运镜和字幕",
  },
  {
    id: "frame-prompt-engineer",
    name: "首尾帧生成师",
    description: "生成每个镜头的首尾帧画面提示词",
  },
  {
    id: "director",
    name: "总导演",
    description: "生成时间线、质量检查和成片预演说明",
  },
];

export function createInitialSteps(): AgentStep[] {
  return AGENT_DEFINITIONS.map((definition) => ({
    ...definition,
    status: "waiting",
    progress: 0,
  }));
}
