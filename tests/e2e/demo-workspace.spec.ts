import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * Demo-mode end-to-end flows. Entering "Preview Demo Mode" on /login flips an
 * `invoisph_demo` cookie and lands on /dashboard; every protected page is then
 * reachable without a Supabase session.
 */
async function enterDemoMode(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: /Preview Demo Mode/ }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test("dashboard (demo): tax meter, quick cards", async ({ page }) => {
  await enterDemoMode(page);
  await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible();
  // Payment gate disabled: no Free Starter paywall banner.
  await expect(page.getByText(/Free Starter tier/)).toHaveCount(0);
  await expect(page.getByText(/Annual ₱250,000 Tax-Free Threshold Meter/)).toBeVisible();
  await expect(page.getByText("Client Directory")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Proof of Income" })).toBeVisible();
});

test("create invoice (demo): builder → INV-0005 saved", async ({ page }) => {
  await enterDemoMode(page);
  await page.goto("/invoices/new");
  await expect(page).toHaveURL(/\/invoices\/new/);

  await page.locator("#client").selectOption({ value: "demo-client-1" });
  await page.getByLabel("Line 1 description").fill("Consulting session");
  await page.getByLabel("Line 1 rate").fill("1500");
  await page.getByLabel("Line 1 quantity").fill("2");

  await page.getByRole("button", { name: "Save as Draft" }).click();
  await expect(page).toHaveURL(/\/invoices\?created=INV-0005/);
  await expect(page.getByText(/Invoice INV-0005 saved\./)).toBeVisible();
});

test("invoice list (demo): summary tiles, tabs, and detail page", async ({ page }) => {
  await enterDemoMode(page);
  await page.goto("/invoices");
  await expect(page.getByRole("heading", { name: "Service Invoices" })).toBeVisible();
  await expect(page.getByText("Invoiced")).toBeVisible();
  await expect(page.getByText("Collected")).toBeVisible();
  await expect(page.getByRole("button", { name: /^All \(/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Unpaid \(/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Paid \(/ })).toBeVisible();

  // Open the detail page of the newest invoice.
  await page.locator("tbody a").first().click();
  await expect(page).toHaveURL(/\/invoices\/[^/]+/);
  await expect(page.getByRole("button", { name: "Download PDF" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Print" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
});

test("invoice detail (demo): Download PDF produces a BIR service invoice PDF", async ({ page }) => {
  await enterDemoMode(page);
  await page.goto("/invoices");
  await page.locator("tbody a").first().click();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download PDF" }).click(),
  ]);
  const path = await download.path();
  expect(path).toBeTruthy();
  const content = readFileSync(path!, "utf8");
  // A real PDF: magic header, non-trivial size.
  expect(content.startsWith("%PDF-")).toBe(true);
  expect(content.length).toBeGreaterThan(1000);
});

test("clients (demo): directory lists, add + archive a client", async ({ page }) => {
  await enterDemoMode(page);
  // The directory is persisted in localStorage; start from a clean list so
  // the card counts below are deterministic.
  await page.evaluate(() => localStorage.removeItem("invoisph_demo_clients"));
  await page.goto("/clients");
  await expect(page.getByRole("heading", { name: "Client Directory" })).toBeVisible();
  await expect(page.getByText("Apex Growth Marketing LLC")).toBeVisible();
  await expect(page.getByText("Exchange Rates to PHP (Daily)")).toBeVisible();

  // Add a client
  await page.getByRole("button", { name: /Add New Client/ }).click();
  // The modal is a portal; its name field is uniquely the input with the
  // Acme placeholder (the page behind it has a search box).
  await page.getByPlaceholder("e.g. Acme Tech Solutions LLC").fill("E2E Test Client");
  await page.getByRole("button", { name: "Create Client" }).click();
  await expect(page.getByText("E2E Test Client")).toBeVisible();

  // Archive it — the card disappears (archived clients are hidden by default)
  await page.locator('button[title="Archive Client"]').first().click();
  await expect(page.getByText("E2E Test Client")).toHaveCount(0);

  // Toggle "Show archived" — the card returns with an Unarchive button
  await page.getByRole("button", { name: /Show archived/ }).click();
  await expect(page.getByText("E2E Test Client")).toBeVisible();
  await expect(page.locator('button[title="Unarchive Client"]')).toBeVisible();
});

test("tax dashboard (demo): meter, quarters, cheat sheet", async ({ page }) => {
  await enterDemoMode(page);
  await page.goto("/tax-dashboard");
  await expect(page.getByRole("heading", { name: /Tax Tracker/ })).toBeVisible();
  await expect(page.getByText("Annual ₱250,000 Tax-Free Threshold Meter")).toBeVisible();
  await expect(page.getByText("Q1 (Jan–Mar)")).toBeVisible();
  await expect(page.getByText("Q2 (Apr–Jun)")).toBeVisible();
  await expect(page.getByText("Q3 (Jul–Sep)")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Annual \/ Q4/ })).toBeVisible();

  // The eBIRForms cheat sheet shows the exact 1701Q boxes to fill.
  await page.getByRole("button", { name: "eBIRForms Cheat Sheet" }).click();
  await expect(page.getByText("eBIRForms Cheat Sheet — BIR Form 1701Q")).toBeVisible();
  await expect(page.getByText("Part II, Item 32 — Gross Sales/Receipts")).toBeVisible();
  await expect(page.getByText("Part II, Item 36 — Allowable Deduction ₱250k")).toBeVisible();
  await expect(page.getByText("Part II, Item 38 — Tax Due at 8%")).toBeVisible();
  await expect(page.getByText("Creditable Withholding Taxes (Form 2307, if any)")).toBeVisible();
  // "Net Tax Payable" also appears in the summary bold; the cheat sheet row is the cell.
  await expect(page.getByRole("cell", { name: "Net Tax Payable" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export Tax Summary CSV" })).toBeVisible();
});

test("proof of income (demo): generates a certificate PDF", async ({ page }) => {
  await enterDemoMode(page);
  await page.goto("/reports/proof-of-income");
  await expect(page.getByRole("heading", { name: /Proof of Income/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Generate & Download PDF" })).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Generate & Download PDF" }).click(),
  ]);
  const path = await download.path();
  expect(path).toBeTruthy();
  const content = readFileSync(path!, "utf8");
  expect(content.startsWith("%PDF-")).toBe(true);
});
