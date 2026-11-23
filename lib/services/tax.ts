import type { Invoice } from "@/types/database.types";

/**
 * Phase 5 — 8% Flat Tax Tracker & eBIRForms Mapper.
 *
 * Pure math over raw invoices so the threshold meter, the quarterly
 * breakdown, the eBIRForms cheat sheet and the CSV export all agree on the
 * same numbers.
 *
 * Rules (RA 11976, BIR-compliant):
 * - Only invoices with status "sent" or "paid" count as receipts.
 * - Gross receipts are measured in PHP via `total_in_php` (BIR-tracked).
 * - The ₱250,000 allowance is consumed by the calendar year's gross
 *   receipts and is attributed to the quarter where it runs out.
 * - Tax due = 8% of (annualGross − allowance).
 */

/** Annual gross below this is tax-free (₱250,000 exemption). */
export const TAX_FREE_THRESHOLD_PHP = 250000;

/** Flat income tax rate of RA 11976. */
export const TAX_RATE = 0.08;

/** Money with two decimals, as BIR amounts are written. */
export function taxMoney(value: number): string {
  return (Math.round(value * 100) / 100).toFixed(2);
}

function isReceipt(invoice: Invoice): boolean {
  return invoice.status === "sent" || invoice.status === "paid";
}

function invoiceGrossPhp(invoice: Invoice): number {
  return Number(invoice.total_in_php) || 0;
}

export interface TaxQuarter {
  id: "q1" | "q2" | "q3" | "q4";
  /** Card heading, e.g. "Q1 (Jan–Mar)". */
  title: string;
  /** Card label, e.g. "Q1 — Filed May 15". */
  label: string;
  /** Gross receipts issued within this quarter (₱). */
  gross: number;
  /** How much of the annual allowance this quarter consumed (₱). */
  allowanceApplied: number;
  /** 8% tax due in this quarter (₱). */
  taxDue: number;
}

export interface TaxSummary {
  year: number;
  /** All receipts issued in the calendar year (₱). */
  annualGross: number;
  /** The allowance available this year (₱): ₱250k, or less if exhausted. */
  annualAllowance: number;
  /** Tax due: 8% of (annualGross − annualAllowance) (₱). */
  annualTaxDue: number;
  /** Creditable withholding taxes recorded on receipts (₱). */
  withholding: number;
  /** Tax Due − Withholding — the net amount to pay (₱). */
  netTaxPayable: number;
  /** Earnings grouped by currency, biggest PHP first. */
  byCurrency: { currency: string; total: number; totalPhp: number }[];
  quarters: TaxQuarter[];
}

const QUARTER_RANGES = {
  q1: { start: "-01-01", end: "-03-31", title: "Q1 (Jan–Mar)", label: "Q1 — Filed May 15" },
  q2: { start: "-04-01", end: "-06-30", title: "Q2 (Apr–Jun)", label: "Q2 — Filed Aug 15" },
  q3: { start: "-07-01", end: "-09-30", title: "Q3 (Jul–Sep)", label: "Q3 — Filed Nov 15" },
  // "Annual / Q4": the whole calendar year, filed as the annual 1701Q (Apr 15).
  q4: { start: "-01-01", end: "-12-31", title: "Annual / Q4 (Jan–Dec)", label: "Annual / Q4 — Filed Apr 15" },
} as const;

