import { describe, expect, it } from "vitest";
import {
  buildTaxSummaryCsv,
  computeTaxSummary,
  taxMoney,
} from "@/lib/services/tax";
import { invoice } from "./factories";

describe("computeTaxSummary", () => {
  it("counts sent+paid receipts and attributes the ₱250k allowance to quarters", () => {
    const invoices = [
      invoice({
        id: "a",
        invoice_number: "INV-0001",
        issue_date: "2026-01-10",
        status: "paid",
        currency: "USD",
        total_original_currency: 170000,
        total_in_php: 100000,
      }),
      invoice({
        id: "b",
        invoice_number: "INV-0002",
        issue_date: "2026-03-20",
        status: "paid",
        currency: "USD",
        total_original_currency: 100000,
        total_in_php: 100000,
      }),
      invoice({
        id: "c",
        invoice_number: "INV-0003",
        issue_date: "2026-08-15",
        status: "sent",
        currency: "PHP",
        total_original_currency: 90000,
        total_in_php: 90000,
      }),
      invoice({
        id: "d",
        invoice_number: "INV-0004",
        issue_date: "2026-12-01",
        status: "draft",
        currency: "USD",
        total_original_currency: 100000,
        total_in_php: 50000,
      }),
    ];

    const summary = computeTaxSummary(invoices, 2026);

    // Drafts are excluded from receipts and from annual gross.
    expect(summary.annualGross).toBe(290000);
    expect(summary.annualAllowance).toBe(250000);
    expect(summary.annualTaxDue).toBe(3200); // (290000 − 250000) × 8%

    expect(summary.quarters.map((q) => q.id)).toEqual(["q1", "q2", "q3", "q4"]);
    expect(summary.quarters[0]).toMatchObject({
      title: "Q1 (Jan–Mar)",
      label: "Q1 — Filed May 15",
      gross: 200000,
      allowanceApplied: 200000,
      taxDue: 0,
    });
    expect(summary.quarters[1]).toMatchObject({
      gross: 0,
      allowanceApplied: 0,
      taxDue: 0,
    });
    expect(summary.quarters[2]).toMatchObject({
      gross: 90000,
      allowanceApplied: 50000,
      taxDue: 3200,
    });
    expect(summary.quarters[3]).toMatchObject({
      gross: 290000,
      allowanceApplied: 250000,
      taxDue: 3200,
    });

    // Quarterly tax adds up to the annual figure.
    expect(
      summary.quarters[0].taxDue + summary.quarters[1].taxDue + summary.quarters[2].taxDue
    ).toBe(summary.annualTaxDue);

    expect(summary.byCurrency).toEqual([
      { currency: "USD", total: 270000, totalPhp: 200000 },
      { currency: "PHP", total: 90000, totalPhp: 90000 },
    ]);
    expect(summary.withholding).toBe(0);
    expect(summary.netTaxPayable).toBe(3200);
    expect(taxMoney(3200)).toBe("3200.00");
  });

  it("returns zero tax when annual gross stays within the ₱250k allowance", () => {
    const invoices = [
      invoice({ id: "a", issue_date: "2026-01-05", status: "paid", total_in_php: 120000 }),
      invoice({ id: "b", issue_date: "2026-02-05", status: "sent", total_in_php: 80000 }),
    ];
    const summary = computeTaxSummary(invoices, 2026);
    expect(summary.annualGross).toBe(200000);
    expect(summary.annualAllowance).toBe(200000);
    expect(summary.annualTaxDue).toBe(0);
    expect(summary.quarters[3]).toMatchObject({
      gross: 200000,
      allowanceApplied: 200000,
      taxDue: 0,
    });
  });

  it("subtracts withholding from the net payable", () => {
    const invoices = [
      invoice({
        id: "a",
        issue_date: "2026-01-10",
        status: "paid",
        total_in_php: 300000,
      }),
      invoice({
        id: "b",
        issue_date: "2026-02-10",
        status: "paid",
        total_in_php: 100000,
        withholding_tax_amount_php: 2400,
      }),
    ];
    const summary = computeTaxSummary(invoices, 2026);
    expect(summary.annualGross).toBe(400000);
    expect(summary.annualTaxDue).toBe(12000); // (400000 − 250000) × 8%
    expect(summary.withholding).toBe(2400);
    expect(summary.netTaxPayable).toBe(9600);
  });

  it("builds a downloadable CSV summary", () => {
    const invoices = [
      invoice({ id: "a", issue_date: "2026-01-10", status: "paid", total_in_php: 100000 }),
    ];
    const csv = buildTaxSummaryCsv(computeTaxSummary(invoices, 2026));
    expect(
      csv.startsWith("Quarter,Gross Receipts (PHP),Allowance Applied (PHP),Tax Due (PHP)")
    ).toBe(true);
    expect(csv.split("\n").length).toBe(5); // header + 4 quarters
  });
});
