import { createElement } from "react";
import type { Client, Invoice, Profile } from "@/types/database.types";

/**
 * Phase 6 — Proof of Income / Visa Certificate Generator.
 *
 * Pure aggregation of paid invoices into the "Consolidated Earnings &
 * Client Remittance Summary" certificate, plus the browser download helper
 * (mirrors lib/services/invoice-pdf.tsx).
 *
 * Note: this module deliberately avoids JSX (React.createElement instead) so
 * it parses in Node (unit tests) as well as the browser bundle.
 */

/** One aggregated earnings row in the certificate (per paid invoice). */
export interface EarningRow {
  invoiceNumber: string;
  issueDate: string;
  clientName: string;
  clientCountry: string;
  currency: string;
  /** Amount in the invoice currency. */
  amount: number;
  /** BIR-tracked PHP equivalent of the invoice. */
  amountPhp: number;
  paymentMethod: string | null;
}

export interface ProofOfIncomeSummary {
  period: { start: string; end: string };
  invoiceCount: number;
  /** Total earnings in PHP across the period (sum of total_in_php). */
  totalPhp: number;
  /** Earnings grouped by currency, biggest PHP first. */
  byCurrency: { currency: string; total: number; totalPhp: number }[];
  rows: EarningRow[];
}

export const RANGE_PRESETS = [
  { id: "last6", label: "Last 6 Months" },
  { id: "last12", label: "Last 12 Months" },
  { id: "all", label: "All Time" },
  { id: "custom", label: "Custom dates" },
] as const;

export type RangePreset = (typeof RANGE_PRESETS)[number]["id"];

/** ISO "YYYY-MM-DD" of a Date in local time. */
function isoDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

/** Today as "YYYY-MM-DD". */
export function todayIso(): string {
  return isoDate(new Date());
}

/** Start date for a preset, relative to today. ("custom" is handled by the page.) */
export function periodFor(preset: Exclude<RangePreset, "custom">): { start: string; end: string } {
  const end = todayIso();
  if (preset === "last6") {
    const start = new Date();
    start.setMonth(start.getMonth() - 6);
    return { start: isoDate(start), end };
  }
  if (preset === "last12") {
    const start = new Date();
    start.setMonth(start.getMonth() - 12);
    return { start: isoDate(start), end };
  }
  return { start: "0001-01-01", end };
}

/**
 * Aggregate paid invoices in the period into certificate rows.
 * Gross = sum of `total_original_currency` per currency; PHP totals use the
 * BIR-tracked `total_in_php`.
 */
export function computeProofOfIncome(
  invoices: Invoice[],
  clients: Client[],
  period: { start: string; end: string }
): ProofOfIncomeSummary {
  const paid = invoices
    .filter(
      (inv) =>
        inv.status === "paid" &&
        inv.issue_date >= period.start &&
        inv.issue_date <= period.end
    )
    .sort((a, b) => (b.issue_date > a.issue_date ? 1 : b.issue_date < a.issue_date ? -1 : 0));

  const rows: EarningRow[] = paid.map((inv) => {
    const client = clients.find((c) => c.id === inv.client_id) ?? null;
    return {
      invoiceNumber: inv.invoice_number,
      issueDate: inv.issue_date,
      clientName: client?.name || "—",
      clientCountry: client?.country || "—",
      currency: inv.currency,
      amount: Number(inv.total_original_currency) || 0,
      amountPhp: Number(inv.total_in_php) || 0,
      paymentMethod: inv.payment_method,
    };
  });

  const totalPhp = rows.reduce((sum, row) => sum + row.amountPhp, 0);

  const byCurrency: { currency: string; total: number; totalPhp: number }[] = [];
  for (const row of rows) {
    const entry = byCurrency.find((e) => e.currency === row.currency);
    if (entry) {
      entry.total += row.amount;
      entry.totalPhp += row.amountPhp;
    } else {
      byCurrency.push({ currency: row.currency, total: row.amount, totalPhp: row.amountPhp });
    }
  }
  byCurrency.sort((a, b) => b.totalPhp - a.totalPhp || b.total - a.total);

  return { period, invoiceCount: rows.length, totalPhp, byCurrency, rows };
}

export async function downloadProofOfIncomePdf(data: {
  profile: Profile | null;
  summary: ProofOfIncomeSummary;
}): Promise<void> {
  const [{ pdf }, { ProofOfIncomePdf }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/reports/proof-of-income-pdf"),
  ]);

  const blob = await pdf(
    createElement(ProofOfIncomePdf, {
      profile: data.profile,
      summary: data.summary,
    })
  ).toBlob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `InvoisPH-Proof-of-Income-${data.summary.period.start}-${data.summary.period.end}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
