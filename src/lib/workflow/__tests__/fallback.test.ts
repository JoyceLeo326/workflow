import { describe, expect, it } from "vitest";
import { buildFallbackWorkflowResult } from "../fallback";

describe("buildFallbackWorkflowResult", () => {
  it("creates complete script, character, scene, shot, and timeline output from source text", () => {
    const result = buildFallbackWorkflowResult({
      title: "雨夜归途",
      sourceText:
        "雨夜，林澈回到旧城，发现父亲留下的录音。好友阿岚提醒他别追查，但他决定去废弃剧院寻找真相。",
    });

    expect(result.scriptStructure.title).toBe("雨夜归途");
    expect(result.scriptStructure.acts).toHaveLength(3);
    expect(result.characters.length).toBeGreaterThanOrEqual(3);
    expect(result.scenes.length).toBeGreaterThanOrEqual(3);
    expect(result.shots).toHaveLength(6);
    expect(result.timeline.totalDurationSeconds).toBeGreaterThan(0);
    expect(result.directorNotes.qualityChecks).toContain("已生成剧本结构、角色、场景、分镜和成片预演。");
    expect(result.directorNotes.qualityChecks).toContain("本地规则演示，不是 AI 生成。");
    expect(result.directorNotes.nextSteps).toContain(
      "连接用户或机构自有 Provider 后再生成图片、配音或视频",
    );
  });
});
