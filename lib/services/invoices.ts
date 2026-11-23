import type { Invoice } from "@/types/database.types";

/**
 * Phase 3 — shared Service Invoice maths and presentation metadata.
 *
 * Everything here is pure so the builder, the list view and (later) the PDF
 * template all round money exactly the same way.
 */

export type InvoiceStatus = Invoice["status"];

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Unpaid",
  paid: "Paid",
  cancelled: "Cancelled",
};

export const INVOICE_STATUS_BADGE: Record<InvoiceStatus, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  sent: "bg-amber-50 text-amber-800 border-amber-200",
  paid: "bg-emerald-50 text-emerald-800 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

/** Payment channels freelancers are actually paid through in the Philippines. */
export const PAYMENT_METHODS = [
  "Wise",
  "PayPal",
  "Direct Bank",
  "GCash",
  "Maya",
] as const;

/** Creditable withholding tax rates commonly withheld on Form 2307. */
export const WITHHOLDING_TAX_RATES = [5, 10] as const;

export const DEFAULT_INVOICE_DISCLAIMER =
  "THIS SERVICE INVOICE COMPLIES WITH RA 11976 (EASE OF PAYING TAXES ACT).";

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------

/** Round half-up to centavos without floating point drift (0.1 + 0.2 style). */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function parseAmount(value: string | number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ---------------------------------------------------------------------------
// Line items
// ---------------------------------------------------------------------------

/**
 * A line item while it is being edited. Quantity and rate stay strings because
 * they are bound to inputs and must survive partially-typed values ("12.", "-").
 */
export interface DraftLineItem {
  key: string;
  description: string;
  quantity: string;
  rate: string;
}

let itemKeySeed = 0;

export function createEmptyLineItem(): DraftLineItem {
  itemKeySeed += 1;
  return {
    key: `item-${itemKeySeed}`,
    description: "",
    quantity: "1",
    rate: "",
  };
}

export function lineItemTotal(item: DraftLineItem): number {
  return round2(parseAmount(item.quantity) * parseAmount(item.rate));
}

// ---------------------------------------------------------------------------
// Invoice totals
// ---------------------------------------------------------------------------

export interface InvoiceTotals {
  /** Sum of the line items, in the invoice currency. */
  subtotal: number;
  /** Discount actually applied (clamped to the subtotal), invoice currency. */
  discount: number;
  /** subtotal - discount, invoice currency. */
  totalOriginal: number;
  /** Foreign-currency units per 1 PHP conversion rate; 1 for PHP invoices. */
  fxRate: number;
  /** Official PHP equivalent of totalOriginal — this is what BIR tracks. */
  totalPhp: number;
  /** Withholding tax rate as a percentage (0-100). */
  whtRate: number;
  /** Form 2307 amount withheld, in PHP. */
  whtAmountPhp: number;
  /** What the client actually remits, in PHP. */
  netPayablePhp: number;
}

export function computeTotals(input: {
  items: DraftLineItem[];
  discount: string | number;
  currency: string;
  fxRate: number;
  whtRate: number;
}): InvoiceTotals {
  const subtotal = round2(
    input.items.reduce((sum, item) => sum + lineItemTotal(item), 0)
  );

  // A discount can never exceed the subtotal, and negatives are meaningless.
  const discount = clamp(round2(parseAmount(input.discount)), 0, subtotal);
  const totalOriginal = round2(subtotal - discount);

  const fxRate = input.currency === "PHP" ? 1 : round4(input.fxRate);
  const totalPhp = round2(totalOriginal * fxRate);

  const whtRate = clamp(input.whtRate, 0, 100);
  const whtAmountPhp = round2((totalPhp * whtRate) / 100);
  const netPayablePhp = round2(totalPhp - whtAmountPhp);

  return {
    subtotal,
    discount,
    totalOriginal,
    fxRate,
    totalPhp,
    whtRate,
    whtAmountPhp,
    netPayablePhp,
  };
}

function round4(value: number): number {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}

// ---------------------------------------------------------------------------
// Numbering
// ---------------------------------------------------------------------------

/**
 * Preview of the number the database will allocate next. The invoice insert
 * sends an empty invoice_number and the set_invoice_number trigger fills in the
 * real one, so this is display-only — see supabase/schema.sql.
 */
export function formatInvoiceNumber(prefix: string | null, next: number): string {
  const cleanPrefix = (prefix || "INV").trim().toUpperCase() || "INV";
  const safeNext = Number.isFinite(next) && next > 0 ? Math.floor(next) : 1;
  return `${cleanPrefix}-${String(safeNext).padStart(4, "0")}`;
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

/** Format a Date as the yyyy-mm-dd string that <input type="date"> expects. */
export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Today as yyyy-mm-dd in the user's local timezone (not UTC). */
export function todayInputValue(): string {
  return toDateInputValue(new Date());
}

/** Payment-term presets offered by the builder, in days. */
export const PAYMENT_TERM_PRESETS = [
  { label: "Due on receipt", days: 0 },
  { label: "Net 7", days: 7 },
  { label: "Net 15", days: 15 },
  { label: "Net 30", days: 30 },
] as const;

/** An unpaid invoice past its due date, evaluated in local time. */
export function isOverdue(invoice: Invoice, today = todayInputValue()): boolean {
  return invoice.status === "sent" && invoice.due_date < today;
}

export function formatInvoiceDate(value: string | null): string {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
