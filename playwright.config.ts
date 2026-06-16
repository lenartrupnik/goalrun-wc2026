import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for GoalRun WC2026.
 * E2E tests require:
 *   - `npm run dev` (or deployed URL via PLAYWRIGHT_TEST_BASE_URL)
 *   - A test Supabase project with the schema applied + a test user
 *
 * Run: npx playwright test
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],

  // If you want auto-start dev server during test (optional):
  // webServer: {
  //   command: "npm run dev",
  //   url: "http://127.0.0.1:3000",
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});
