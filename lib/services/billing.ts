import type { Invoice, Subscription } from "@/types/database.types";

export type { Subscription };

/**
 * Phase 7 — Local Paywall.
 *
 * Free Starter Tier: up to 3 invoices/month (non-cancelled).
 * Pro Freelancer Tier (₱299/mo or ₱1,999/yr) — unlimited invoices and the
 * full feature set (see INVOISPH_MASTER_PLAN.md Phase 7).
 */

export const FREE_TIER_INVOICE_LIMIT_PER_MONTH = 3;
export const PRO_MONTHLY_PRICE_PHP = 299; // ₱299/mo
export const PRO_ANNUAL_PRICE_PHP = 1999; // ₱1,999/yr

export type ProTier = "pro_monthly" | "pro_annual";

/**
 * Local product flag — while false the payment gate is disabled: every user
 * is treated as having the Pro (unlimited) feature set — no upgrade prompts,
 * no free-tier invoice limits. Flip to true to re-enable the gate once the
 * team decides to monetize.
 */
export const PAYMENT_GATE_ENABLED = false;

/** A user counts as Pro only when their subscription is active Pro. */
export function isProActive(subscription: Subscription | null | undefined): boolean {
  if (!PAYMENT_GATE_ENABLED) return true;
  return (
    subscription?.status === "active" &&
    (subscription.plan_tier === "pro_monthly" || subscription.plan_tier === "pro_annual")
  );
}

/**
 * True when the Free Starter limit is exhausted: no active Pro subscription
 * and the current month already has `FREE_TIER_INVOICE_LIMIT_PER_MONTH`
 * non-cancelled invoices.
 */
export function freeTierInvoiceLimitExceeded(
  invoices: Invoice[],
  subscription: Subscription | null | undefined
): boolean {
  if (!PAYMENT_GATE_ENABLED) return false;
  if (isProActive(subscription)) return false;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  return (
    invoices.filter(
      (inv) => inv.status !== "cancelled" && new Date(inv.created_at) >= startOfMonth
    ).length >= FREE_TIER_INVOICE_LIMIT_PER_MONTH
  );
}
