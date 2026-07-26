import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import type { ProductionDocument, ProductionScene } from "./types";

function safeLine(value: string) {
  return value.replace(/\r?\n/g, " ").trim();
}

function dialogueToFountain(dialogue: string) {
  const output: string[] = [];
  for (const line of dialogue.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)) {
    const match = line.match(/^([^：:]{1,24})[：:]\s*(.+)$/);
    if (match) output.push(`@${safeLine(match[1])}`, safeLine(match[2]), "");
    else output.push(safeLine(line), "");
  }
  return output;
}

export function buildFountain(production: ProductionDocument) {
  const lines = [
    `Title: ${safeLine(production.storyBible.title)}`,
    "Credit: 创剧AI 前期制片工作台",
    "",
  ];
  for (const episode of production.episodes) {
    lines.push(`# 第 ${episode.episodeNumber} 集 · ${safeLine(episode.title)}`, "");
    for (const scene of episode.scenes) {
      lines.push(`## 场景 ${scene.sceneNumber}`, `.${safeLine(scene.heading)}`, "");
      if (scene.action.trim()) lines.push(scene.action.trim(), "");
      lines.push(...dialogueToFountain(scene.dialogue));
      lines.push(`[[来源：${safeLine(scene.sourceRef)}]]`, "");
    }
  }
  return lines.join("\n").trimEnd() + "\n";
}

function srtTime(totalSeconds: number) {
  const milliseconds = Math.max(0, Math.round(totalSeconds * 1000));
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  const seconds = Math.floor((milliseconds % 60_000) / 1000);
  const millis = milliseconds % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}

function sceneCaption(scene: ProductionScene) {
  return scene.dialogue.trim() || scene.summary.trim() || scene.action.trim() || scene.heading;
}

export function buildSrt(production: ProductionDocument) {
  let cursor = 0;
  let index = 1;
  const blocks: string[] = [];
  for (const episode of production.episodes) {
    for (const scene of episode.scenes) {
      const start = cursor;
      cursor += scene.durationSeconds;
      blocks.push(
        String(index),
        `${srtTime(start)} --> ${srtTime(cursor)}`,
        sceneCaption(scene),
        "",
      );
      index += 1;
    }
  }
  return blocks.join("\n").trimEnd() + "\n";
}

export function productionToMarkdown(production: ProductionDocument) {
  const lines = [
    `# ${production.storyBible.title}`,
    "",
    `- 类型：${production.storyBible.genre || "待确认"}`,
    `- 当前版本：v${production.version}`,
    `- 更新：${production.updatedAt}`,
    "",
    "## 故事梗概",
    "",
    production.storyBible.logline,
    "",
    "## 主题",
    "",
    production.storyBible.themes.map((theme) => `- ${theme}`).join("\n") || "- 待补充",
    "",
    "## 人物",
    "",
  ];
  for (const character of production.storyBible.characters) {
    lines.push(
      `### ${character.name}`,
      "",
      `- 角色：${character.role}`,
      `- 目标：${character.goal}`,
      `- 人物弧：${character.arc}`,
      `- 关系：${character.relationships}`,
      `- 来源：${character.sourceRef}`,
      "",
    );
  }
  lines.push("## 分集与场景", "");
  for (const episode of production.episodes) {
    lines.push(
      `### 第 ${episode.episodeNumber} 集 · ${episode.title}`,
      "",
      episode.logline,
      "",
      `结尾钩子：${episode.endingHook}`,
      "",
    );
    for (const scene of episode.scenes) {
      lines.push(
        `#### 场景 ${scene.sceneNumber} · ${scene.heading}`,
        "",
        scene.summary,
        "",
        scene.action,
        "",
        scene.dialogue,
        "",
        `来源：${scene.sourceRef} · 预计 ${scene.durationSeconds} 秒`,
        "",
      );
    }
  }
  return lines.join("\n").trimEnd() + "\n";
}

