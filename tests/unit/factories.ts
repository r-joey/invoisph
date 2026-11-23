import type { Client, Invoice, Subscription } from "@/types/database.types";

/** Minimal fully-typed Invoice factory for unit tests. */
export function invoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: "inv-1",
    user_id: "user-1",
    client_id: null,
    invoice_number: "INV-0001",
    issue_date: "2026-01-15",
    due_date: "2026-02-14",
    status: "paid",
    currency: "PHP",
    subtotal: 0,
    discount: 0,
    total_original_currency: 0,
    bsp_fx_rate: 1,
    total_in_php: 0,
    withholding_tax_rate: 0,
    withholding_tax_amount_php: 0,
    net_amount_payable_php: 0,
    payment_date: null,
    payment_method: null,
    notes_disclaimer: null,
    created_at: "2026-01-15T00:00:00.000Z",
    updated_at: "2026-01-15T00:00:00.000Z",
    ...overrides,
  } as Invoice;
}

/** Minimal Client factory for unit tests. */
export function client(overrides: Partial<Client> = {}): Client {
  return {
    id: "client-1",
    user_id: "user-1",
    name: "Test Client",
    email: null,
    country: "United States",
    currency: "USD",
    billing_address: null,
    notes: null,
    archived: false,
    manual_fx_rate: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as Client;
}

/** Minimal Subscription factory for unit tests. */
export function subscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: "sub-1",
    user_id: "user-1",
    plan_tier: "free",
    status: "active",
    paymongo_payment_id: null,
    current_period_start: null,
    current_period_end: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as Subscription;
}