export function computeTaxSummary(
  invoices: Invoice[],
  year = new Date().getFullYear()
): TaxSummary {
  const receipts = invoices.filter(isReceipt);

  /** Gross receipts with issue_date in [start, end], inclusive. */
  const grossIn = (start: string, end: string): number =>
    receipts.reduce((sum, invoice) => {
      const date = invoice.issue_date || "";
      return date >= start && date <= end ? sum + invoiceGrossPhp(invoice) : sum;
    }, 0);

  const q1Gross = grossIn(`${year}${QUARTER_RANGES.q1.start}`, `${year}${QUARTER_RANGES.q1.end}`);
  const q2Gross = grossIn(`${year}${QUARTER_RANGES.q2.start}`, `${year}${QUARTER_RANGES.q2.end}`);
  const q3Gross = grossIn(`${year}${QUARTER_RANGES.q3.start}`, `${year}${QUARTER_RANGES.q3.end}`);
  const annualGross = grossIn(`${year}-01-01`, `${year}-12-31`);

  /** Allowance "used up through" a date: min(cumulative gross, ₱250k). */
  const allowanceThrough = (end: string): number =>
    Math.min(grossIn(`${year}-01-01`, end), TAX_FREE_THRESHOLD_PHP);

  const annualAllowance = Math.min(annualGross, TAX_FREE_THRESHOLD_PHP);
  const annualTaxDue = Math.max(0, (annualGross - annualAllowance) * TAX_RATE);

  const allowanceQ1 = allowanceThrough(`${year}-03-31`);
  const allowanceQ2 = Math.max(0, allowanceThrough(`${year}-06-30`) - allowanceQ1);
  const allowanceQ3 = Math.max(0, allowanceThrough(`${year}-09-30`) - allowanceThrough(`${year}-06-30`));

  const taxDue = (gross: number, allowance: number): number =>
    Math.max(0, (gross - allowance) * TAX_RATE);

  const quarters: TaxQuarter[] = [
    { id: "q1", title: QUARTER_RANGES.q1.title, label: QUARTER_RANGES.q1.label, gross: q1Gross, allowanceApplied: allowanceQ1, taxDue: taxDue(q1Gross, allowanceQ1) },
    { id: "q2", title: QUARTER_RANGES.q2.title, label: QUARTER_RANGES.q2.label, gross: q2Gross, allowanceApplied: allowanceQ2, taxDue: taxDue(q2Gross, allowanceQ2) },
    { id: "q3", title: QUARTER_RANGES.q3.title, label: QUARTER_RANGES.q3.label, gross: q3Gross, allowanceApplied: allowanceQ3, taxDue: taxDue(q3Gross, allowanceQ3) },
    { id: "q4", title: QUARTER_RANGES.q4.title, label: QUARTER_RANGES.q4.label, gross: annualGross, allowanceApplied: annualAllowance, taxDue: annualTaxDue },
  ];

  // Per-currency gross totals (original + PHP equivalent) for accountants.
  const byCurrency: { currency: string; total: number; totalPhp: number }[] = [];
  for (const receipt of receipts) {
    const entry = byCurrency.find((e) => e.currency === receipt.currency);
    if (entry) {
      entry.total += Number(receipt.total_original_currency) || 0;
      entry.totalPhp += invoiceGrossPhp(receipt);
    } else {
      byCurrency.push({
        currency: receipt.currency,
        total: Number(receipt.total_original_currency) || 0,
        totalPhp: invoiceGrossPhp(receipt),
      });
    }
  }
  byCurrency.sort((a, b) => b.totalPhp - a.totalPhp || b.total - a.total);

  const withholding = receipts.reduce(
    (sum, invoice) => sum + Math.max(0, Number(invoice.withholding_tax_amount_php) || 0),
    0
  );

  return {
    year,
    annualGross,
    annualAllowance,
    annualTaxDue,
    withholding,
    netTaxPayable: annualTaxDue - withholding,
    byCurrency,
    quarters,
  };
}

/**
 * Tax Summary CSV for accountants — one row per quarter, the annual row last.
 */
export function buildTaxSummaryCsv(summary: TaxSummary): string {
  const rows = summary.quarters.map((q) =>
    [q.label, taxMoney(q.gross), taxMoney(q.allowanceApplied), taxMoney(q.taxDue)].join(",")
  );
  return [
    "Quarter,Gross Receipts (PHP),Allowance Applied (PHP),Tax Due (PHP)",
    ...rows,
  ].join("\n");
}
