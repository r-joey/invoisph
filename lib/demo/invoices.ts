import type { Invoice } from "@/types/database.types";

/**
 * Demo invoices for the no-Supabase "Preview Demo Mode" path. Amounts are
 * internally consistent (total_in_php = total_original_currency * bsp_fx_rate)
 * so the dashboard meter and the list totals behave like real rows.
 */
const DEMO_INVOICES_STORAGE_KEY = "invoisph_demo_invoices";

export const DEMO_INVOICE_DISCLAIMER =
  "THIS SERVICE INVOICE COMPLIES WITH RA 11976 (EASE OF PAYING TAXES ACT).";

function isoDate(daysFromToday: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function buildSeedInvoices(): Invoice[] {
  const now = new Date().toISOString();

  // USD 1,800.00 x 58.55 = PHP 105,390.00
  const apexTotal = 105390;
  // AUD 1,400.00 x 38.25 = PHP 53,550.00
  const sydneyTotal = 53550;

  return [
    {
      id: "demo-invoice-1",
      user_id: "demo-user",
      client_id: "demo-client-1",
      invoice_number: "INV-0001",
      issue_date: isoDate(-38),
      due_date: isoDate(-23),
      status: "paid",
      currency: "USD",
      subtotal: 1800,
      discount: 0,
      total_original_currency: 1800,
      bsp_fx_rate: 58.55,
      total_in_php: apexTotal,
      withholding_tax_rate: 0,
      withholding_tax_amount_php: 0,
      net_amount_payable_php: apexTotal,
      payment_date: isoDate(-25),
      payment_method: "Wise",
      notes_disclaimer: DEMO_INVOICE_DISCLAIMER,
      created_at: now,
      updated_at: now,
    },
    {
      id: "demo-invoice-2",
      user_id: "demo-user",
      client_id: "demo-client-3",
      invoice_number: "INV-0002",
      issue_date: isoDate(-20),
      due_date: isoDate(-5),
      status: "paid",
      currency: "PHP",
      subtotal: 45000,
      discount: 3000,
      total_original_currency: 42000,
      bsp_fx_rate: 1,
      total_in_php: 42000,
      withholding_tax_rate: 5,
      withholding_tax_amount_php: 2100,
      net_amount_payable_php: 39900,
      payment_date: isoDate(-6),
      payment_method: "Direct Bank",
      notes_disclaimer: DEMO_INVOICE_DISCLAIMER,
      created_at: now,
      updated_at: now,
    },
    {
      id: "demo-invoice-3",
      user_id: "demo-user",
      client_id: "demo-client-2",
      invoice_number: "INV-0003",
      issue_date: isoDate(-9),
      due_date: isoDate(6),
      status: "sent",
      currency: "AUD",
      subtotal: 1400,
      discount: 0,
      total_original_currency: 1400,
      bsp_fx_rate: 38.25,
      total_in_php: sydneyTotal,
      withholding_tax_rate: 0,
      withholding_tax_amount_php: 0,
      net_amount_payable_php: sydneyTotal,
      payment_date: null,
      payment_method: null,
      notes_disclaimer: DEMO_INVOICE_DISCLAIMER,
      created_at: now,
      updated_at: now,
    },
    {
      id: "demo-invoice-4",
      user_id: "demo-user",
      client_id: "demo-client-1",
      invoice_number: "INV-0004",
      issue_date: isoDate(-2),
      due_date: isoDate(13),
      status: "draft",
      currency: "USD",
      subtotal: 900,
      discount: 0,
      total_original_currency: 900,
      bsp_fx_rate: 58.55,
      total_in_php: 52695,
      withholding_tax_rate: 0,
      withholding_tax_amount_php: 0,
      net_amount_payable_php: 52695,
      payment_date: null,
      payment_method: null,
      notes_disclaimer: DEMO_INVOICE_DISCLAIMER,
      created_at: now,
      updated_at: now,
    },
  ];
}

/** Read demo invoices (newest issue date first), seeding on first use. */
export function getDemoInvoices(): Invoice[] {
  if (typeof window === "undefined") return buildSeedInvoices();

  const raw = window.localStorage.getItem(DEMO_INVOICES_STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Invoice[];
      if (Array.isArray(parsed)) {
        return [...parsed].sort((a, b) => b.issue_date.localeCompare(a.issue_date));
      }
    } catch {
      // Corrupt demo data falls back to the seed below.
    }
  }

  const seeded = buildSeedInvoices();
  saveDemoInvoices(seeded);
  return seeded;
}

export function saveDemoInvoices(invoices: Invoice[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_INVOICES_STORAGE_KEY, JSON.stringify(invoices));
}

/** Next sequential number for a locally-created demo invoice. */
export function nextDemoInvoiceNumber(invoices: Invoice[]): string {
  let highest = invoices.length;
  for (const invoice of invoices) {
    const match = /(\d+)$/.exec(invoice.invoice_number);
    if (match) highest = Math.max(highest, Number(match[1]));
  }
  return `INV-${String(highest + 1).padStart(4, "0")}`;
}
