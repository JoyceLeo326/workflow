import { defineConfig } from "@playwright/test";

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const port = Number(process.env.VERCEL_STATIC_TEST_PORT ?? 4278);
const localOrigin = `http://127.0.0.1:${port}`;
const origin = externalBaseUrl ? new URL(externalBaseUrl).origin : localOrigin;

process.env.PLAYWRIGHT_ENTRY_PATH = "/";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 12_000 },
  reporter: [["line"], ["html", { open: "never" }]],
  use: {
    baseURL: origin,
    locale: "zh-CN",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: externalBaseUrl
    ? undefined
    : {
        command: `node scripts/serve-pages.mjs --port ${port} --base-path /`,
        url: localOrigin,
        reuseExistingServer: false,
        timeout: 30_000,
      },
  projects: [
    { name: "vercel-desktop-1440", use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: "vercel-mobile-320",
      use: { hasTouch: true, isMobile: true, viewport: { width: 320, height: 844 } },
    },
  ],
});
