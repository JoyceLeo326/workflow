import { afterEach, describe, expect, it, vi } from "vitest";
import { generateWorkflowResults } from "../runner";
import { makeProjectFixture } from "./fixtures";

const envKeys = [
  "COST_MODE",
  "AI_PROVIDER_OWNERSHIP",
  "AI_PROVIDER_QUOTA_LIMIT",
  "AI_PROVIDER_QUOTA_USED",
  "AI_PROVIDER_QUOTA_RESET_AT",
  "OPENAI_API_KEY",
] as const;

const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of envKeys) {
    const value = originalEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  vi.unstubAllGlobals();
});

describe("generateWorkflowResults cost guard", () => {
  it("never spends a project-owned API key in zero-owner-cost mode", async () => {
    process.env.COST_MODE = "zero_owner_cost";
    process.env.AI_PROVIDER_OWNERSHIP = "project";
    process.env.AI_PROVIDER_QUOTA_LIMIT = "100000";
    process.env.AI_PROVIDER_QUOTA_USED = "0";
    process.env.AI_PROVIDER_QUOTA_RESET_AT = "2099-01-01T00:00:00.000Z";
    process.env.OPENAI_API_KEY = "project-test-key";
    const fetchMock = vi.fn().mockRejectedValue(new Error("must not call provider"));
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateWorkflowResults(makeProjectFixture());

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.directorNotes.qualityChecks).toContain("本地规则演示，不是 AI 生成。");
  });
});