export async function buildDocxBlob(production: ProductionDocument) {
  const children: Paragraph[] = [
    new Paragraph({
      text: production.storyBible.title,
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `类型：${production.storyBible.genre || "待确认"}`, bold: true }),
        new TextRun({ text: `  ·  版本 v${production.version}` }),
      ],
    }),
    new Paragraph({ text: production.storyBible.logline }),
    new Paragraph({ text: "人物圣经", heading: HeadingLevel.HEADING_1 }),
  ];
  for (const character of production.storyBible.characters) {
    children.push(
      new Paragraph({ text: character.name, heading: HeadingLevel.HEADING_2 }),
      new Paragraph({ text: `角色：${character.role}` }),
      new Paragraph({ text: `目标：${character.goal}` }),
      new Paragraph({ text: `人物弧：${character.arc}` }),
      new Paragraph({ text: `关系：${character.relationships}` }),
      new Paragraph({ text: `来源：${character.sourceRef}` }),
    );
  }
  children.push(new Paragraph({ text: "分集场景", heading: HeadingLevel.HEADING_1 }));
  for (const episode of production.episodes) {
    children.push(
      new Paragraph({
        text: `第 ${episode.episodeNumber} 集 · ${episode.title}`,
        heading: HeadingLevel.HEADING_2,
      }),
      new Paragraph({ text: episode.logline }),
      new Paragraph({ text: `结尾钩子：${episode.endingHook}` }),
    );
    for (const scene of episode.scenes) {
      children.push(
        new Paragraph({
          text: `场景 ${scene.sceneNumber} · ${scene.heading}`,
          heading: HeadingLevel.HEADING_3,
        }),
        new Paragraph({ text: scene.summary }),
        new Paragraph({ text: scene.action }),
        ...scene.dialogue
          .split(/\r?\n/)
          .filter(Boolean)
          .map((line) => new Paragraph({ text: line })),
        new Paragraph({ text: `来源：${scene.sourceRef} · 预计 ${scene.durationSeconds} 秒` }),
      );
    }
  }
  const document = new Document({ sections: [{ children }] });
  return Packer.toBlob(document);
}

function markdownLines(production: ProductionDocument) {
  return productionToMarkdown(production)
    .split(/\r?\n/)
    .map((line) => line.replace(/^#{1,4}\s*/, "").replace(/^-\s*/, "• "));
}

function wrapCanvasLine(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  if (!text) return [""];
  const lines: string[] = [];
  let current = "";
  for (const character of text) {
    const candidate = current + character;
    if (current && context.measureText(candidate).width > maxWidth) {
      lines.push(current);
      current = character;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function buildPdfBlob(production: ProductionDocument) {
  if (typeof document === "undefined") throw new Error("PDF_EXPORT_REQUIRES_BROWSER");
  const width = 1240;
  const height = 1754;
  const margin = 92;
  const lineHeight = 38;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("PDF_CANVAS_UNAVAILABLE");

  const pdf = new jsPDF({ unit: "px", format: [width, height], compress: true });
  let firstPage = true;
  let cursorY = margin;
  const beginPage = () => {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.fillStyle = "#172033";
    context.font =
      '28px "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif';
    cursorY = margin;
  };
  const commitPage = () => {
    if (!firstPage) pdf.addPage([width, height], "portrait");
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, width, height, undefined, "FAST");
    firstPage = false;
  };

  beginPage();
  for (const rawLine of markdownLines(production)) {
    const line = rawLine || " ";
    const wrapped = wrapCanvasLine(context, line, width - margin * 2);
    if (cursorY + wrapped.length * lineHeight > height - margin) {
      commitPage();
      beginPage();
    }
    for (const wrappedLine of wrapped) {
      context.fillText(wrappedLine, margin, cursorY);
      cursorY += lineHeight;
    }
  }
  commitPage();
  return pdf.output("blob");
}

export async function buildProjectArchive(input: {
  projectTitle: string;
  sourceText: string;
  production: ProductionDocument;
  docxBytes: Uint8Array;
  pdfBytes: Uint8Array;
}) {
  const zip = new JSZip();
  const fountain = buildFountain(input.production);
  const srt = buildSrt(input.production);
  const markdown = productionToMarkdown(input.production);
  const projectJson = JSON.stringify(
    {
      title: input.projectTitle,
      production: input.production,
    },
    null,
    2,
  );
  const files = {
    "source.txt": input.sourceText,
    "project.json": projectJson,
    "story-bible.md": markdown,
    "screenplay.fountain": fountain,
    "subtitles.srt": srt,
    "production.docx": input.docxBytes,
    "production.pdf": input.pdfBytes,
  };
  for (const [name, content] of Object.entries(files)) zip.file(name, content);
  zip.file(
    "manifest.json",
    JSON.stringify(
      {
        schemaVersion: "1",
        projectTitle: input.projectTitle,
        productionVersion: input.production.version,
        exportedAt: new Date().toISOString(),
        files: Object.keys(files),
      },
      null,
      2,
    ),
  );
  return zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
}
