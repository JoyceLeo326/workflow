import { buildStoryDownloads, type StoryDelivery } from "@/lib/story-studio/engine";
import type { StoryScene } from "@/lib/story-studio/scenes";

export type ProductionPackageFiles = {
  script: string;
  storyboardCsv: string;
  shotListCsv: string;
  productionPlan: string;
  manifest: string;
};

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function csvRow(values: Array<string | number>) {
  return values.map(csvCell).join(",");
}

function shotGrammar(delivery: StoryDelivery, index: number) {
  const pace = delivery.brief.pace;
  const pov = delivery.brief.pov;
  const mood = delivery.brief.mood;
  const opening = pov === "第一人称" ? "主观近景" : pov === "群像视角" ? "关系全景" : "跟随中景";
  const bridge = pace === "高密推进" ? "动作切入" : pace === "留白呼吸" ? "静止观察" : "缓慢推进";
  const close = mood === "冷峻" ? "冷光特写" : mood === "温暖" ? "暖光双人景" : "偏轴反应镜头";
  return [opening, bridge, index === delivery.sections.length - 1 ? "证据留白特写" : close];
}

export function buildProductionPackageFiles(
  delivery: StoryDelivery,
  scenes: readonly StoryScene[],
): ProductionPackageFiles {
  const downloads = buildStoryDownloads(delivery);
  const storyboardRows = [
    csvRow(["序号", "时间段", "结构节点", "视觉场景", "画面节拍", "原文锚点", "本地素材"]),
    ...delivery.sections.map((section, index) => {
      const scene = scenes[index % scenes.length];
      return csvRow([
        index + 1,
        `${section.startSeconds}s-${section.endSeconds}s`,
        section.name,
        scene?.title ?? "待补视觉",
        scene?.beat ?? section.purpose,
        section.sourceAnchor,
        scene?.src.split("/").at(-1) ?? "",
      ]);
    }),
  ];

  const shotRows = [csvRow(["镜号", "时间段", "结构节点", "景别/运动", "动作", "声音", "连续性检查"])];
  for (const [sectionIndex, section] of delivery.sections.entries()) {
    const grammar = shotGrammar(delivery, sectionIndex);
    const duration = Math.max(1, section.endSeconds - section.startSeconds);
    const shotDuration = Math.max(1, Math.floor(duration / grammar.length));
    grammar.forEach((shot, shotIndex) => {
      const start = section.startSeconds + shotIndex * shotDuration;
      const end = shotIndex === grammar.length - 1 ? section.endSeconds : Math.min(section.endSeconds, start + shotDuration);
      shotRows.push(
        csvRow([
          `${String(sectionIndex + 1).padStart(2, "0")}-${shotIndex + 1}`,
          `${start}s-${end}s`,
          section.name,
          shot,
          shotIndex === 0 ? section.purpose : shotIndex === 1 ? "让人物选择发生在画面内" : "用可见结果结束镜头",
          shotIndex === 0 ? "环境声先行" : shotIndex === 1 ? delivery.narration : "保留动作尾音",
          section.sourceAnchor,
        ]),
      );
    });
  }

  const productionPlan = [
    `# ${delivery.brief.title} · 制作执行单`,
    "",
    `版本：V${delivery.version}`,
    `主创：${delivery.brief.creator}`,
    `路线：${delivery.decision.title}`,
    `目标观众：${delivery.brief.audience}`,
    `成片时长：${delivery.brief.minutes} 分钟`,
    "",
    "## 创作护栏",
    "",
    `- 必须守住：${delivery.brief.priority}`,
    `- 制作边界：${delivery.brief.constraint}`,
    `- 叙事视角：${delivery.brief.pov}`,
    `- 视觉方向：${delivery.visualDirection}`,
    `- 已接受代价：${delivery.decision.tradeoff}`,
    "",
    "## 拍摄顺序",
    "",
    ...delivery.sections.map(
      (section, index) =>
        `${index + 1}. **${section.name}**（${section.startSeconds}s-${section.endSeconds}s）— ${section.purpose}`,
    ),
    "",
    "## 现场检查",
    "",
    "- [ ] 每个结构节点都能回指原文锚点",
    "- [ ] 人物的关键选择发生在画面中，而非旁白解释",
    "- [ ] 道具、服装、光线和人物走位连续",
    "- [ ] 段尾问题能由目标观众准确复述",
    `- [ ] 下一轮验证：${delivery.nextCheck}`,
    "",
  ].join("\n");

  const manifest = JSON.stringify(
    {
      schemaVersion: 1,
      product: "创剧 AI",
      title: delivery.brief.title,
      version: delivery.version,
      route: delivery.decision,
      brief: delivery.brief,
      visualAssets: scenes.map((scene, index) => ({
        order: index + 1,
        id: scene.id,
        title: scene.title,
        beat: scene.beat,
        file: `visuals/${scene.src.split("/").at(-1)}`,
      })),
      files: [
        "script.md",
        "storyboard.csv",
        "shot-list.csv",
        "production-plan.md",
        "delivery.json",
      ],
    },
    null,
    2,
  );

  return {
    script: downloads.markdown,
    storyboardCsv: `${storyboardRows.join("\n")}\n`,
    shotListCsv: `${shotRows.join("\n")}\n`,
    productionPlan: `${productionPlan}\n`,
    manifest: `${manifest}\n`,
  };
}
