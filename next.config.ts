import type { NextConfig } from "next";

const offlineMode =
  process.env.NEXT_PUBLIC_OFFLINE_MODE ?? (process.env.VERCEL === "1" ? "1" : undefined);
const providerOwnership = process.env.AI_PROVIDER_OWNERSHIP;
const providerConnected =
  (providerOwnership === "user" || providerOwnership === "institution") &&
  Boolean(process.env.OPENAI_API_KEY);
const quotaLimit = Number(process.env.AI_PROVIDER_QUOTA_LIMIT);
const quotaUsed = Number(process.env.AI_PROVIDER_QUOTA_USED);
const quotaResetTime = Date.parse(process.env.AI_PROVIDER_QUOTA_RESET_AT ?? "");
const providerQuotaReady =
  process.env.AI_PROVIDER_QUOTA_LIMIT !== undefined &&
  process.env.AI_PROVIDER_QUOTA_USED !== undefined &&
  Number.isFinite(quotaLimit) &&
  Number.isFinite(quotaUsed) &&
  quotaLimit > quotaUsed &&
  quotaUsed >= 0 &&
  Number.isFinite(quotaResetTime) &&
  quotaResetTime > Date.now();
const providerStatus = providerConnected
  ? providerQuotaReady
    ? "ready"
    : "blocked"
  : "not_connected";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_OFFLINE_MODE: offlineMode ?? "0",
    NEXT_PUBLIC_COST_MODE: "zero_owner_cost",
    NEXT_PUBLIC_PROVIDER_STATUS: providerStatus,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
