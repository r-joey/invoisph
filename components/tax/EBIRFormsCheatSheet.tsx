"use client";

import { Modal } from "@/components/ui/modal";
import { TaxExportButton } from "@/components/tax/TaxExport";
import { taxMoney, type TaxSummary } from "@/lib/services/tax";

export function EBIRFormsCheatSheet({
  issuerName,
  summary,
  open,
  onClose,
}: {
  issuerName: string;
  summary: TaxSummary;
  open: boolean;
  onClose: () => void;
}) {
  // Side-by-side replica of BIR Form 1701Q Part II — box → the exact amount.
  const rows = [
    {
      box: "Part II, Item 32 — Gross Sales/Receipts",
      value: taxMoney(summary.annualGross),
    },
    {
      box: "Part II, Item 36 — Allowable Deduction ₱250k",
      value: taxMoney(summary.annualAllowance),
    },
    {
      box: "Part II, Item 38 — Tax Due at 8%",
      value: taxMoney(summary.annualTaxDue),
    },
    {
      box: "Creditable Withholding Taxes (Form 2307, if any)",
      value: taxMoney(summary.withholding),
    },
    {
      box: "Net Tax Payable",
      value: taxMoney(summary.netTaxPayable),
    },
  ];

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="eBIRForms Cheat Sheet — BIR Form 1701Q"
      description={`Which box to fill for ${issuerName}. The ₱250k allowance is per calendar year.`}
    >
      <div className="space-y-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <th className="pb-2">BIR Form Box</th>
              <th className="pb-2 text-right">Your Value (₱)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.box} className="border-t border-slate-100">
                <td className="py-2 pr-3 text-slate-700">{row.box}</td>
                <td className="py-2 text-right font-mono font-bold text-navy-900">
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
          <p>
            <strong>Part II, Item 38 formula:</strong> (Item 32 − Item 36) × 8% —
            the 8% flat income tax on net taxable receipts.
          </p>
          <p>
            <strong>Part II, Item 36:</strong> ₱250,000 of tax-free gross
            receipts each calendar year — less if your annual gross is below it.
          </p>
          <p>
            <strong>Net Tax Payable:</strong> Tax Due − withheld amounts — the
            amount to pay via GCash/Maya/AUB.
          </p>
        </div>

        <div className="flex justify-end">
          <TaxExportButton summary={summary} />
        </div>
      </div>
    </Modal>
  );
}
