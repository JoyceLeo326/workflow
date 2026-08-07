import { describe, expect, it } from "vitest";
import { buildStoryDelivery, generateStoryCandidates, normalizeStoryBrief } from "../engine";
import { buildProductionPackageFiles } from "../production-pack";
import { scenesForCandidate } from "../scenes";

describe("production package", () => {
  it("turns a confirmed decision into executable script, storyboard, shots and manifest", () => {
    const brief = normalizeStoryBrief({
      creator: "许澄",
      title: "雨夜剧院",
      sourceText:
        "雨夜，林澈回到旧城剧院。父亲留下的录音突然响起。阿岚劝他离开。停电后，未来日期的信落在聚光灯下。",
      genre: "悬疑",
      audience: "追更观众",
      mood: "冷峻",
      priority: "悬念钩子",
      constraint: "少场景",
    });
    const selected = generateStoryCandidates(brief)[0];
    const delivery = buildStoryDelivery(brief, selected);
    const scenes = scenesForCandidate(selected.id, brief.mood, 5);
    const files = buildProductionPackageFiles(delivery, scenes);

    expect(files.script).toContain("雨夜剧院");
    expect(files.storyboardCsv.split("\n")).toHaveLength(7);
    expect(files.shotListCsv).toContain('"01-1"');
    expect(files.shotListCsv.split("\n")).toHaveLength(17);
    expect(files.productionPlan).toContain("现场检查");
    expect(files.productionPlan).toContain(delivery.decision.tradeoff);
    const manifest = JSON.parse(files.manifest) as { visualAssets: unknown[]; files: string[] };
    expect(manifest.visualAssets).toHaveLength(5);
    expect(manifest.files).toContain("shot-list.csv");
  });
});
