"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Invoice } from "@/types/database.types";
import { PAYMENT_METHODS, todayInputValue } from "@/lib/services/invoices";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface MarkPaidModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  onConfirm: (
    invoice: Invoice,
    paymentMethod: string,
    paymentDate: string
  ) => Promise<void>;
}

/**
 * Status updater for the "mark as paid" step: records the channel the client
 * actually paid through plus the settlement date, matching the payment_method /
 * payment_date columns on public.invoices.
 */
export function MarkPaidModal({ invoice, onClose, onConfirm }: MarkPaidModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [paymentDate, setPaymentDate] = useState<string>(todayInputValue());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!invoice) return;
    setPaymentMethod(invoice.payment_method || PAYMENT_METHODS[0]);
    setPaymentDate(invoice.payment_date || todayInputValue());
    setError(null);
  }, [invoice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    try {
      setLoading(true);
      setError(null);
      await onConfirm(invoice, paymentMethod, paymentDate);
      onClose();
    } catch (err: unknown) {
      const failure = err as Error;
      setError(failure.message || "Failed to update this invoice.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={Boolean(invoice)}
      onClose={onClose}
      title="Mark invoice as paid"
      description="Records the payment channel and date for your BIR earnings trail."
    >
      {invoice && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Invoice</span>
              <span className="font-mono font-bold text-navy-900">
                {invoice.invoice_number}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Client pays</span>
              <span className="font-mono font-semibold text-slate-700">
                {formatCurrency(invoice.total_original_currency, invoice.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Net payable</span>
              <span className="font-mono font-bold text-emerald-700">
                {formatCurrency(invoice.net_amount_payable_php, "PHP")}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Payment Channel
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 px-1 rounded-lg border text-xs font-bold transition-all ${
                    paymentMethod === method
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600/30"
                      : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="payment-date"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Date Received
            </label>
            <Input
              id="payment-date"
              type="date"
              value={paymentDate}
              max={todayInputValue()}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              {loading ? "Saving..." : "Confirm Payment"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
