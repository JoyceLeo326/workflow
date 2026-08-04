import { describe, expect, it } from "vitest";
import { buildFallbackWorkflowResult } from "../fallback";

describe("buildFallbackWorkflowResult", () => {
  it("creates an evidence-bound structure draft without inventing characters, scenes, or media", () => {
    const result = buildFallbackWorkflowResult({
      title: "雨夜归途",
      sourceText:
        "雨夜，林澈回到旧城，发现父亲留下的录音。好友阿岚提醒他别追查，但他决定去废弃剧院寻找真相。",
    });

    expect(result.scriptStructure.title).toBe("雨夜归途");
    expect(result.scriptStructure.acts).toHaveLength(3);
    expect(result.scriptStructure.genre).toBe("待确认类型");
    expect(result.characters).toEqual([]);
    expect(result.scenes).toEqual([]);
    expect(result.shots.length).toBeGreaterThan(0);
    expect(result.shots.every((shot) => shot.shotSize === "待设计")).toBe(true);
    expect(result.shots.every((shot) => shot.firstFramePrompt === "")).toBe(true);
    expect(result.timeline.totalDurationSeconds).toBeGreaterThan(0);
    expect(result.directorNotes.qualityChecks).toContain("叙事节点均保留原文句子，没有补写人物或情节。");
    expect(result.directorNotes.nextSteps).toContain("确认故事类型、主要人物和场景");
  });

  it("lets the creator brief change the actual structure, shot candidates, and review loop", () => {
    const oneMinute = buildFallbackWorkflowResult({
      title: "雨夜归途",
      sourceText:
        "雨夜，林澈回到旧城。父亲的录音突然响起。阿岚劝他离开。林澈仍走进废弃剧院。旧灯亮起。黑衣人挡住去路。阿岚说出秘密。天亮前林澈作出选择。",
      creativeBrief: {
        creatorName: "许澄",
        creatorRole: "制片统筹",
        targetAudience: "悬疑追更",
        priority: "低成本拍摄",
        episodeMinutes: 1,
        deliveryTime: "周五 18:00",
      },
    });
    const fiveMinutes = buildFallbackWorkflowResult({
      title: "雨夜归途",
      sourceText:
        "雨夜，林澈回到旧城。父亲的录音突然响起。阿岚劝他离开。林澈仍走进废弃剧院。旧灯亮起。黑衣人挡住去路。阿岚说出秘密。天亮前林澈作出选择。",
      creativeBrief: {
        creatorName: "许澄",
        creatorRole: "制片统筹",
        targetAudience: "情感共鸣",
        priority: "人物情感",
        episodeMinutes: 5,
        deliveryTime: "周五 18:00",
      },
    });

    expect(oneMinute.adaptationDecision.owner).toBe("许澄 · 制片统筹");
    expect(oneMinute.adaptationDecision.conflict).toContain("1 分钟");
    expect(oneMinute.adaptationDecision.choice).toContain("合并重复地点");
    expect(oneMinute.adaptationDecision.audienceEffect).toContain("秘密揭示后置");
    expect(oneMinute.scriptStructure.themes).toContain("制作可行性");
    expect(oneMinute.shots.every((shot) => shot.scene === "场景候选（优先复用）")).toBe(true);
    expect(oneMinute.shots).toHaveLength(4);
    expect(fiveMinutes.shots.length).toBeGreaterThan(oneMinute.shots.length);
    expect(fiveMinutes.scriptStructure.themes).toContain("关系转折");
    expect(fiveMinutes.directorNotes.nextSteps.join(" ")).toContain("关系选择");
  });
});
