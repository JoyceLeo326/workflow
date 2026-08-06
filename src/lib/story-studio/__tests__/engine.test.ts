import {
  applyStoryFeedback,
  buildStoryDelivery,
  buildStoryDownloads,
  generateStoryCandidates,
  normalizeStoryBrief,
  type StoryBrief,
} from "../engine";

const sourceText =
  "雨夜，林澈回到旧城剧院。父亲留下的录音突然响起。阿岚劝他不要追查。林澈仍走上舞台。停电后，一封写着未来日期的信落在聚光灯下。";

const baseBrief: StoryBrief = {
  creator: "许澄",
  title: "雨夜归途",
  sourceText,
  genre: "悬疑",
  audience: "追更观众",
  minutes: 3,
  pace: "层层递进",
  mood: "冷峻",
  pov: "贴身第三人称",
  priority: "悬念钩子",
  constraint: "少场景",
};

function candidateFingerprint(brief: StoryBrief) {
  return generateStoryCandidates(brief)
    .map((candidate) => `${candidate.id}:${candidate.score}:${candidate.reason}`)
    .join("|");
}

describe("story decision engine", () => {
  it("normalizes a complete story brief without inventing source material", () => {
    const normalized = normalizeStoryBrief({ ...baseBrief, creator: " 许澄 ", sourceText });

    expect(normalized.creator).toBe("许澄");
    expect(normalized.sourceText).toBe(sourceText);
    expect(normalized.genre).toBe("悬疑");
  });

  it.each([
    ["genre", "都市情感"],
    ["audience", "家庭共看"],
    ["minutes", 1],
    ["pace", "留白呼吸"],
    ["mood", "温暖"],
    ["pov", "第一人称"],
    ["priority", "人物关系"],
    ["constraint", "单一地点"],
  ] as const)("makes %s causally change candidates", (key, value) => {
    const changed = { ...baseBrief, [key]: value } as StoryBrief;

    expect(candidateFingerprint(changed)).not.toBe(candidateFingerprint(baseBrief));
  });

  it("returns ranked alternatives with explicit gains, tradeoffs, evidence and production shape", () => {
    const candidates = generateStoryCandidates(baseBrief);

    expect(candidates).toHaveLength(4);
    expect(candidates[0].recommended).toBe(true);
    expect(new Set(candidates.map((candidate) => candidate.id)).size).toBe(4);
    for (const candidate of candidates) {
      expect(candidate.gain.length).toBeGreaterThan(10);
      expect(candidate.tradeoff.length).toBeGreaterThan(10);
      expect(candidate.sourceAnchors.length).toBeGreaterThanOrEqual(2);
      expect(candidate.production.sceneCount).toBeGreaterThan(0);
      for (const anchor of candidate.sourceAnchors) expect(sourceText).toContain(anchor);
    }
  });

  it("turns the selected route and all timing constraints into an editable delivery", () => {
    const selected = generateStoryCandidates(baseBrief)[0];
    const delivery = buildStoryDelivery(baseBrief, selected);

    expect(delivery.decision.candidateId).toBe(selected.id);
    expect(delivery.sections.at(-1)?.endSeconds).toBe(180);
    expect(delivery.narration).toContain("贴身第三人称");
    expect(delivery.visualDirection).toContain("冷峻");
    expect(delivery.productionPlan).toContain("少场景");
    expect(delivery.sections.every((section) => sourceText.includes(section.sourceAnchor))).toBe(
      true,
    );
  });

  it("uses feedback to change the next recommendation and explain why", () => {
    const firstCandidates = generateStoryCandidates(baseBrief);
    expect(firstCandidates[0].id).toBe("hook-first");
    const delivery = buildStoryDelivery(baseBrief, firstCandidates[0]);
    const feedback = applyStoryFeedback(delivery, {
      score: 1,
      issue: "人物动机偏弱",
      note: "试读者只记得信，没有说出林澈为什么回去。",
    });
    const nextCandidates = generateStoryCandidates(baseBrief, feedback.memory);

    expect(nextCandidates[0].id).toBe("relationship-echo");
    expect(nextCandidates[0].reason).toContain("上轮反馈");
    expect(feedback.revision.action).toContain("人物");
    expect(feedback.memory.round).toBe(2);
  });

  it("builds real Markdown and JSON downloads with decision and feedback history", () => {
    const selected = generateStoryCandidates(baseBrief)[0];
    const delivery = buildStoryDelivery(baseBrief, selected);
    const feedback = applyStoryFeedback(delivery, {
      score: 2,
      issue: "拍摄负担偏高",
      note: "夜景切换次数超出当前排期。",
    });
    const downloads = buildStoryDownloads(feedback.delivery);
    const parsed = JSON.parse(downloads.json) as typeof feedback.delivery;

    expect(downloads.markdown).toContain("明确取舍");
    expect(downloads.markdown).toContain("夜景切换次数超出当前排期");
    expect(parsed.feedbackHistory).toHaveLength(1);
    expect(parsed.decision.tradeoff).toBe(selected.tradeoff);
  });
});

