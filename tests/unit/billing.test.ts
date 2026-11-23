import { describe, expect, it } from "vitest";
import { freeTierInvoiceLimitExceeded, isProActive, type ProTier } from "@/lib/services/billing";
import { subscription } from "./factories";

function monthsAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

describe("isProActive", () => {
  it("returns true for everyone while the payment gate is disabled", () => {
    expect(isProActive(subscription({ status: "active", plan_tier: "pro_monthly" }))).toBe(true);
    expect(isProActive(subscription({ status: "active", plan_tier: "pro_annual" }))).toBe(true);
    expect(isProActive(subscription({ status: "active", plan_tier: "free" }))).toBe(true);
    expect(isProActive(subscription({ status: "pending", plan_tier: "pro_monthly" }))).toBe(true);
    expect(isProActive(subscription({ status: "cancelled", plan_tier: "pro_annual" }))).toBe(true);
    expect(isProActive(null)).toBe(true);
    expect(isProActive(undefined)).toBe(true);
  });
});

describe("freeTierInvoiceLimitExceeded", () => {
  it("is never exceeded while the payment gate is disabled", () => {
    const invoices = [
      { id: "a", created_at: monthsAgo(1), status: "paid" },
      { id: "b", created_at: monthsAgo(2), status: "sent" },
      { id: "c", created_at: monthsAgo(3), status: "paid" },
    ].map((row) => ({ ...row, invoice_number: row.id, issue_date: row.created_at, currency: "PHP", total_in_php: 100, total_original_currency: 100 })) as Parameters<typeof freeTierInvoiceLimitExceeded>[0];

    // Even with the historical "3+ invoices this month" shape, the gate is off.
    expect(freeTierInvoiceLimitExceeded(invoices, subscription())).toBe(false);
    expect(freeTierInvoiceLimitExceeded(invoices, subscription({ status: "active", plan_tier: "free" as ProTier }))).toBe(false);
  });
});
