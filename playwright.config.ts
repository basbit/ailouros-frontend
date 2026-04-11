import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ["list"],
    ["junit", { outputFile: "../var/artifacts/e2e/junit.xml" }],
    ["html", { open: "never", outputFolder: "../var/artifacts/e2e/report" }],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:5174",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev -- --host 127.0.0.1 --port 5174",
        url: "http://127.0.0.1:5174",
        reuseExistingServer: false,
        timeout: 60_000,
      },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
