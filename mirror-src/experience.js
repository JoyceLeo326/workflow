const DEFAULT_SOURCE =
  "林默在停电的剧院后台找到一封没有署名的信。她以为父亲已经离开，却听见舞台上传来旧录音。灯光恢复时，信上的日期正是十年后的今天。";

const ALLOWED = {
  role: ["编剧", "制片统筹", "IP 责编"],
  audience: ["悬疑追更", "情感共鸣", "轻喜反转"],
  priority: ["人物情感", "悬念节奏", "低成本拍摄"],
  minutes: [1, 3, 5],
};

const BLUEPRINTS = [
  {
    id: "suspense-hook",
    title: "十秒失衡线",
    badge: "钩子先行",
    priority: "悬念节奏",
    audience: "悬疑追更",
    preferredMinutes: 3,
    thesis: "先让观众看见一个无法解释的结果，再回到人物作出选择之前。",
    gain: "首屏问题明确，段尾能自然形成追更动力。",
    tradeoff: "人物关系需要后置补偿；若原文证据过少，悬念会显得刻意。",
  },
  {
    id: "emotion-echo",
    title: "关系回声线",
    badge: "人物先行",
    priority: "人物情感",
    audience: "情感共鸣",
    preferredMinutes: 5,
    thesis: "从一个未说出口的关系动作进入，让秘密成为人物选择的代价。",
    gain: "人物动机更可感，结尾反转会落在关系变化而非信息奇观上。",
    tradeoff: "起势较慢，需要牺牲一部分事件密度并给表演留出停顿。",
  },
  {
    id: "single-stage",
    title: "一景压缩线",
    badge: "制作先行",
    priority: "低成本拍摄",
    audience: "轻喜反转",
    preferredMinutes: 1,
    thesis: "把时间、地点和关键道具锁在同一场景，用信息差完成转折。",
    gain: "场景集中、调度明确，能快速形成可拍摄的最小闭环。",
    tradeoff: "世界观与支线会被压缩，反转必须依靠表演和道具细节成立。",
  },
];

function clean(value, fallback, length = 80) {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, length) : fallback;
}

function pick(value, choices, fallback) {
  return choices.includes(value) ? value : fallback;
}

export function normalizeMission(input = {}) {
  return {
    creator: clean(input.creator, "许澄", 24),
    role: pick(input.role, ALLOWED.role, "编剧"),
    audience: pick(input.audience, ALLOWED.audience, "悬疑追更"),
    priority: pick(input.priority, ALLOWED.priority, "悬念节奏"),
    minutes: pick(Number(input.minutes), ALLOWED.minutes, 3),
    deadline: clean(input.deadline, "周五 18:00", 32),
    source: clean(input.source, DEFAULT_SOURCE, 2400),
  };
}

export function splitSource(source) {
  const normalized = clean(source, DEFAULT_SOURCE, 2400);
  const sentences = normalized
    .split(/(?<=[。！？!?；;])/u)
    .map((item) => item.trim())
    .filter(Boolean);

  if (sentences.length >= 3) return sentences.slice(0, 12);

  const fragments = normalized
    .split(/[，,、：:]/u)
    .map((item) => item.trim())
    .filter(Boolean);
  return [...sentences, ...fragments, normalized].filter((item, index, list) => list.indexOf(item) === index).slice(0, 12);
}

function anchorAt(nodes, index) {
  return nodes[index % nodes.length] ?? nodes[0];
}

function scoreBlueprint(blueprint, mission) {
  let score = 68;
  if (blueprint.priority === mission.priority) score += 17;
  if (blueprint.audience === mission.audience) score += 9;
  score += Math.max(0, 7 - Math.abs(blueprint.preferredMinutes - mission.minutes) * 2);
  return Math.min(97, score);
}

export function generateCandidates(input = {}) {
  const mission = normalizeMission(input);
  const nodes = splitSource(mission.source);

  return BLUEPRINTS.map((blueprint, templateIndex) => {
    const offsets = blueprint.id === "suspense-hook" ? [2, 0, 1] : blueprint.id === "emotion-echo" ? [0, 1, 2] : [1, 0, 2];
    const sourceAnchors = offsets.map((offset) => anchorAt(nodes, offset));
    const opening =
      blueprint.id === "suspense-hook"
        ? `先给出异常结果：“${sourceAnchors[0]}”随后倒回它发生前。`
        : blueprint.id === "emotion-echo"
          ? `从人物仍在克制的动作进入：“${sourceAnchors[0]}”让关系先于解释发生。`
          : `把“${sourceAnchors[0]}”收进一个地点，用同一道具连接前后信息。`;
    const ending =
      blueprint.id === "emotion-echo"
        ? `让“${sourceAnchors[2]}”成为人物主动承担的后果。`
        : `在“${sourceAnchors[2]}”处停住，只回答一个问题，同时制造下一个问题。`;

    return {
      ...blueprint,
      rankSeed: templateIndex,
      score: scoreBlueprint(blueprint, mission),
      opening,
      ending,
      sourceAnchors,
      runtime: `${mission.minutes} 分钟`,
      ownerFit: `${mission.creator}以${mission.role}视角优先核对${mission.priority}。`,
    };
  }).sort((left, right) => right.score - left.score || left.rankSeed - right.rankSeed);
}

