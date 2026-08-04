import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import {
  buildFountain,
  buildDocxBlob,
  buildProjectArchive,
  buildSrt,
  productionToMarkdown,
} from "../exporters";
import { makeProductionDocument } from "./fixtures";

describe("production exporters", () => {
  it("builds Fountain and SRT from the current editable scenes", () => {
    const production = makeProductionDocument();
    production.episodes[0].scenes[0].dialogue = "林澈：这是当前编辑后的对白。";

    const fountain = buildFountain(production);
    const srt = buildSrt(production);

    expect(fountain).toContain("Title: 雨夜归途");
    expect(fountain).toContain("外景 旧城街道 夜");
    expect(fountain).toContain("这是当前编辑后的对白");
    expect(srt).toContain("00:00:00,000 --> 00:00:06,000");
    expect(srt).toContain("这是当前编辑后的对白");
    expect(srt).toContain("00:00:06,000 --> 00:00:14,000");
  });

  it("packages source, editable data, text exports, DOCX, and PDF into a real ZIP", async () => {
    const production = makeProductionDocument();
    const archive = await buildProjectArchive({
      projectTitle: "雨夜归途",
      sourceText: "这是原著正文。",
      production,
      creativeBrief: {
        creatorName: "许澄",
        creatorRole: "制片统筹",
        targetAudience: "悬疑追更",
        priority: "低成本拍摄",
        episodeMinutes: 1,
        deliveryTime: "周五 18:00",
      },
      adaptationDecision: {
        owner: "许澄 · 制片统筹",
        deliveryTime: "周五 18:00",
        conflict: "六个节点需压缩进一分钟。",
        choice: "优先复用场景。",
        audienceEffect: "把秘密揭示后置。",
        expectedOutcome: "交付结构草案。",
        reviewPrompt: "核对场景与时长。",
      },
      docxBytes: new Uint8Array([80, 75, 3, 4]),
      pdfBytes: new Uint8Array([37, 80, 68, 70]),
    });
    const zip = await JSZip.loadAsync(await archive.arrayBuffer());
    const names = Object.keys(zip.files);

    expect(names).toEqual(
      expect.arrayContaining([
        "source.txt",
        "project.json",
        "story-bible.md",
        "screenplay.fountain",
        "subtitles.srt",
        "production.docx",
        "production.pdf",
        "manifest.json",
      ]),
    );
    expect(await zip.file("source.txt")?.async("string")).toBe("这是原著正文。");
    expect(await zip.file("story-bible.md")?.async("string")).toBe(
      productionToMarkdown(production),
    );
    const projectJson = JSON.parse((await zip.file("project.json")?.async("string")) ?? "{}");
    expect(projectJson.creativeBrief.priority).toBe("低成本拍摄");
    expect(projectJson.adaptationDecision.owner).toBe("许澄 · 制片统筹");
  });

  it("creates a real DOCX containing the current edited scene text", async () => {
    const production = makeProductionDocument();
    production.episodes[0].scenes[0].action = "当前编辑后的动作内容。";

    const blob = await buildDocxBlob(production);
    const docx = await JSZip.loadAsync(await blob.arrayBuffer());
    const documentXml = await docx.file("word/document.xml")?.async("string");

    expect(documentXml).toContain("雨夜归途");
    expect(documentXml).toContain("当前编辑后的动作内容");
  });
});
