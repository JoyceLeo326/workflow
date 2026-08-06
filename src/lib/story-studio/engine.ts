export type StoryGenre = "悬疑" | "都市情感" | "轻喜";
export type StoryAudience = "追更观众" | "情感共鸣" | "家庭共看";
export type StoryMinutes = 1 | 3 | 5;
export type StoryPace = "高密推进" | "层层递进" | "留白呼吸";
export type StoryMood = "冷峻" | "温暖" | "荒诞";
export type StoryPov = "第一人称" | "贴身第三人称" | "群像视角";
export type StoryPriority = "悬念钩子" | "人物关系" | "制作可行";
export type StoryConstraint = "单一地点" | "少场景" | "弹性制作";
export type FeedbackIssue = "钩子不够清楚" | "人物动机偏弱" | "节奏过满" | "拍摄负担偏高" | "可以继续";

export type StoryBrief = {
  creator: string;
  title: string;
  sourceText: string;
  genre: StoryGenre;
  audience: StoryAudience;
  minutes: StoryMinutes;
  pace: StoryPace;
  mood: StoryMood;
  pov: StoryPov;
  priority: StoryPriority;
  constraint: StoryConstraint;
};

export type FeedbackMemory = {
  round: number;
  issueCounts: Partial<Record<FeedbackIssue, number>>;
  lastIssue?: FeedbackIssue;
  lastCandidateId?: string;
  lastScore?: number;
};

export type StoryCandidate = {
  id: string;
  title: string;
  badge: string;
  thesis: string;
  score: number;
  recommended: boolean;
  reason: string;
  gain: string;
  tradeoff: string;
  sourceAnchors: string[];
  opening: string;
  ending: string;
  visualKeywords: string[];
  production: {
    sceneCount: number;
    castSize: number;
    nightRatio: number;
    summary: string;
  };
};

export type StorySection = {
  id: string;
  name: string;
  startSeconds: number;
  endSeconds: number;
  purpose: string;
  sourceAnchor: string;
};

export type StoryFeedback = {
  id: string;
  score: number;
  issue: FeedbackIssue;
  note: string;
  action: string;
  createdAt: string;
};

export type StoryDelivery = {
  schemaVersion: 1;
  version: number;
  createdAt: string;
  brief: StoryBrief;
  decision: {
    candidateId: string;
    title: string;
    score: number;
    reason: string;
    gain: string;
    tradeoff: string;
  };
  logline: string;
  narration: string;
  visualDirection: string;
  productionPlan: string;
  sections: StorySection[];
  sourceTrace: Array<{ id: string; text: string }>;
  feedbackHistory: StoryFeedback[];
  nextCheck: string;
};

type CandidateTemplate = {
  id: string;
  title: string;
  badge: string;
  thesis: string;
  gain: string;
  tradeoff: string;
  genres: StoryGenre[];
  audiences: StoryAudience[];
  minutes: StoryMinutes[];
  paces: StoryPace[];
  moods: StoryMood[];
  povs: StoryPov[];
  priorities: StoryPriority[];
  constraints: StoryConstraint[];
  anchorOffsets: number[];
  baseScenes: number;
  baseCast: number;
  visualKeywords: string[];
};

const DEFAULT_SOURCE =
  "雨夜，林澈回到旧城剧院。父亲留下的录音突然响起。阿岚劝他不要追查。林澈仍走上舞台。";

const ALLOWED = {
  genre: ["悬疑", "都市情感", "轻喜"] as StoryGenre[],
  audience: ["追更观众", "情感共鸣", "家庭共看"] as StoryAudience[],
  minutes: [1, 3, 5] as StoryMinutes[],
  pace: ["高密推进", "层层递进", "留白呼吸"] as StoryPace[],
  mood: ["冷峻", "温暖", "荒诞"] as StoryMood[],
  pov: ["第一人称", "贴身第三人称", "群像视角"] as StoryPov[],
  priority: ["悬念钩子", "人物关系", "制作可行"] as StoryPriority[],
  constraint: ["单一地点", "少场景", "弹性制作"] as StoryConstraint[],
};

