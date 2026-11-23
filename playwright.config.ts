import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://localhost:3001",
    trace: "retain-on-failure",
  },
  webServer: {
    // Start the app (or point Playwright at your running one:
    // `reuseExistingServer: true` below does this — run `pnpm dev` yourself).
    command: "pnpm dev",
    url: "http://localhost:3001",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
