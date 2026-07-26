import { afterEach, describe, expect, it, vi } from "vitest";
import { requestProductionDocument, validateProviderConfig } from "../provider";
import { makeProductionDocument } from "./fixtures";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("session BYOK provider", () => {
  it("accepts only complete HTTPS OpenAI-compatible settings", () => {
    expect(
      validateProviderConfig({
        baseUrl: "http://api.example.com/v1",
        model: "test-model",
        apiKey: "test-session-key",
        timeoutMs: 30_000,
      }),
    ).toMatchObject({ valid: false });

    expect(
      validateProviderConfig({
        baseUrl: "https://api.example.com/v1",
        model: "",
        apiKey: "",
        timeoutMs: 30_000,
      }),
    ).toMatchObject({ valid: false });

    expect(
      validateProviderConfig({
        baseUrl: "https://api.example.com/v1",
        model: "test-model",
        apiKey: "test-session-key",
        timeoutMs: 30_000,
      }),
    ).toEqual({ valid: true, error: null });
  });

  it("calls the configured provider and returns only schema-valid production data", async () => {
    const production = makeProductionDocument();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(production) } }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await requestProductionDocument(
      {
        baseUrl: "https://api.example.com/v1",
        model: "test-model",
        apiKey: "test-session-key",
        timeoutMs: 30_000,
      },
      {
        title: "雨夜归途",
        sourceText: "雨夜，林澈回到旧城。",
      },
    );

    expect(result).toEqual(production);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.example.com/v1/chat/completions");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      headers: {
        Authorization: "Bearer test-session-key",
        "Content-Type": "application/json",
      },
    });
  });

  it("rejects invalid model output without returning template data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"storyBible":{"title":"伪结果"}}' } }],
        }),
      }),
    );

    await expect(
      requestProductionDocument(
        {
          baseUrl: "https://api.example.com/v1",
          model: "test-model",
          apiKey: "test-session-key",
          timeoutMs: 30_000,
        },
        { title: "雨夜归途", sourceText: "原著正文" },
      ),
    ).rejects.toThrow("PROVIDER_SCHEMA_MISMATCH");
  });

  it("cancels an in-flight provider request through AbortSignal", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener("abort", () => {
              reject(new DOMException("aborted", "AbortError"));
            });
          }),
      ),
    );
    const controller = new AbortController();
    const pending = requestProductionDocument(
      {
        baseUrl: "https://api.example.com/v1",
        model: "test-model",
        apiKey: "test-session-key",
        timeoutMs: 30_000,
      },
      { title: "雨夜归途", sourceText: "原著正文" },
      controller.signal,
    );
    controller.abort();

    await expect(pending).rejects.toThrow("PROVIDER_CANCELLED");
  });
});
