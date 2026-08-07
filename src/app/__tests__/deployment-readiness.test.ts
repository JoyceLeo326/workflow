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
  it("refuses to report AI output without an API key or provider request", async () => {
    const previousApiKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    try {
      await expect(generateWorkflowResults(makeProjectFixture())).rejects.toThrow(
        "AI_PROVIDER_UNAVAILABLE",
      );
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      if (previousApiKey === undefined) {
        delete process.env.OPENAI_API_KEY;
      } else {
        process.env.OPENAI_API_KEY = previousApiKey;
      }
    }
  });

  it("declares a minimal Vercel contract that forces browser-safe offline operation", async () => {
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
    const previousOfflineMode = process.env.NEXT_PUBLIC_OFFLINE_MODE;
    const previousCostMode = process.env.COST_MODE;
    process.env.VERCEL = "1";
    delete process.env.NEXT_PUBLIC_OFFLINE_MODE;
    delete process.env.COST_MODE;
    vi.resetModules();

    try {
      const { default: nextConfig } = await import("../../../next.config");
      expect(nextConfig.env).toMatchObject({
        NEXT_PUBLIC_OFFLINE_MODE: "1",
        NEXT_PUBLIC_COST_MODE: "zero_owner_cost",
        NEXT_PUBLIC_PROVIDER_STATUS: "not_connected",
      });
      expect(nextConfig.images).toMatchObject({ unoptimized: true });
    } finally {
      if (previousVercel === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = previousVercel;
      if (previousOfflineMode === undefined) delete process.env.NEXT_PUBLIC_OFFLINE_MODE;
      else process.env.NEXT_PUBLIC_OFFLINE_MODE = previousOfflineMode;
      if (previousCostMode === undefined) delete process.env.COST_MODE;
      else process.env.COST_MODE = previousCostMode;
      vi.resetModules();
    }
  });

  it("exports the complete client product for GitHub Pages without server routes", async () => {
    const previousPages = process.env.GITHUB_PAGES;
    const previousRepository = process.env.GITHUB_REPOSITORY;
    process.env.GITHUB_PAGES = "1";
    process.env.GITHUB_REPOSITORY = "JoyceLeo326/workflow";
    vi.resetModules();

    try {
      const { default: nextConfig } = await import("../../../next.config");
      expect(nextConfig).toMatchObject({
        output: "export",
        basePath: "/workflow",
        trailingSlash: true,
        pageExtensions: ["pages.tsx"],
        images: { unoptimized: true },
      });
      expect(nextConfig.env).toMatchObject({ NEXT_PUBLIC_ASSET_BASE: "/workflow" });
      expect(nextConfig.headers).toBeUndefined();
    } finally {
      if (previousPages === undefined) delete process.env.GITHUB_PAGES;
      else process.env.GITHUB_PAGES = previousPages;
      if (previousRepository === undefined) delete process.env.GITHUB_REPOSITORY;
      else process.env.GITHUB_REPOSITORY = previousRepository;
      vi.resetModules();
    }
  });

  it("documents the zero-owner-cost default and external-provider boundaries", () => {
    const environmentExample = readFileSync(join(projectRoot, ".env.example"), "utf8");
    const policyPath = join(projectRoot, "docs/zero-owner-cost.md");

    expect(environmentExample).toMatch(/^COST_MODE=zero_owner_cost$/m);
    expect(existsSync(policyPath)).toBe(true);
    if (!existsSync(policyPath)) return;

    const policy = readFileSync(policyPath, "utf8");
    for (const marker of [
      "BYOK",
      "BYOS",
      "BYOI",
      "https://developers.cloudflare.com/pages/platform/limits/",
      "https://developers.cloudflare.com/workers/platform/pricing/",
      "https://vercel.com/legal/terms",
      "个人、非商业",
      "配额数字会变化",
    ]) {
      expect(policy).toContain(marker);
    }
  });

  it("does not advertise a provider as ready when its quota cannot be verified", async () => {
    const keys = [
      "AI_PROVIDER_OWNERSHIP",
      "AI_PROVIDER_QUOTA_LIMIT",
      "AI_PROVIDER_QUOTA_USED",
      "AI_PROVIDER_QUOTA_RESET_AT",
      "OPENAI_API_KEY",
    ] as const;
    const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
    process.env.AI_PROVIDER_OWNERSHIP = "user";
    process.env.OPENAI_API_KEY = "user-test-key";
    delete process.env.AI_PROVIDER_QUOTA_LIMIT;
    delete process.env.AI_PROVIDER_QUOTA_USED;
    delete process.env.AI_PROVIDER_QUOTA_RESET_AT;
    vi.resetModules();

    try {
      const { default: nextConfig } = await import("../../../next.config");
      expect(nextConfig.env).toMatchObject({ NEXT_PUBLIC_PROVIDER_STATUS: "blocked" });
    } finally {
      for (const key of keys) {
        const value = previous[key];
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
      vi.resetModules();
    }
  });

  it("publishes product metadata without implementation commentary", () => {
    const layout = readFileSync(join(projectRoot, "src/app/layout.tsx"), "utf8");

    expect(layout).toContain('applicationName: "创剧AI"');
    expect(layout).toContain("openGraph:");
    expect(layout).toContain("前期制片");
    expect(layout).not.toContain("无需 API Key");
    expect(layout).not.toContain("本地规则");
  });
});
