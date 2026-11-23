"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { taxMoney, type TaxQuarter, type TaxSummary } from "@/lib/services/tax";

function QuarterCard({ quarter }: { quarter: TaxQuarter }) {
  return (
    <Card className="hover:shadow-md transition-all duration-200 border-slate-200 flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base font-extrabold text-navy-900 leading-tight">
            {quarter.title}
          </CardTitle>
          <FileText className="w-5 h-5 text-selyo-700 shrink-0" />
        </div>
        <CardDescription>{quarter.label}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <div className="flex justify-between">
          <span className="text-xs text-slate-500">Gross Receipts</span>
          <span className="text-sm font-bold font-mono text-navy-900">
            {taxMoney(quarter.gross)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-slate-500">Allowance Applied</span>
          <span className="text-sm font-mono text-slate-600">
            {taxMoney(quarter.allowanceApplied)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs font-semibold text-slate-500">Tax Due (8%)</span>
          <span className="text-sm font-bold font-mono text-emerald-600">
            {taxMoney(quarter.taxDue)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/** The quarterly breakdown cards: Q1, Q2, Q3 and Annual / Q4. */
export function QuarterlyBreakdownCards({ summary }: { summary: TaxSummary }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {summary.quarters.map((quarter) => (
        <QuarterCard key={quarter.id} quarter={quarter} />
      ))}
    </div>
  );
}
