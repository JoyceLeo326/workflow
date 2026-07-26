import { describe, expect, it } from "vitest";
import { restoreProductionVersion, saveProductionVersion } from "../versioning";
import { makeProductionDocument } from "./fixtures";

describe("production version history", () => {
  it("records immutable local snapshots and increments the document version", () => {
    const original = makeProductionDocument();
    const saved = saveProductionVersion(original, [], "完善人物弧", "2026-07-27T01:00:00.000Z");

    expect(saved.document.version).toBe(2);
    expect(saved.history).toHaveLength(1);
    expect(saved.history[0].label).toBe("完善人物弧");
    expect(saved.history[0].document.version).toBe(2);

    saved.document.storyBible.logline = "后来修改";
    expect(saved.history[0].document.storyBible.logline).not.toBe("后来修改");
  });

  it("restores a selected snapshot as a new version without erasing later history", () => {
    const original = makeProductionDocument();
    const first = saveProductionVersion(original, [], "初版", "2026-07-27T01:00:00.000Z");
    const edited = structuredClone(first.document);
    edited.storyBible.genre = "都市悬疑";
    const second = saveProductionVersion(
      edited,
      first.history,
      "类型调整",
      "2026-07-27T02:00:00.000Z",
    );

    const restored = restoreProductionVersion(
      second.history,
      first.history[0].id,
      "2026-07-27T03:00:00.000Z",
    );

    expect(restored.document.storyBible.genre).toBe("悬疑短剧");
    expect(restored.document.version).toBe(4);
    expect(restored.history).toHaveLength(3);
    expect(restored.history.at(-1)?.label).toContain("恢复");
  });
});
