export const ZERO_OWNER_COST_MODE = "zero_owner_cost" as const;

export type CostMode = typeof ZERO_OWNER_COST_MODE;
export type ProviderBillingOwner = "none" | "project" | "user" | "institution";

export type UsageRequest =
  | { capability: "local_rules" }
  | { capability: "ai_text"; inputCharacters: number }
  | { capability: "image"; imageCount: number }
  | { capability: "tts" | "video"; durationSeconds: number };

export type QuotaWindow = {
  limitUnits: number;
  usedUnits: number;
  resetsAt: string;
};

export type CostPolicyInput = {
  mode: CostMode;
  request: UsageRequest;
  billingOwner: ProviderBillingOwner;
  providerConnected: boolean;
  quota?: QuotaWindow;
};

export type CostPolicyDecision = {
  allowed: boolean;
  estimatedUnits: number;
  remainingUnits: number | null;
  resetsAt: string | null;
  reason:
    | "local_zero_cost"
    | "invalid_estimate"
    | "owner_billing_forbidden"
    | "provider_required"
    | "quota_unverified"
    | "quota_exhausted"
    | "external_quota_available";
};

export function resolveCostMode(value: string | undefined): CostMode {
  return value === ZERO_OWNER_COST_MODE ? value : ZERO_OWNER_COST_MODE;
}

function wholeUnits(value: number): number {
  if (!Number.isFinite(value) || value < 0) return Number.POSITIVE_INFINITY;
  return Math.max(1, Math.ceil(value));
}

export function estimateUsage(request: UsageRequest): number {
  switch (request.capability) {
    case "local_rules":
      return 0;
    case "ai_text":
      return wholeUnits(request.inputCharacters / 4);
    case "image":
      return wholeUnits(request.imageCount);
    case "tts":
    case "video":
      return wholeUnits(request.durationSeconds);
  }
}

function verifiedQuota(quota: QuotaWindow | undefined, now: Date) {
  if (
    !quota ||
    !Number.isFinite(quota.limitUnits) ||
    !Number.isFinite(quota.usedUnits) ||
    quota.limitUnits < 0 ||
    quota.usedUnits < 0
  ) {
    return null;
  }

  const resetTime = Date.parse(quota.resetsAt);
  if (!Number.isFinite(resetTime) || resetTime <= now.getTime()) return null;

  return {
    remainingUnits: Math.max(0, quota.limitUnits - quota.usedUnits),
    resetsAt: quota.resetsAt,
  };
}

export function evaluateCostPolicy(
  input: CostPolicyInput,
  now = new Date(),
): CostPolicyDecision {
  const estimatedUnits = estimateUsage(input.request);

  if (!Number.isFinite(estimatedUnits)) {
    return {
      allowed: false,
      estimatedUnits,
      remainingUnits: null,
      resetsAt: null,
      reason: "invalid_estimate",
    };
  }

  if (input.request.capability === "local_rules") {
    return {
      allowed: true,
      estimatedUnits,
      remainingUnits: null,
      resetsAt: null,
      reason: "local_zero_cost",
    };
  }

  const quota = verifiedQuota(input.quota, now);

  if (input.billingOwner === "project") {
    return {
      allowed: false,
      estimatedUnits,
      remainingUnits: quota?.remainingUnits ?? null,
      resetsAt: quota?.resetsAt ?? null,
      reason: "owner_billing_forbidden",
    };
  }

  if (
    !input.providerConnected ||
    (input.billingOwner !== "user" && input.billingOwner !== "institution")
  ) {
    return {
      allowed: false,
      estimatedUnits,
      remainingUnits: quota?.remainingUnits ?? null,
      resetsAt: quota?.resetsAt ?? null,
      reason: "provider_required",
    };
  }

  if (!quota) {
    return {
      allowed: false,
      estimatedUnits,
      remainingUnits: null,
      resetsAt: null,
      reason: "quota_unverified",
    };
  }

  if (estimatedUnits > quota.remainingUnits) {
    return {
      allowed: false,
      estimatedUnits,
      remainingUnits: quota.remainingUnits,
      resetsAt: quota.resetsAt,
      reason: "quota_exhausted",
    };
  }

  return {
    allowed: true,
    estimatedUnits,
    remainingUnits: quota.remainingUnits - estimatedUnits,
    resetsAt: quota.resetsAt,
    reason: "external_quota_available",
  };
}
