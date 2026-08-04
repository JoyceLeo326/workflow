import type {
  AdaptationDecision,
  AdaptationPriority,
  CreativeBrief,
  CreatorRole,
  EpisodeMinutes,
  TargetAudience,
} from "./types";

export const DEFAULT_CREATIVE_BRIEF: CreativeBrief = {
  creatorName: "许澄",
  creatorRole: "编剧",
  targetAudience: "悬疑追更",
  priority: "悬念节奏",
  episodeMinutes: 3,
  deliveryTime: "周五 18:00",
};

const ROLES: CreatorRole[] = ["编剧", "制片统筹", "IP责编"];
const AUDIENCES: TargetAudience[] = ["悬疑追更", "情感共鸣", "轻喜反转"];
const PRIORITIES: AdaptationPriority[] = ["人物情感", "悬念节奏", "低成本拍摄"];
const DURATIONS: EpisodeMinutes[] = [1, 3, 5];

export function normalizeCreativeBrief(input?: Partial<CreativeBrief>): CreativeBrief {
  return {
    creatorName: input?.creatorName?.trim().slice(0, 24) || DEFAULT_CREATIVE_BRIEF.creatorName,
    creatorRole: ROLES.includes(input?.creatorRole as CreatorRole)
      ? (input?.creatorRole as CreatorRole)
      : DEFAULT_CREATIVE_BRIEF.creatorRole,
    targetAudience: AUDIENCES.includes(input?.targetAudience as TargetAudience)
      ? (input?.targetAudience as TargetAudience)
      : DEFAULT_CREATIVE_BRIEF.targetAudience,
    priority: PRIORITIES.includes(input?.priority as AdaptationPriority)
      ? (input?.priority as AdaptationPriority)
      : DEFAULT_CREATIVE_BRIEF.priority,
    episodeMinutes: DURATIONS.includes(Number(input?.episodeMinutes) as EpisodeMinutes)
      ? (Number(input?.episodeMinutes) as EpisodeMinutes)
      : DEFAULT_CREATIVE_BRIEF.episodeMinutes,
    deliveryTime: input?.deliveryTime?.trim().slice(0, 32) || DEFAULT_CREATIVE_BRIEF.deliveryTime,
  };
}

export const priorityChoices: Record<AdaptationPriority, string> = {
  人物情感: "宁可减少事件数量，也保留人物动机、关系转折与选择的代价。",
  悬念节奏: "每段保留一个可追溯的悬念节点，删减不推进冲突的重复信息。",
  低成本拍摄: "优先合并重复地点与群像调度，保留真正推动主线的原文节点。",
};

export const audienceEffects: Record<TargetAudience, string> = {
  悬疑追更: "候选结构把秘密揭示后置，并在段尾留下可由原文验证的问题。",
  情感共鸣: "候选结构优先呈现关系选择及其代价，不让事件压过人物动机。",
  轻喜反转: "候选结构标记误会与信息差节点，反转仍须能回到原文核对。",
};

export const priorityThemes: Record<AdaptationPriority, string[]> = {
  人物情感: ["人物动机", "关系转折"],
  悬念节奏: ["悬念递进", "结尾钩子"],
  低成本拍摄: ["场景复用", "制作可行性"],
};

const roleReviews: Record<CreatorRole, string> = {
  编剧: "回到原文核对人物动机与段尾钩子，确认取舍后再进入分集。",
  制片统筹: "核对场景复用、单集时长与交付风险，确认后再进入分场。",
  IP责编: "核对核心设定与人物关系是否偏离原著，确认后再进入改写。",
};

export function buildAdaptationDecision(
  input: Partial<CreativeBrief> | undefined,
  totalNodeCount: number,
  selectedNodeCount: number,
): AdaptationDecision {
  const brief = normalizeCreativeBrief(input);
  const omitted = Math.max(0, totalNodeCount - selectedNodeCount);

  return {
    owner: `${brief.creatorName} · ${brief.creatorRole}`,
    deliveryTime: brief.deliveryTime,
    conflict: `原著当前 ${totalNodeCount} 个叙事节点需压缩进 ${brief.episodeMinutes} 分钟，既要形成观看节奏，也不能把改编建议冒充原著事实。${omitted ? `本轮先处理前 ${selectedNodeCount} 个节点，其余 ${omitted} 个留待下一轮。` : "本轮保留全部可识别节点。"}`,
    choice: priorityChoices[brief.priority],
    audienceEffect: audienceEffects[brief.targetAudience],
    expectedOutcome: `在${brief.deliveryTime}前交付一份可回溯原文、可继续分集的结构草案。`,
    reviewPrompt: roleReviews[brief.creatorRole],
  };
}

export function countNarrativeNodes(sourceText: string): number {
  return sourceText
    .replace(/\s+/g, " ")
    .trim()
    .split(/[。！？!?；;]+/)
    .map((part) => part.trim())
    .filter(Boolean).length;
}