const DEFAULT_BRIEF: StoryBrief = {
  creator: "许澄",
  title: "雨夜归途",
  sourceText: DEFAULT_SOURCE,
  genre: "悬疑",
  audience: "追更观众",
  minutes: 3,
  pace: "层层递进",
  mood: "冷峻",
  pov: "贴身第三人称",
  priority: "悬念钩子",
  constraint: "少场景",
};

const TEMPLATES: CandidateTemplate[] = [
  {
    id: "hook-first",
    title: "十秒失衡线",
    badge: "问题先行",
    thesis: "先让观众看见一个无法解释的结果，再回到人物作出选择之前。",
    gain: "首段问题清楚，段尾能自然形成下一集观看动力。",
    tradeoff: "人物关系需要后置补偿，原文证据不足时不能强行制造谜面。",
    genres: ["悬疑"],
    audiences: ["追更观众"],
    minutes: [3, 1],
    paces: ["层层递进", "高密推进"],
    moods: ["冷峻"],
    povs: ["贴身第三人称"],
    priorities: ["悬念钩子"],
    constraints: ["少场景", "弹性制作"],
    anchorOffsets: [4, 0, 2],
    baseScenes: 3,
    baseCast: 3,
    visualKeywords: ["雨夜", "聚光灯", "信件", "空舞台"],
  },
  {
    id: "relationship-echo",
    title: "关系回声线",
    badge: "人物先行",
    thesis: "从一个未说出口的关系动作进入，让秘密成为人物选择的代价。",
    gain: "人物动机更可感，信息揭示会落在关系变化而不是解释堆叠上。",
    tradeoff: "起势较慢，需要减少事件密度并给表演留出停顿。",
    genres: ["都市情感", "悬疑"],
    audiences: ["情感共鸣", "家庭共看"],
    minutes: [5, 3],
    paces: ["留白呼吸"],
    moods: ["温暖"],
    povs: ["第一人称", "贴身第三人称"],
    priorities: ["人物关系"],
    constraints: ["少场景", "弹性制作"],
    anchorOffsets: [0, 2, 3],
    baseScenes: 3,
    baseCast: 3,
    visualKeywords: ["窗边", "旧录音", "克制动作", "晨光"],
  },
  {
    id: "single-location",
    title: "一景压缩线",
    badge: "制作先行",
    thesis: "把时间、地点和关键道具锁在同一空间，用信息差完成转折。",
    gain: "场景集中、调度明确，能更快形成可执行的拍摄单元。",
    tradeoff: "世界信息和支线会被压缩，转折必须依靠表演与道具成立。",
    genres: ["轻喜", "悬疑"],
    audiences: ["家庭共看", "追更观众"],
    minutes: [1, 3],
    paces: ["高密推进"],
    moods: ["荒诞", "冷峻"],
    povs: ["第一人称"],
    priorities: ["制作可行"],
    constraints: ["单一地点", "少场景"],
    anchorOffsets: [1, 0, 4],
    baseScenes: 1,
    baseCast: 2,
    visualKeywords: ["单一空间", "关键道具", "近景", "反打"],
  },
  {
    id: "ensemble-crosscut",
    title: "群像交叉线",
    badge: "关系网络",
    thesis: "让不同人物围绕同一个证据作出相反选择，以交叉剪辑建立世界。",
    gain: "支线与人物立场都能保留，适合承载更完整的连续叙事。",
    tradeoff: "演员、地点和连续性管理更重，短篇幅容易削弱主角焦点。",
    genres: ["都市情感", "轻喜"],
    audiences: ["情感共鸣", "家庭共看"],
    minutes: [5],
    paces: ["层层递进"],
    moods: ["温暖", "荒诞"],
    povs: ["群像视角"],
    priorities: ["人物关系"],
    constraints: ["弹性制作"],
    anchorOffsets: [0, 1, 3],
    baseScenes: 5,
    baseCast: 5,
    visualKeywords: ["多人关系", "平行空间", "交叉剪辑", "群像"],
  },
];

function clean(value: unknown, fallback: string, length: number) {
  const normalized = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return normalized ? normalized.slice(0, length) : fallback;
}

