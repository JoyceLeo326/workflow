import type { Project } from "./types";

export function buildWorkflowMessages(project: Project) {
  const contract = {
    scriptStructure: {
      title: "string",
      logline: "string",
      genre: "string",
      themes: ["string"],
      acts: [{ name: "string", purpose: "string", beats: ["string"] }],
    },
    characters: [
      {
        id: "string",
        name: "string",
        role: "string",
        profile: "string",
        goal: "string",
        relationship: "string",
        visualPrompt: "string",
      },
    ],
    scenes: [
      {
        id: "string",
        name: "string",
        time: "string",
        location: "string",
        mood: "string",
        keyEvents: ["string"],
        visualPrompt: "string",
      },
    ],
    shots: [
      {
        id: "string",
        shotNumber: "S01",
        sceneId: "string",
        scene: "string",
        visual: "string",
        shotSize: "string",
        cameraMove: "string",
        narration: "string",
        subtitle: "string",
        durationSeconds: 6,
        firstFramePrompt: "string",
        lastFramePrompt: "string",
      },
    ],
    timeline: {
      totalDurationSeconds: 42,
      items: [
        {
          shotNumber: "S01",
          startSeconds: 0,
          endSeconds: 6,
          subtitle: "string",
          narration: "string",
          visualPrompt: "string",
        },
      ],
      narrationTrack: ["string"],
      subtitleTrack: ["string"],
      visualPromptTrack: ["string"],
    },
    directorNotes: {
      summary: "string",
      qualityChecks: ["string"],
      nextSteps: ["string"],
    },
  };

  return [
    {
      role: "system" as const,
      content:
        "你是一个小说改剧 AI Agent 团队总控。只返回严格 JSON，不要解释，不要 markdown。所有字段必须是中文内容，visualPrompt 字段可以使用英文影视提示词。",
    },
    {
      role: "user" as const,
      content: [
        `项目标题：${project.title}`,
        "请模拟 7 个 Agent 的协作结果：小说分析师、剧本改编师、角色提取师、场景提取师、分镜师、首尾帧生成师、总导演。",
        "输出必须完全匹配以下 JSON 结构，至少 3 个角色、3 个场景、6 个镜头：",
        JSON.stringify(contract, null, 2),
        "小说原文：",
        project.sourceText.slice(0, 12000),
      ].join("\n\n"),
    },
  ];
}
