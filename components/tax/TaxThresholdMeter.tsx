"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { TAX_FREE_THRESHOLD_PHP, taxMoney, type TaxSummary } from "@/lib/services/tax";

/**
 * The ₱250,000 Tax-Free Threshold Meter — visual progress bar showing how
 * much of the initial annual exemption has been consumed.
 */
export function TaxThresholdMeter({ summary }: { summary: TaxSummary }) {
  const consumed = summary.annualAllowance;
  const remaining = TAX_FREE_THRESHOLD_PHP - consumed;
  const percent = Math.min(100, Math.max(0, (summary.annualGross / TAX_FREE_THRESHOLD_PHP) * 100));

  return (
    <Card className="border-emerald-200/70 bg-gradient-to-br from-emerald-50/40 via-white to-white">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span>{summary.year} Annual ₱250,000 Tax-Free Threshold Meter</span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800">
            8% Flat Tax Regime
          </span>
        </div>
        <CardDescription>
          Under Philippine Tax Law, the first ₱250,000 of your gross freelance
          receipts each calendar year is 100% exempt from income tax.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-600">
            <span>
              Consumed: {taxMoney(consumed)} ({percent.toFixed(1)}%)
            </span>
            <span>Remaining Tax-Free: {taxMoney(remaining)}</span>
          </div>
          <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(3, percent)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-lg bg-white border border-slate-200">
            <span className="text-slate-500 block">Annual Gross Receipts</span>
            <span className="text-base font-bold font-mono text-navy-900">
              {taxMoney(summary.annualGross)}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-white border border-slate-200">
            <span className="text-slate-500 block">Tax Due (8%) So Far</span>
            <span className="text-base font-bold font-mono text-emerald-600">
              {taxMoney(summary.annualTaxDue)}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-white border border-slate-200">
            <span className="text-slate-500 block">Withheld (Form 2307)</span>
            <span className="text-base font-bold font-mono text-slate-900">
              {taxMoney(summary.withholding)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
