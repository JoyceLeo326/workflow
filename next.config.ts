import type { NextConfig } from "next";

const browserDemoMode =
  process.env.NEXT_PUBLIC_BROWSER_DEMO ?? (process.env.VERCEL === "1" ? "1" : undefined);

const nextConfig: NextConfig = {
  ...(browserDemoMode
    ? {
        env: {
          NEXT_PUBLIC_BROWSER_DEMO: browserDemoMode,
        },
      }
    : {}),
};

export default nextConfig;
