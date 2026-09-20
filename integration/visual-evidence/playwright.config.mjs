import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: ".",
  testMatch: "studio.evidence.spec.mjs",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  outputDir: "test-results",
  reporter: [
    ["line"],
    ["html", { outputFolder: "playwright-report", open: "never" }]
  ],
  use: {
    baseURL: "http://127.0.0.1:4010",
    viewport: { width: 1440, height: 960 },
    colorScheme: "dark",
    trace: "on",
    video: "on",
    screenshot: "only-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: {
    command: "node ../../packages/cli/bin/qroz.mjs dev ../../examples/taskboard/src/app.ts --port 4010 --no-open",
    url: "http://127.0.0.1:4010/__arc/",
    reuseExistingServer: false,
    timeout: 20_000
  }
})
