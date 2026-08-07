import { defineConfig } from "@playwright/test";

const repository = process.env.GITHUB_REPOSITORY?.split("/").at(-1) ?? "workflow";
const basePath = `/${repository}/`;
const port = Number(process.env.PAGES_TEST_PORT ?? 4277);
const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const localOrigin = `http://127.0.0.1:${port}`;
const origin = externalBaseUrl ? new URL(externalBaseUrl).origin : localOrigin;

process.env.PLAYWRIGHT_ENTRY_PATH = basePath;

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
        command: `node scripts/serve-pages.mjs --port ${port}`,
        url: `${localOrigin}${basePath}`,
        reuseExistingServer: false,
        timeout: 30_000,
      },
  projects: [
    { name: "pages-desktop-1440", use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: "pages-mobile-320",
      use: { hasTouch: true, isMobile: true, viewport: { width: 320, height: 844 } },
    },
  ],
});
