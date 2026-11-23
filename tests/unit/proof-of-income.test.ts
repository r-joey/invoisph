import { describe, expect, it } from "vitest";
import { computeProofOfIncome } from "@/lib/services/proof-of-income";
import { client, invoice } from "./factories";

describe("computeProofOfIncome", () => {
  it("aggregates paid invoices with client origin, sorted newest first", () => {
    const clients = [
      client({
        id: "c1",
        name: "Apex Growth Marketing LLC",
        email: "billing@apexgrowth.io",
        country: "United States",
        currency: "USD",
      }),
      client({
        id: "c2",
        name: "Sydney Digital Media Pty Ltd",
        email: "accounts@sydneydigital.com.au",
        country: "Australia",
        currency: "AUD",
      }),
      client({
        id: "c3",
        name: "Manila Creative Labs Corp",
        email: "finance@manilacreative.ph",
        country: "Philippines",
        currency: "PHP",
      }),
    ];
    const invoices = [
      invoice({
        id: "i1",
        invoice_number: "INV-0001",
        issue_date: "2026-05-10",
        status: "paid",
        currency: "USD",
        total_original_currency: 90000,
        total_in_php: 52695,
        client_id: "c1",
        payment_method: "Wise",
        payment_date: "2026-05-11",
      }),
      invoice({
        id: "i2",
        invoice_number: "INV-0002",
        issue_date: "2026-04-05",
        status: "paid",
        currency: "PHP",
        total_original_currency: 42000,
        total_in_php: 42000,
        client_id: "c3",
      }),
      invoice({
        id: "i3",
        invoice_number: "INV-0003",
        issue_date: "2026-03-20",
        status: "draft", // excluded — not paid
        currency: "USD",
        total_original_currency: 10000,
        total_in_php: 5855,
        client_id: "c1",
      }),
    ];

    const summary = computeProofOfIncome(invoices, clients, {
      start: "2026-01-01",
      end: "2026-12-31",
    });

    expect(summary.period).toEqual({ start: "2026-01-01", end: "2026-12-31" });
    expect(summary.invoiceCount).toBe(2);
    expect(summary.totalPhp).toBe(94695); // 52695 + 42000
    expect(summary.rows.map((r) => r.invoiceNumber)).toEqual(["INV-0001", "INV-0002"]); // newest first
    expect(summary.rows[0].clientName).toBe("Apex Growth Marketing LLC");
    expect(summary.rows[0].clientCountry).toBe("United States");
    expect(summary.rows[0].amount).toBe(90000);
    expect(summary.rows[0].amountPhp).toBe(52695);
    expect(summary.rows[1].clientName).toBe("Manila Creative Labs Corp");
    expect(summary.byCurrency).toEqual([
      { currency: "USD", total: 90000, totalPhp: 52695 },
      { currency: "PHP", total: 42000, totalPhp: 42000 },
    ]);
  });
});
