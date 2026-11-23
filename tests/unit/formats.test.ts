import { describe, expect, it } from "vitest";
import { formatCurrency, formatTIN } from "@/lib/utils";

describe("formatTIN", () => {
  it("masks raw digits as the Philippine XXX-XXX-XXX-XXX mask", () => {
    expect(formatTIN("123456789000")).toBe("123-456-789-000");
    expect(formatTIN("123456789")).toBe("123-456-789");
    expect(formatTIN(" 123 456-789 012 ")).toBe("123-456-789-012");
  });
});

describe("formatCurrency", () => {
  it("formats in the en-PH locale", () => {
    expect(formatCurrency(1234.5, "PHP")).toContain("1,234.50");
  });
});
