import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import JSZip from "jszip";

async function expectNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }));
  expect(metrics.scrollWidth, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

async function expectTouchTargets(page: Page) {
  const undersized = await page
    .locator(
      [
        "button:visible",
        "a[href]:visible",
        "input:not([type=radio]):not([type=file]):visible",
        "select:visible",
        "textarea:visible",
        "label:has(input[type=radio]):visible",
        "label:has(input[type=file]):visible",
      ].join(","),
    )
    .evaluateAll((elements) =>
      elements.flatMap((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.width >= 44 && rect.height >= 44) return [];
        return [
          {
            tag: element.tagName,
            text: element.getAttribute("aria-label") ?? element.textContent?.trim().slice(0, 40),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
        ];
      }),
    );
  expect(undersized).toEqual([]);
}

async function expectVisualStoryStage(page: Page, label: string, count: number) {
  await expect(page.getByRole("button", { name: label })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("visual-story-v3-grid").locator("article")).toHaveCount(count);
}

test("creation, decision, delivery, export, and feedback survive every target viewport", async ({
  page,
}, testInfo) => {
  const expectedViewport = testInfo.project.use.viewport;
  const mobile = testInfo.project.name.includes("mobile-");
  const externalOrigins = new Set<string>();
  const imageOptimizerRequests: string[] = [];
  const cspViolations: string[] = [];
  page.on("console", (message) => {
    const text = message.text();
    if (/content security policy|violates.*(?:script-src|connect-src|object-src)|refused to (?:load|connect|execute)/i.test(text)) {
      cspViolations.push(text);
    }
  });
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.includes("/_next/image")) imageOptimizerRequests.push(url.pathname);
    if (!["http:", "https:"].includes(url.protocol)) return;
    const base = new URL(testInfo.project.use.baseURL as string);
    if (url.origin !== base.origin) externalOrigins.add(url.origin);
  });

  await page.goto(process.env.PLAYWRIGHT_ENTRY_PATH ?? "/");
  if (process.env.PLAYWRIGHT_EXPECT_CSP === "1") {
    await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveCount(1);
  }
  await expect(page.getByRole("heading", { name: "让每个改编选择，都有原文依据。" })).toBeVisible();
  expect(page.viewportSize()?.width).toBe(expectedViewport?.width);
  await expect(page.getByText(String.fromCodePoint(0x767b, 0x5f55), { exact: true })).toHaveCount(0);
  await expectVisualStoryStage(page, "核心 20 幕", 20);
  await expectNoHorizontalOverflow(page);
  if (mobile) await expectTouchTargets(page);

  if (expectedViewport?.width === 390) {
    await page.getByRole("button", { name: "查看完整 50 幕" }).click();
    const visualStoryImages = page.getByTestId("visual-story-v3-grid").getByRole("img");
    await expect(visualStoryImages).toHaveCount(50);
    for (const image of await visualStoryImages.all()) {
      await image.scrollIntoViewIfNeeded();
    }
    await expect
      .poll(() =>
        visualStoryImages.evaluateAll((images) =>
          images.every(
            (image) =>
              image instanceof HTMLImageElement &&
              image.complete &&
              image.naturalWidth === 768 &&
              image.naturalHeight === 512 &&
              image.getAttribute("width") === "768" &&
              image.getAttribute("height") === "512" &&
              Boolean(image.getAttribute("alt")?.trim()),
          ),
        ),
      )
      .toBe(true);
    await page.getByRole("button", { name: "收起到核心 20 幕" }).click();
    await expectVisualStoryStage(page, "核心 20 幕", 20);
  }

  await page.locator('input[type="file"]').setInputFiles({
    name: "雨夜剧院.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(
      "雨夜，林澈回到旧城剧院。父亲留下的录音突然响起。阿岚劝他离开。停电后，未来日期的信落在聚光灯下。",
    ),
  });
  await expect(page.getByLabel("项目名称")).toHaveValue("雨夜剧院");
  await expectVisualStoryStage(page, "原文取证", 10);
  await page.getByLabel("故事类型").selectOption("悬疑");
  await page.getByLabel("目标观众").selectOption("追更观众");
  await page.getByLabel("单集时长").selectOption("3");
  await page.getByLabel("叙事节奏").selectOption("高密推进");
  await page.getByLabel("情绪底色").selectOption("冷峻");
  await page.getByLabel("叙事视角").selectOption("贴身第三人称");
  await page.getByLabel("改编重点").selectOption("悬念钩子");
  await page.getByLabel("制作限制").selectOption("少场景");
  await page.getByRole("button", { name: "生成创作路线" }).click();
  await expectVisualStoryStage(page, "路线取舍", 8);

  await expect(page.getByTestId("candidate-hook-first")).toHaveAttribute(
    "data-recommended",
    "true",
  );
  await expect(page.getByTestId("candidate-scene")).toHaveCount(12);
  for (const image of await page.getByTestId("candidate-scene").all()) {
    await image.scrollIntoViewIfNeeded();
  }
  await expect
    .poll(() =>
      page.getByTestId("candidate-scene").evaluateAll((images) =>
        images.every(
          (image) =>
            image instanceof HTMLImageElement &&
            image.complete &&
            image.naturalWidth > 0 &&
            getComputedStyle(image).objectFit === "cover",
        ),
      ),
    )
    .toBe(true);
  await expectNoHorizontalOverflow(page);
  if (mobile) await expectTouchTargets(page);

  if (mobile && expectedViewport) {
    const source = page.getByLabel("原文片段");
    await source.focus();
    await page.setViewportSize({ width: expectedViewport.width, height: 520 });
    await source.scrollIntoViewIfNeeded();
    const mobileAction = page.locator(".mobile-action");
    await expect(mobileAction).toHaveCount(1);
    await expect(mobileAction).toBeHidden();
    const sourceBox = await source.boundingBox();
    expect(sourceBox?.y ?? 9999).toBeLessThan(520);
    await page.setViewportSize(expectedViewport);
  }

  await page.getByRole("button", { name: "选择 十秒失衡线" }).click();
  await expectVisualStoryStage(page, "选择确认", 2);
  await page.getByRole("button", { name: "确认路线并生成交付" }).click();
  await expectVisualStoryStage(page, "交付成形", 10);
  const storyboard = page.getByRole("region", { name: "路线分镜参照" });
  await expect(storyboard.getByRole("img")).toHaveCount(5);
  await expect
    .poll(() =>
      storyboard.getByRole("img").evaluateAll((images) =>
        images.every(
          (image) =>
            image instanceof HTMLImageElement &&
            image.complete &&
            image.naturalWidth > 0 &&
            getComputedStyle(image).objectFit === "cover",
        ),
      ),
    )
    .toBe(true);
  if (mobile) await expectTouchTargets(page);

  await page.getByLabel("一句话故事").fill("林澈必须决定是否公开父亲留下的未来信。");
  const markdownPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "下载 Markdown" }).click();
  const markdownDownload = await markdownPromise;
  const markdownPath = testInfo.outputPath(markdownDownload.suggestedFilename());
  await markdownDownload.saveAs(markdownPath);
  expect(await readFile(markdownPath, "utf8")).toContain("未来信");

  const jsonPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "下载 JSON" }).click();
  const jsonDownload = await jsonPromise;
  const jsonPath = testInfo.outputPath(jsonDownload.suggestedFilename());
  await jsonDownload.saveAs(jsonPath);
  const exported = JSON.parse(await readFile(jsonPath, "utf8")) as {
    decision: { candidateId: string };
    logline: string;
  };
  expect(exported.decision.candidateId).toBe("hook-first");
  expect(exported.logline).toContain("未来信");

  const packagePromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "下载完整制作包 ZIP" }).click();
  const packageDownload = await packagePromise;
  const packagePath = testInfo.outputPath(packageDownload.suggestedFilename());
  await packageDownload.saveAs(packagePath);
  const archive = await JSZip.loadAsync(await readFile(packagePath));
  for (const filename of [
    "script.md",
    "storyboard.csv",
    "shot-list.csv",
    "production-plan.md",
    "delivery.json",
    "manifest.json",
  ]) {
    expect(archive.file(filename), filename).not.toBeNull();
  }
  expect(Object.keys(archive.files).filter((name) => name.startsWith("visuals/") && name.endsWith(".webp"))).toHaveLength(5);

  await page.getByRole("radio", { name: "1 分" }).check();
  await page.getByLabel("最需要改变的地方").selectOption("人物动机偏弱");
  await page.getByLabel("观察记录").fill("试读者只记得信，没有说出林澈为什么回去。");
  await page.getByRole("button", { name: "保存反馈并进入下一轮" }).click();
  await expectVisualStoryStage(page, "反馈改版", 10);
  await expect(page.locator("#delivery").getByText("下一轮推荐已改变", { exact: true })).toBeVisible();
  await expect(page.getByTestId("candidate-relationship-echo")).toHaveAttribute(
    "data-recommended",
    "true",
  );

  await page.reload();
  await expect(page.locator("header").getByText("已恢复第 2 轮创作判断", { exact: true })).toBeVisible();
  await expect(page.getByTestId("candidate-relationship-echo")).toHaveAttribute(
    "data-recommended",
    "true",
  );
  await expectNoHorizontalOverflow(page);
  if (mobile) await expectTouchTargets(page);
  expect([...externalOrigins]).toEqual([]);
  expect(imageOptimizerRequests).toEqual([]);
  expect(cspViolations).toEqual([]);

  await testInfo.attach(`${testInfo.project.name}-full-flow`, {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});
