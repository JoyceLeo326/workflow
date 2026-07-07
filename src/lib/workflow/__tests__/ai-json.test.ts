import { describe, expect, it } from "vitest";
import { requestJsonWithRetry } from "../ai-json";

describe("requestJsonWithRetry", () => {
  it("retries once when the provider returns non-json content", async () => {
    let calls = 0;
    const result = await requestJsonWithRetry<{ ok: boolean }>(
      async () => {
        calls += 1;
        return calls === 1 ? "不是 JSON" : '{"ok":true}';
      },
      { ok: false },
    );

    expect(calls).toBe(2);
    expect(result.value).toEqual({ ok: true });
    expect(result.usedFallback).toBe(false);
  });

  it("uses fallback after two invalid model responses", async () => {
    const result = await requestJsonWithRetry(async () => "仍然不是 JSON", { ok: false });

    expect(result.value).toEqual({ ok: false });
    expect(result.usedFallback).toBe(true);
    expect(result.attempts).toBe(2);
  });
});
