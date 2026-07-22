import { describe, expect, it } from "vitest";
import { evaluateCostPolicy, estimateUsage, resolveCostMode } from "../policy";

const resetAt = "2099-01-01T00:00:00.000Z";
const now = new Date("2026-07-23T00:00:00.000Z");

describe("zero-owner-cost policy", () => {
  it("defaults unknown configuration to zero-owner-cost", () => {
    expect(resolveCostMode(undefined)).toBe("zero_owner_cost");
    expect(resolveCostMode("unexpected-mode")).toBe("zero_owner_cost");
  });

  it("estimates provider-neutral quota units without pretending they are money", () => {
    expect(estimateUsage({ capability: "local_rules" })).toBe(0);
    expect(estimateUsage({ capability: "ai_text", inputCharacters: 401 })).toBe(101);
    expect(estimateUsage({ capability: "image", imageCount: 3 })).toBe(3);
    expect(estimateUsage({ capability: "tts", durationSeconds: 12.4 })).toBe(13);
    expect(estimateUsage({ capability: "video", durationSeconds: 8 })).toBe(8);
  });

  it("allows the deterministic local workflow with no provider or quota", () => {
    expect(
      evaluateCostPolicy(
        {
          mode: "zero_owner_cost",
          request: { capability: "local_rules" },
          billingOwner: "none",
          providerConnected: false,
        },
        now,
      ),
    ).toEqual({
      allowed: true,
      estimatedUnits: 0,
      remainingUnits: null,
      resetsAt: null,
      reason: "local_zero_cost",
    });
  });

  it("blocks project-paid providers even when credentials and quota are present", () => {
    const decision = evaluateCostPolicy(
      {
        mode: "zero_owner_cost",
        request: { capability: "ai_text", inputCharacters: 400 },
        billingOwner: "project",
        providerConnected: true,
        quota: { limitUnits: 1_000, usedUnits: 100, resetsAt: resetAt },
      },
      now,
    );

    expect(decision).toMatchObject({
      allowed: false,
      estimatedUnits: 100,
      remainingUnits: 900,
      resetsAt: resetAt,
      reason: "owner_billing_forbidden",
    });
  });

  it("fails closed when an external provider quota is missing or stale", () => {
    const missing = evaluateCostPolicy(
      {
        mode: "zero_owner_cost",
        request: { capability: "image", imageCount: 1 },
        billingOwner: "user",
        providerConnected: true,
      },
      now,
    );
    const stale = evaluateCostPolicy(
      {
        mode: "zero_owner_cost",
        request: { capability: "tts", durationSeconds: 1 },
        billingOwner: "institution",
        providerConnected: true,
        quota: {
          limitUnits: 100,
          usedUnits: 10,
          resetsAt: "2026-07-22T00:00:00.000Z",
        },
      },
      now,
    );

    expect(missing).toMatchObject({ allowed: false, reason: "quota_unverified" });
    expect(stale).toMatchObject({ allowed: false, reason: "quota_unverified" });
  });

  it("blocks an exhausted quota and reports zero remaining plus its reset", () => {
    const decision = evaluateCostPolicy(
      {
        mode: "zero_owner_cost",
        request: { capability: "video", durationSeconds: 1 },
        billingOwner: "institution",
        providerConnected: true,
        quota: { limitUnits: 50, usedUnits: 50, resetsAt: resetAt },
      },
      now,
    );

    expect(decision).toEqual({
      allowed: false,
      estimatedUnits: 1,
      remainingUnits: 0,
      resetsAt: resetAt,
      reason: "quota_exhausted",
    });
  });

  it("allows user-funded quota only when enough verified capacity remains", () => {
    const decision = evaluateCostPolicy(
      {
        mode: "zero_owner_cost",
        request: { capability: "tts", durationSeconds: 10 },
        billingOwner: "user",
        providerConnected: true,
        quota: { limitUnits: 100, usedUnits: 60, resetsAt: resetAt },
      },
      now,
    );

    expect(decision).toEqual({
      allowed: true,
      estimatedUnits: 10,
      remainingUnits: 30,
      resetsAt: resetAt,
      reason: "external_quota_available",
    });
  });
});
