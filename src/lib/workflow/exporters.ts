import type { Project, ShotCard } from "./types";

function csvEscape(value: string | number): string {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function shotToCsvRow(project: Project, shot: ShotCard): string {
  const brief = project.creativeBrief;
  return [
    brief?.targetAudience ?? "未设置",
    brief?.priority ?? "未设置",
    brief?.episodeMinutes ?? "",
    shot.shotNumber,
    shot.scene,
    shot.visual,
    shot.shotSize,
    shot.cameraMove,
    shot.narration,
    shot.subtitle,
    shot.durationSeconds,
    shot.firstFramePrompt,
    shot.lastFramePrompt,
  ]
    .map(csvEscape)
    .join(",");
}

export function exportProjectAsCsv(project: Project): string {
  const header = "目标观众,本轮优先,单集分钟,镜号,场景,画面,景别,运镜,旁白,字幕,时长秒,首帧提示词,尾帧提示词";
  const rows = project.results?.shots.map((shot) => shotToCsvRow(project, shot)) ?? [];
  return [header, ...rows].join("\n");
}

export function exportProjectAsJson(project: Project): string {
  return JSON.stringify(project, null, 2);
}

export function exportProjectAsMarkdown(project: Project): string {
  const results = project.results;
  if (!results) {
    return `# ${project.title}\n\n项目尚未生成结果。\n`;
  }

  const acts = results.scriptStructure.acts
    .map(
      (act) =>
        `### ${act.name}\n\n${act.purpose}\n\n${act.beats.map((beat) => `- ${beat}`).join("\n")}`,
    )
    .join("\n\n");

  const characters = results.characters
    .map(
      (character) =>
        `- **${character.name}**（${character.role}）：${character.profile}\n  - 目标：${character.goal}\n  - 关系：${character.relationship}\n  - 视觉：${character.visualPrompt}`,
    )
    .join("\n");

  const scenes = results.scenes
    .map(
      (scene) =>
        `- **${scene.name}**：${scene.time}，${scene.location}，${scene.mood}\n  - 事件：${scene.keyEvents.join("；")}\n  - 视觉：${scene.visualPrompt}`,
    )
    .join("\n");

  const shots = results.shots
    .map(
      (shot) =>
        `| ${shot.shotNumber} | ${shot.scene} | ${shot.shotSize} | ${shot.cameraMove} | ${shot.durationSeconds}s | ${shot.subtitle} |`,
    )
    .join("\n");

  const timeline = results.timeline.items
    .map((item) => `- ${item.shotNumber}: ${item.startSeconds}s-${item.endSeconds}s，${item.subtitle}`)
    .join("\n");

  const decision = results.adaptationDecision;
  const decisionLines = decision
    ? [
        `- 主创：${decision.owner}`,
        `- 目标观众：${project.creativeBrief?.targetAudience ?? "未设置"}`,
        `- 本轮优先：${project.creativeBrief?.priority ?? "未设置"}`,
        `- 交付：${decision.deliveryTime}`,
        `- 冲突：${decision.conflict}`,
        `- 取舍：${decision.choice}`,
        `- 观众影响：${decision.audienceEffect}`,
        `- 结果：${decision.expectedOutcome}`,
        `- 回看：${decision.reviewPrompt}`,
      ].join("\n")
    : "- 未设置本轮改编决策";

  return [
    `# ${project.title}`,
    "",
    `> ${results.scriptStructure.logline}`,
    "",
    "## 本轮改编决策",
    "",
    decisionLines,
    "",
    "## 剧本结构",
    "",
    acts,
    "",
    "## 角色列表",
    "",
    characters,
    "",
    "## 场景列表",
    "",
    scenes,
    "",
    "## 分镜表",
    "",
    "| 镜号 | 场景 | 景别 | 运镜 | 时长 | 字幕 |",
    "| --- | --- | --- | --- | --- | --- |",
    shots,
    "",
    "## 时序草案",
    "",
    `总时长：${results.timeline.totalDurationSeconds} 秒`,
    "",
    timeline,
    "",
    "## 总导演备注",
    "",
    results.directorNotes.qualityChecks.map((check) => `- ${check}`).join("\n"),
    "",
  ].join("\n");
}
