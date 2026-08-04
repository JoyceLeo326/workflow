import { describe, expect, it } from "vitest";

import {
  buildDelivery,
  buildDownloads,
  createRevision,
  generateCandidates,
  normalizeMission,
} from "./experience.mjs";

const source =
  "林默在停电的剧院后台找到一封没有署名的信。她以为父亲已经离开，却听见舞台上传来旧录音。灯光恢复时，信上的日期正是十年后的今天。";

describe("creative AI public mirror engine", () => {
  it("turns personal constraints and source text into three traceable trade-off routes", () => {
    const suspense = generateCandidates(
      normalizeMission({ creator: "许澄", audience: "悬疑追更", priority: "悬念节奏", minutes: 3, source }),
    );
    const emotion = generateCandidates(
      normalizeMission({ creator: "许澄", audience: "情感共鸣", priority: "人物情感", minutes: 5, source }),
    );

    expect(suspense).toHaveLength(3);
    expect(new Set(suspense.map((candidate) => candidate.id)).size).toBe(3);
    expect(suspense.every((candidate) => candidate.tradeoff && candidate.sourceAnchors.length >= 2)).toBe(true);
    expect(suspense[0].id).not.toBe(emotion[0].id);
  });

  it("creates a confirmed delivery and real Markdown/JSON payloads", () => {
    const mission = normalizeMission({ creator: "许澄", role: "编剧", priority: "低成本拍摄", minutes: 3, source });
    const candidate = generateCandidates(mission)[0];
    const delivery = buildDelivery(mission, candidate);
    const downloads = buildDownloads(delivery);

    expect(delivery.sections.length).toBeGreaterThanOrEqual(4);
    expect(downloads.markdown).toContain(candidate.title);
    expect(JSON.parse(downloads.json).decision.candidateId).toBe(candidate.id);
  });

  it("feeds local review evidence into the next revision action", () => {
    const mission = normalizeMission({ creator: "许澄", source });
    const delivery = buildDelivery(mission, generateCandidates(mission)[0]);
    const revision = createRevision(delivery, { score: 2, outcome: "钩子不够清楚", note: "读者没有理解那封信来自谁" });

    expect(revision.version).toBe(2);
    expect(revision.action).toContain("钩子");
    expect(revision.evidence).toContain("读者没有理解");
  });
});
