import type {
  ShotCard,
  TimelinePreview,
  WorkflowInput,
  WorkflowResults,
} from "./types";

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function excerpt(text: string, length = 72): string {
  const cleaned = cleanText(text);
  return cleaned.length > length ? `${cleaned.slice(0, length)}...` : cleaned;
}

function sourceNodes(text: string): string[] {
  const parts = cleanText(text)
    .split(/[。！？!?；;]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.slice(0, 12);
}

function makeShots(nodes: string[]): ShotCard[] {
  return nodes.map((node, index) => {
    const shotNumber = `S${String(index + 1).padStart(2, "0")}`;
    const durationSeconds = Math.min(12, Math.max(3, Math.ceil(node.length / 8)));

    return {
      id: `shot-${index + 1}`,
      shotNumber,
      sceneId: "",
      scene: "待拆分场景",
      visual: node,
      shotSize: "待设计",
      cameraMove: "待设计",
      narration: "",
      subtitle: node,
      durationSeconds,
      firstFramePrompt: "",
      lastFramePrompt: "",
    };
  });
}

function makeTimeline(shots: ShotCard[]): TimelinePreview {
  let cursor = 0;
  const items = shots.map((shot) => {
    const startSeconds = cursor;
    const endSeconds = cursor + shot.durationSeconds;
    cursor = endSeconds;

    return {
      shotNumber: shot.shotNumber,
      startSeconds,
      endSeconds,
      subtitle: shot.subtitle,
      narration: shot.narration,
      visualPrompt: "",
    };
  });

  return {
    totalDurationSeconds: cursor,
    items,
    narrationTrack: [],
    subtitleTrack: shots.map((shot) => shot.subtitle),
    visualPromptTrack: [],
  };
}

function segmentNodes(nodes: string[]): [string[], string[], string[]] {
  if (!nodes.length) return [[], [], []];
  const size = Math.max(1, Math.ceil(nodes.length / 3));
  return [nodes.slice(0, size), nodes.slice(size, size * 2), nodes.slice(size * 2)];
}

export function buildFallbackWorkflowResult(input: WorkflowInput): WorkflowResults {
  const title = input.title.trim() || "未命名小说";
  const sourceSummary = excerpt(input.sourceText);
  const nodes = sourceNodes(input.sourceText);
  const [opening, development, ending] = segmentNodes(nodes);
  const shots = makeShots(nodes);
  const timeline = makeTimeline(shots);

  return {
    scriptStructure: {
      title,
      logline: sourceSummary ? `原著开篇：${sourceSummary}` : "等待导入原著内容。",
      genre: "待确认类型",
      themes: ["待人工标注"],
      acts: [
        {
          name: "第一段：开篇",
          purpose: "按原文顺序保留开篇叙事节点。",
          beats: opening,
        },
        {
          name: "第二段：发展",
          purpose: "按原文顺序保留中段叙事节点。",
          beats: development,
        },
        {
          name: "第三段：当前结尾",
          purpose: "按原文顺序保留当前输入的结尾节点。",
          beats: ending,
        },
      ],
    },
    characters: [],
    scenes: [],
    shots,
    timeline,
    directorNotes: {
      summary: `已从《${title}》按原文顺序整理 ${nodes.length} 个叙事节点。`,
      qualityChecks: [
        "叙事节点均保留原文句子，没有补写人物或情节。",
        "镜头时长仅按文字长度估算，景别、运镜和场景仍待创作。",
        "当前没有生成图片、音频或视频资产。",
      ],
      nextSteps: [
        "确认故事类型、主要人物和场景",
        "将叙事节点编排为分集大纲",
        "连接生成服务后再创建角色圣经、场景圣经和标准剧本",
      ],
    },
  };
}