function section(name, start, end, purpose, sourceAnchor) {
  return { name, time: `${start}s–${end}s`, purpose, sourceAnchor };
}

export function buildDelivery(input, candidate) {
  const mission = normalizeMission(input);
  const total = mission.minutes * 60;
  const marks = [0, 0.14, 0.38, 0.67, 0.87, 1].map((ratio) => Math.round(total * ratio));
  const anchors = candidate.sourceAnchors;

  return {
    schemaVersion: 1,
    version: 1,
    project: "创剧 AI 静态兼容模式",
    mission,
    decision: {
      candidateId: candidate.id,
      title: candidate.title,
      score: candidate.score,
      thesis: candidate.thesis,
      gain: candidate.gain,
      tradeoff: candidate.tradeoff,
      confirmedBy: `${mission.creator} · ${mission.role}`,
      deadline: mission.deadline,
    },
    logline: `${anchors[0]}；为了守住${mission.priority}，人物必须在${anchors[1]}与${anchors[2]}之间作出选择。`,
    sections: [
      section("冷开场", marks[0], marks[1], candidate.opening, anchors[0]),
      section("矛盾进场", marks[1], marks[2], `只补充理解人物选择所需的信息，面向${mission.audience}建立观看承诺。`, anchors[1]),
      section("选择节点", marks[2], marks[3], `让人物主动做出不可撤回的动作；镜头必须能回溯到原文。`, anchors[1]),
      section("代价显形", marks[3], marks[4], `兑现${candidate.tradeoff.split("；")[0]}，不额外虚构原文事实。`, anchors[2]),
      section("段尾钩子", marks[4], marks[5], candidate.ending, anchors[2]),
    ],
    sourceTrace: anchors.map((text, index) => ({ id: `S${index + 1}`, text })),
    nextCheck: `在${mission.deadline}前，用一次无解释朗读验证观众能否说出人物选择与段尾问题。`,
    revisions: [],
  };
}

function markdownFor(delivery) {
  const currentVersion = delivery.revisions?.at(-1)?.version ?? delivery.version;
  const lines = [
    `# ${delivery.decision.title} · 第 ${currentVersion} 版`,
    "",
    `- 创作者：${delivery.decision.confirmedBy}`,
    `- 受众：${delivery.mission.audience}`,
    `- 优先目标：${delivery.mission.priority}`,
    `- 交付时间：${delivery.decision.deadline}`,
    `- 路线收益：${delivery.decision.gain}`,
    `- 明确代价：${delivery.decision.tradeoff}`,
    "",
    "## 一句话故事",
    "",
    delivery.logline,
    "",
    "## 分段交付",
    "",
    ...delivery.sections.flatMap((item) => [
      `### ${item.name} · ${item.time}`,
      "",
      item.purpose,
      "",
      `原文锚点：${item.sourceAnchor}`,
      "",
    ]),
    "## 下一次验证",
    "",
    delivery.nextCheck,
  ];

  if (delivery.revisions?.length) {
    lines.push("", "## 本地反馈回流", "");
    for (const revision of delivery.revisions) {
      lines.push(`- 第 ${revision.version} 版动作：${revision.action}`, `  - 证据：${revision.evidence}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

export function buildDownloads(delivery) {
  return {
    markdown: markdownFor(delivery),
    json: `${JSON.stringify(delivery, null, 2)}\n`,
  };
}

export function createRevision(delivery, feedback = {}) {
  const score = Math.max(1, Math.min(5, Number(feedback.score) || 3));
  const outcome = clean(feedback.outcome, "需要继续验证", 40);
  const note = clean(feedback.note, "本轮没有补充文字观察", 240);
  const actionMap = {
    "钩子不够清楚": "前移段尾问题的视觉证据，并删掉一个解释句，让钩子能被复述。",
    "人物动机偏弱": "把原文动作提前到选择节点，用一个可见代价替代口头说明。",
    "节奏过满": "合并矛盾进场与选择节点，至少留出一次两秒停顿。",
    "拍摄负担偏高": "保留同一场景与核心道具，删去不改变选择的调度。",
    "可以继续": "锁定当前结构，只验证段尾问题与原文锚点是否一致。",
  };
  const baseAction = actionMap[outcome] ?? "把观察对应到一个原文锚点，只修改一处结构后再次验证。";
  const action = score <= 2 ? `${baseAction} 本轮评分较低，下一版只验证这一项。` : baseAction;

  return {
    version: Number(delivery.version || 1) + (delivery.revisions?.length || 0) + 1,
    score,
    outcome,
    evidence: note,
    action,
  };
}
