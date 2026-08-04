import { describe, expect, it } from "vitest";
import { exportProjectAsCsv, exportProjectAsJson, exportProjectAsMarkdown } from "../exporters";
import { makeProjectFixture } from "./fixtures";

describe("workflow exporters", () => {
  it("exports markdown with script, characters, scenes, shots, and timeline", () => {
    const markdown = exportProjectAsMarkdown(makeProjectFixture());

    expect(markdown).toContain("# 雨夜归途");
    expect(markdown).toContain("## 剧本结构");
    expect(markdown).toContain("## 角色列表");
    expect(markdown).toContain("## 场景列表");
    expect(markdown).toContain("## 分镜表");
    expect(markdown).toContain("## 时序草案");
    expect(markdown).toContain("## 本轮改编决策");
    expect(markdown).toContain("许澄 · 编剧");
    expect(markdown).toContain("悬疑追更");
  });

  it("exports shot CSV with stable columns", () => {
    const csv = exportProjectAsCsv(makeProjectFixture());

    expect(csv.split("\n")[0]).toBe(
      "目标观众,本轮优先,单集分钟,镜号,场景,画面,景别,运镜,旁白,字幕,时长秒,首帧提示词,尾帧提示词",
    );
    expect(csv).toContain("S01");
    expect(csv).toContain("悬疑追更,悬念节奏,3");
  });

  it("exports machine-readable JSON", () => {
    const json = exportProjectAsJson(makeProjectFixture());
    const parsed = JSON.parse(json);

    expect(parsed.title).toBe("雨夜归途");
    expect(parsed.results.shots).toHaveLength(1);
  });
});
