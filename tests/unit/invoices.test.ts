import { describe, expect, it } from "vitest";
import {
  computeTotals,
  formatInvoiceNumber,
  isOverdue,
  lineItemTotal,
  round2,
} from "@/lib/services/invoices";

describe("computeTotals", () => {
  it("computes subtotal, discount and PHP equivalents", () => {
    const totals = computeTotals({
      items: [
        { key: "1", description: "SaaS license", quantity: "2", rate: "100" },
        { key: "2", description: "Logo design", quantity: "1", rate: "40.5" },
      ],
      discount: "10.25",
      currency: "USD",
      fxRate: 58.5,
      whtRate: 0,
    });
    expect(totals.subtotal).toBe(240.5);
    expect(totals.discount).toBe(10.25);
    expect(totals.totalOriginal).toBe(230.25);
    expect(totals.totalPhp).toBe(round2(230.25 * 58.5)); // ≈ 13,481.14
  });

  it("converts PHP invoices at 1:1", () => {
    const totals = computeTotals({
      items: [{ key: "1", description: "Dinner", quantity: "2", rate: "350" }],
      discount: "0",
      currency: "PHP",
      fxRate: 1,
      whtRate: 0,
    });
    expect(totals.totalPhp).toBe(700);
  });

  it("computes creditable withholding tax on PHP equivalents", () => {
    const totals = computeTotals({
      items: [{ key: "1", description: "SaaS", quantity: "1", rate: "200" }],
      discount: "0",
      currency: "USD",
      fxRate: 58.5,
      whtRate: 10,
    });
    expect(totals.totalPhp).toBe(11700); // 200 × 58.5
    expect(totals.whtAmountPhp).toBe(1170); // 10% of PHP equivalent
    expect(totals.netPayablePhp).toBe(10530);
  });
});

describe("lineItemTotal", () => {
  it("multiplies quantity × rate with centavo rounding", () => {
    expect(lineItemTotal({ key: "k", description: "x", quantity: "2", rate: "10.5" })).toBe(21);
  });
});

describe("formatInvoiceNumber", () => {
  it("produces INV-0001 style numbers", () => {
    expect(formatInvoiceNumber("INV", 1)).toBe("INV-0001");
    expect(formatInvoiceNumber("si", 25)).toBe("SI-0025");
  });
  it("falls back to INV-0001 for missing prefix or invalid numbers", () => {
    expect(formatInvoiceNumber(null, 1)).toBe("INV-0001");
    expect(formatInvoiceNumber("INV", 0)).toBe("INV-0001");
  });
});

describe("isOverdue", () => {
  it("flags sent invoices past their due date", () => {
    expect(isOverdue({ status: "sent", due_date: "2020-01-01" } as never)).toBe(true);
    expect(isOverdue({ status: "sent", due_date: "2099-01-01" } as never)).toBe(false);
    expect(isOverdue({ status: "draft", due_date: "2020-01-01" } as never)).toBe(false);
  });
});

describe("round2", () => {
  it("rounds half-up without float drift", () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(1.005)).toBe(1.01);
  });
});
