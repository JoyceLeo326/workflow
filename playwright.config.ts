import { defineConfig } from "@playwright/test";

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const localBaseUrl = "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  timeout: 75_000,
  expect: { timeout: 10_000 },
  reporter: [["line"], ["html", { open: "never" }]],
  use: {
    baseURL: externalBaseUrl ?? localBaseUrl,
    locale: "zh-CN",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: externalBaseUrl
    ? undefined
    : {
        command: "npm run start -- -p 4173",
        url: localBaseUrl,
        reuseExistingServer: true,
        timeout: 90_000,
      },
  projects: [
    {
      name: "desktop-1440",
      use: { viewport: { width: 1440, height: 1000 } },
    },
    {
      name: "mobile-320",
      use: { hasTouch: true, isMobile: true, viewport: { width: 320, height: 844 } },
    },
    {
      name: "mobile-390",
      use: { hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } },
    },
    {
      name: "mobile-430",
      use: { hasTouch: true, isMobile: true, viewport: { width: 430, height: 932 } },
    },
  ],
});
