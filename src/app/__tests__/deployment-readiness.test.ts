import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { generateWorkflowResults } from "@/lib/workflow/runner";
import { makeProjectFixture } from "@/lib/workflow/__tests__/fixtures";

const projectRoot = process.cwd();

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("public deployment readiness", () => {
  it("keeps the complete demo usable without an API key or provider request", async () => {
    const previousApiKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    try {
      const result = await generateWorkflowResults(makeProjectFixture());

      expect(result.scriptStructure.acts).toHaveLength(3);
      expect(result.shots).toHaveLength(6);
      expect(result.timeline.items).toHaveLength(6);
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      if (previousApiKey === undefined) {
        delete process.env.OPENAI_API_KEY;
      } else {
        process.env.OPENAI_API_KEY = previousApiKey;
      }
    }
  });

  it("declares a minimal Vercel contract that forces the browser-safe demo", async () => {
    const vercelConfigPath = join(projectRoot, "vercel.json");

    expect(existsSync(vercelConfigPath)).toBe(true);
    if (!existsSync(vercelConfigPath)) return;

    const vercelConfig = JSON.parse(readFileSync(vercelConfigPath, "utf8")) as {
      $schema?: string;
      framework?: string;
    };

    expect(vercelConfig).toMatchObject({
      $schema: "https://openapi.vercel.sh/vercel.json",
      framework: "nextjs",
    });

    const previousVercel = process.env.VERCEL;
    const previousBrowserDemo = process.env.NEXT_PUBLIC_BROWSER_DEMO;
    process.env.VERCEL = "1";
    delete process.env.NEXT_PUBLIC_BROWSER_DEMO;
    vi.resetModules();

    try {
      const { default: nextConfig } = await import("../../../next.config");
      expect(nextConfig.env).toMatchObject({ NEXT_PUBLIC_BROWSER_DEMO: "1" });
    } finally {
      if (previousVercel === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = previousVercel;
      if (previousBrowserDemo === undefined) delete process.env.NEXT_PUBLIC_BROWSER_DEMO;
      else process.env.NEXT_PUBLIC_BROWSER_DEMO = previousBrowserDemo;
      vi.resetModules();
    }
  });

  it("publishes portfolio metadata for the no-key browser experience", () => {
    const layout = readFileSync(join(projectRoot, "src/app/layout.tsx"), "utf8");

    expect(layout).toContain('applicationName: "创剧AI"');
    expect(layout).toContain("openGraph:");
    expect(layout).toContain("无需 API Key");
  });
});
