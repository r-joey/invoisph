"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { buildTaxSummaryCsv, type TaxSummary } from "@/lib/services/tax";

/** One-click CSV download of the tax summary for accountants. */
export function TaxExportButton({ summary }: { summary: TaxSummary }) {
  const handleDownload = useCallback(() => {
    const csv = buildTaxSummaryCsv(summary);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `InvoisPH-Tax-Summary-${summary.year}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, [summary]);

  return (
    <Button size="sm" variant="outline" onClick={handleDownload} className="font-semibold">
      <Download className="w-4 h-4 mr-1.5" />
      Export Tax Summary CSV
    </Button>
  );
}
