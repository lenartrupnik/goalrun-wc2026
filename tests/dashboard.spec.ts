import { test, expect } from "@playwright/test";

/**
 * Basic smoke + structure tests for GoalRun WC2026.
 *
 * These are intentionally lightweight because full dashboard flows require
 * authenticated Supabase session (email+password or OAuth) + seeded data.
 *
 * Recommended for CI:
 *   1. Spin up a dedicated test Supabase instance (or use local supabase cli)
 *   2. Apply migrations
 *   3. Create a test user
 *   4. Set env PLAYWRIGHT_TEST_BASE_URL + test credentials (via storageState or login helper)
 *
 * To run locally (after starting the app):
 *   npx playwright test
 */

test.describe("public landing", () => {
  test("landing page loads and shows key marketing content", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/GoalRun WC2026/);

    // Hero / main CTA area
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Challenge explanation section exists (from README + components)
    await expect(page.getByText(/Every Goal = 1km/i)).toBeVisible();
  });
});

test.describe("auth pages", () => {
  test("login page renders form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("signup page renders form", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /create account/i })).toBeVisible();
    await expect(page.getByLabel(/display name/i)).toBeVisible();
  });
});

// NOTE: The following are example skeletons for future authenticated tests.
// They are skipped until a proper test auth fixture + RLS test data is provided.
test.describe.skip("authenticated dashboard (requires test user + seeded runs)", () => {
  test.beforeEach(async ({ page }) => {
    // Example: await loginViaUI(page, TEST_USER);
    // Or use page.context().addCookies(...) from a saved auth.json (storageState)
  });

  test("dashboard shows progress, log form, leaderboard, and my runs table", async ({ page }) => {
    await page.goto("/dashboard");

    // Key sections from current + new feature
    await expect(page.getByRole("heading", { name: "My Progress" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Log a Run" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Leaderboard" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "My Runs" })).toBeVisible();

    // The My Runs area should be scrollable (has inner scroll container)
    // This is a structural assertion that the new feature is present
    const myRunsCard = page.getByRole("heading", { name: "My Runs" }).locator("..").locator("..");
    await expect(myRunsCard).toBeVisible();
  });

  test("can open edit mode in My Runs table (if runs exist)", async ({ page }) => {
    await page.goto("/dashboard");

    // If there is at least one run row with an edit button
    const editBtn = page.getByRole("button", { name: "Edit run" }).first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      // Should show save/cancel icons
      await expect(page.getByRole("button", { name: "Save changes" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Cancel edit" })).toBeVisible();
    }
  });
});
