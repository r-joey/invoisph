import { test, expect } from "@playwright/test";

test.describe("public pages", () => {
  test("landing page (/): hero and CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /BIR-Compliant Service Invoices/
    );
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /8% Flat Tax Tracker/
    );
    await expect(page.getByRole("button", { name: /Get Started Free/ })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Create First Service Invoice Free/ })
    ).toBeVisible();
  });

  test("login page (/login): sign-in with email and password", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Welcome to InvoisPH")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Account" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Preview Demo Mode/ })).toBeVisible();
    // Google OAuth is disabled: no Google button remains.
    await expect(page.getByRole("button", { name: "Continue with Google" })).toHaveCount(0);
  });

  test("pricing page (/pricing): plans overview", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByText("Plans & Pricing")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Free Starter" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pro Freelancer" })).toBeVisible();
    // Payment gate disabled: everyone is on Pro — no "Upgrade to Pro" CTAs.
    await expect(page.getByRole("button", { name: /Upgrade to Pro/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Your Pro plan/ }).first()).toBeVisible();
  });

  test("GET /api/fx-rates returns the daily rate map", async ({ request }) => {
    const res = await request.get("/api/fx-rates");
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.ratesToPHP.USD).toBeGreaterThan(0);
    expect(json.ratesToPHP.PHP).toBe(1);
  });

  test("unauthenticated users are redirected from protected pages to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fdashboard/);
  });
});
