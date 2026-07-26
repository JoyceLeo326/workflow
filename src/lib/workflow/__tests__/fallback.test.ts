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
});
