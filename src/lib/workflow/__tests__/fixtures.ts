import { buildFallbackWorkflowResult } from "../fallback";
import type { Project } from "../types";

export function makeProjectFixture(): Project {
  return {
    id: "project-fixture",
    title: "雨夜归途",
    sourceText: "雨夜，林澈回到旧城，发现父亲留下的录音。",
    status: "completed",
    modelConfig: {
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-chat",
    },
    creativeBrief: {
      creatorName: "许澄",
      creatorRole: "编剧",
      targetAudience: "悬疑追更",
      priority: "悬念节奏",
      episodeMinutes: 3,
      deliveryTime: "周五 18:00",
    },
    steps: [],
    results: buildFallbackWorkflowResult({
      title: "雨夜归途",
      sourceText: "雨夜，林澈回到旧城，发现父亲留下的录音。",
      creativeBrief: {
        creatorName: "许澄",
        creatorRole: "编剧",
        targetAudience: "悬疑追更",
        priority: "悬念节奏",
        episodeMinutes: 3,
        deliveryTime: "周五 18:00",
      },
    }),
    createdAt: "2026-07-07T00:00:00.000Z",
    updatedAt: "2026-07-07T00:00:00.000Z",
  };
}
