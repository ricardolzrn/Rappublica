const { defineConfig, devices } = require("@playwright/test");
const { existsSync } = require("node:fs");
module.exports = defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  expect: { timeout: 15000 },
  reporter: "list",
  outputDir: "test-results",
  use: {
    ...devices["Pixel 7"],
    baseURL: "http://localhost:8082",
    actionTimeout: 15000,
    trace: "retain-on-failure",
    launchOptions: existsSync("/usr/bin/chromium")
      ? {
          executablePath: "/usr/bin/chromium",
          args: ["--no-sandbox", "--disable-dev-shm-usage"],
        }
      : {},
  },
  webServer: [
    {
      command: "npm run api",
      url: "http://localhost:3101/api/health",
      env: { PORT: "3101", DB_PATH: ":memory:" },
      reuseExistingServer: false,
      timeout: 20000,
    },
    {
      command: "npm run web -- --localhost --port 8082 --max-workers 2",
      url: "http://localhost:8082",
      env: {
        CI: "1",
        EXPO_OFFLINE: "1",
        EXPO_PUBLIC_API_URL: "http://localhost:3101/api",
      },
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
});