function pick<T>(value: unknown, allowed: T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function normalizeStoryBrief(input: Partial<StoryBrief> = {}): StoryBrief {
  return {
    creator: clean(input.creator, DEFAULT_BRIEF.creator, 24),
    title: clean(input.title, DEFAULT_BRIEF.title, 48),
    sourceText: clean(input.sourceText, DEFAULT_SOURCE, 4800),
    genre: pick(input.genre, ALLOWED.genre, DEFAULT_BRIEF.genre),
    audience: pick(input.audience, ALLOWED.audience, DEFAULT_BRIEF.audience),
    minutes: pick(Number(input.minutes), ALLOWED.minutes, DEFAULT_BRIEF.minutes),
    pace: pick(input.pace, ALLOWED.pace, DEFAULT_BRIEF.pace),
    mood: pick(input.mood, ALLOWED.mood, DEFAULT_BRIEF.mood),
    pov: pick(input.pov, ALLOWED.pov, DEFAULT_BRIEF.pov),
    priority: pick(input.priority, ALLOWED.priority, DEFAULT_BRIEF.priority),
    constraint: pick(input.constraint, ALLOWED.constraint, DEFAULT_BRIEF.constraint),
  };
}

function sourceNodes(sourceText: string) {
  const nodes = sourceText
    .split(/[。！？!?；;]+/u)
    .map((node) => node.trim())
    .filter(Boolean);
  return nodes.length ? nodes.slice(0, 16) : [DEFAULT_SOURCE];
}

function anchorAt(nodes: string[], index: number) {
  return nodes[index % nodes.length] ?? nodes[0];
}

function affinity<T>(values: T[], value: T, weight: number) {
  return values.includes(value) ? weight : 0;
}

const feedbackTargets: Record<FeedbackIssue, string> = {
  钩子不够清楚: "hook-first",
  人物动机偏弱: "relationship-echo",
  节奏过满: "relationship-echo",
  拍摄负担偏高: "single-location",
  可以继续: "",
};

function candidateScore(template: CandidateTemplate, brief: StoryBrief, memory?: FeedbackMemory) {
  let score = 38;
  score += affinity(template.genres, brief.genre, 11);
  score += affinity(template.audiences, brief.audience, 9);
  score += affinity(template.minutes, brief.minutes, 7);
  score += affinity(template.paces, brief.pace, 7);
  score += affinity(template.moods, brief.mood, 6);
  score += affinity(template.povs, brief.pov, 5);
  score += affinity(template.priorities, brief.priority, 15);
  score += affinity(template.constraints, brief.constraint, 9);

  if (memory?.lastIssue && feedbackTargets[memory.lastIssue] === template.id) score += 50;
  if (
    memory?.lastIssue &&
    memory.lastIssue !== "可以继续" &&
    memory.lastCandidateId === template.id
  ) {
    score -= memory.lastScore && memory.lastScore <= 2 ? 24 : 14;
  }
  return Math.max(42, Math.min(98, score));
}

function productionShape(template: CandidateTemplate, brief: StoryBrief) {
  let sceneCount = template.baseScenes;
  if (brief.constraint === "单一地点") sceneCount = 1;
  if (brief.constraint === "少场景") sceneCount = Math.min(sceneCount, 2);
  if (brief.constraint === "弹性制作" && brief.minutes === 5) sceneCount += 1;
  const castSize = brief.constraint === "单一地点" ? Math.min(template.baseCast, 2) : template.baseCast;
  const nightRatio = brief.mood === "冷峻" ? 0.65 : brief.mood === "荒诞" ? 0.35 : 0.2;
  return {
    sceneCount,
    castSize,
    nightRatio,
    summary: `${sceneCount} 个场景 · ${castSize} 名主要人物 · ${brief.constraint}`,
  };
}

function candidateReason(template: CandidateTemplate, brief: StoryBrief, memory?: FeedbackMemory) {
  const matches = [
    template.genres.includes(brief.genre) ? `${brief.genre}类型` : null,
    template.audiences.includes(brief.audience) ? `${brief.audience}预期` : null,
    template.paces.includes(brief.pace) ? `${brief.pace}节奏` : null,
    template.priorities.includes(brief.priority) ? `${brief.priority}重点` : null,
    template.constraints.includes(brief.constraint) ? `${brief.constraint}限制` : null,
  ].filter(Boolean);
  const base = `按${brief.pov}与${brief.mood}影调计算；${matches.length ? `同时匹配${matches.join("、")}` : "需要主动接受更多取舍"}。`;
  if (memory?.lastIssue && feedbackTargets[memory.lastIssue] === template.id) {
    return `上轮反馈“${memory.lastIssue}”直接提高了这条路线的优先级。${base}`;
  }
  return base;
}

export function generateStoryCandidates(
  input: Partial<StoryBrief>,
  memory?: FeedbackMemory,
): StoryCandidate[] {
  const brief = normalizeStoryBrief(input);
  const nodes = sourceNodes(brief.sourceText);
  const ranked = TEMPLATES.map((template, index) => {
    const anchors = template.anchorOffsets.map((offset) => anchorAt(nodes, offset));
    const production = productionShape(template, brief);
    return {
      id: template.id,
      title: template.title,
      badge: template.badge,
      thesis: template.thesis,
      score: candidateScore(template, brief, memory),
      recommended: false,
      reason: candidateReason(template, brief, memory),
      gain: `${template.gain} 在 ${brief.minutes} 分钟内优先守住“${brief.priority}”。`,
      tradeoff: `${template.tradeoff} 当前“${brief.constraint}”要求会把场景控制在 ${production.sceneCount} 个。`,
      sourceAnchors: anchors,
      opening: `以“${anchors[0]}”作为第一处可见动作，采用${brief.pace}。`,
      ending: `在“${anchors[2]}”处停住，让${brief.audience}能复述下一步问题。`,
      visualKeywords: [...template.visualKeywords, brief.mood, brief.genre],
      production,
      rankSeed: index,
    };
  }).sort((left, right) => right.score - left.score || left.rankSeed - right.rankSeed);

  return ranked.map((rankedCandidate, index) => {
    const { rankSeed, ...candidate } = rankedCandidate;
    void rankSeed;
    return {
      ...candidate,
      recommended: index === 0,
    };
  });
}

export function buildStoryDelivery(
  input: Partial<StoryBrief>,
  candidate: StoryCandidate,
): StoryDelivery {
  const brief = normalizeStoryBrief(input);
  const total = brief.minutes * 60;
  const marks = [0, 0.14, 0.36, 0.62, 0.84, 1].map((ratio) => Math.round(total * ratio));
  const anchors = candidate.sourceAnchors;
  const purposes = [
    candidate.opening,
    `只补充理解人物选择所需的信息，以${brief.pov}保持观看距离。`,
    `让人物主动做出不可撤回的动作，并把“${brief.priority}”落实为可见选择。`,
    `兑现这条路线的代价：${candidate.tradeoff}`,
    candidate.ending,
  ];
  const names = ["冷开场", "关系进场", "不可撤回的选择", "代价显形", "段尾问题"];
  const sections = names.map((name, index) => ({
    id: `section-${index + 1}`,
    name,
    startSeconds: marks[index],
    endSeconds: marks[index + 1],
    purpose: purposes[index],
    sourceAnchor: anchorAt(anchors, index),
  }));

  return {
    schemaVersion: 1,
    version: 1,
    createdAt: new Date().toISOString(),
    brief,
    decision: {
      candidateId: candidate.id,
      title: candidate.title,
      score: candidate.score,
      reason: candidate.reason,
      gain: candidate.gain,
      tradeoff: candidate.tradeoff,
    },
    logline: `${anchors[0]}；为了守住${brief.priority}，人物必须在“${anchors[1]}”与“${anchors[2]}”之间作出选择。`,
    narration: `${brief.pov}叙事：只写人物当下能感知的动作和信息，不越过原文证据。`,
    visualDirection: `${brief.mood}影调，${candidate.visualKeywords.join("、")}；画面服务于${brief.genre}的核心问题。`,
    productionPlan: `${candidate.production.summary}；按${brief.constraint}安排调度，时长上限 ${brief.minutes} 分钟。`,
    sections,
    sourceTrace: [...new Set(anchors)].map((text, index) => ({ id: `S${index + 1}`, text })),
    feedbackHistory: [],
    nextCheck: `请${brief.audience}在无解释朗读后复述人物选择、主动代价与段尾问题。`,
  };
}

const feedbackActions: Record<FeedbackIssue, string> = {
  钩子不够清楚: "前移异常结果的视觉证据，删掉一个解释句，只保留一个能被复述的问题。",
  人物动机偏弱: "把人物的原文动作前移到选择节点，用可见代价代替口头说明。",
  节奏过满: "合并关系进场与选择节点，至少留出一次两秒停顿。",
  拍摄负担偏高: "优先复用同一地点与关键道具，删去不改变人物选择的调度。",
  可以继续: "锁定当前结构，只核对原文锚点与段尾问题是否一致。",
};

export function applyStoryFeedback(
  delivery: StoryDelivery,
  input: { score: number; issue: FeedbackIssue; note: string },
) {
  const score = Math.max(1, Math.min(5, Number(input.score) || 3));
  const issue = pick(input.issue, Object.keys(feedbackActions) as FeedbackIssue[], "可以继续");
  const note = clean(input.note, "本轮没有补充文字观察", 300);
  const action = `${feedbackActions[issue]}${score <= 2 ? " 本轮评分较低，下一版只验证这一项。" : ""}`;
  const revision: StoryFeedback = {
    id: `feedback-${delivery.feedbackHistory.length + 1}`,
    score,
    issue,
    note,
    action,
    createdAt: new Date().toISOString(),
  };
  const deliveryWithFeedback: StoryDelivery = {
    ...delivery,
    version: delivery.version + 1,
    feedbackHistory: [...delivery.feedbackHistory, revision],
    nextCheck: action,
  };
  const issueCounts = delivery.feedbackHistory.reduce<Partial<Record<FeedbackIssue, number>>>(
    (counts, item) => ({ ...counts, [item.issue]: (counts[item.issue] ?? 0) + 1 }),
    {},
  );
  issueCounts[issue] = (issueCounts[issue] ?? 0) + 1;

  return {
    delivery: deliveryWithFeedback,
    revision,
    memory: {
      round: delivery.feedbackHistory.length + 2,
      issueCounts,
      lastIssue: issue,
      lastCandidateId: delivery.decision.candidateId,
      lastScore: score,
    } satisfies FeedbackMemory,
  };
}

function markdownFor(delivery: StoryDelivery) {
  const lines = [
    `# ${delivery.brief.title} · ${delivery.decision.title} · 第 ${delivery.version} 版`,
    "",
    `- 主创：${delivery.brief.creator}`,
    `- 类型 / 受众：${delivery.brief.genre} / ${delivery.brief.audience}`,
    `- 时长 / 节奏：${delivery.brief.minutes} 分钟 / ${delivery.brief.pace}`,
    `- 视角 / 情绪：${delivery.brief.pov} / ${delivery.brief.mood}`,
    `- 制作限制：${delivery.brief.constraint}`,
    "",
    "## 选择理由",
    "",
    delivery.decision.reason,
    "",
    "## 明确取舍",
    "",
    `- 得到：${delivery.decision.gain}`,
    `- 放弃：${delivery.decision.tradeoff}`,
    "",
    "## 一句话故事",
    "",
    delivery.logline,
    "",
    "## 分段交付",
    "",
    ...delivery.sections.flatMap((section) => [
      `### ${section.name} · ${section.startSeconds}s–${section.endSeconds}s`,
      "",
      section.purpose,
      "",
      `原文锚点：${section.sourceAnchor}`,
      "",
    ]),
  ];
  if (delivery.feedbackHistory.length) {
    lines.push("## 反馈历史", "");
    for (const feedback of delivery.feedbackHistory) {
      lines.push(
        `- ${feedback.score}/5 · ${feedback.issue}`,
        `  - 观察：${feedback.note}`,
        `  - 下一步：${feedback.action}`,
      );
    }
  }
  lines.push("", "## 下一次验证", "", delivery.nextCheck);
  return `${lines.join("\n")}\n`;
}

export function buildStoryDownloads(delivery: StoryDelivery) {
  return {
    markdown: markdownFor(delivery),
    json: `${JSON.stringify(delivery, null, 2)}\n`,
  };
}
