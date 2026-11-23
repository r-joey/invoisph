"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/layout/app-header";
import { MarkPaidModal } from "@/components/invoices/mark-paid-modal";
import { Button } from "@/components/ui/button";
import type { Client, Invoice, InvoiceItem, Profile } from "@/types/database.types";
import { formatCurrency } from "@/lib/utils";
import {
  INVOICE_STATUS_BADGE,
  INVOICE_STATUS_LABEL,
  formatInvoiceDate,
  isOverdue,
  type InvoiceStatus,
} from "@/lib/services/invoices";
import { downloadInvoicePdf } from "@/lib/services/invoice-pdf";
import {
  getDemoInvoices,
  saveDemoInvoices,
} from "@/lib/demo/invoices";
import { getDemoClients, isDemoRecordId } from "@/lib/demo/clients";
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  Download,
  Edit2,
  Printer,
  Send,
} from "lucide-react";

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const invoiceId = params.id;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [paidOpen, setPaidOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        const { data: row, error: invoiceError } = await supabase
          .from("invoices")
          .select("*")
          .eq("id", invoiceId)
          .eq("user_id", user.id)
          .single();

        if (invoiceError || !row) {
          setError("That invoice could not be found in your workspace.");
          return;
        }

        const [itemResult, clientResult, profileResult] = await Promise.all([
          supabase.from("invoice_items").select("*").eq("invoice_id", row.id),
          row.client_id
            ? supabase.from("clients").select("*").eq("id", row.client_id).single()
            : Promise.resolve({ data: null }),
          supabase.from("profiles").select("*").eq("id", user.id).single(),
        ]);

        setInvoice(row);
        setItems(itemResult.data ?? []);
        setClient((clientResult.data as Client | null) ?? null);
        setProfile(profileResult.data ?? null);
      } else {
        // Demo mode
        setIsDemoMode(true);
        const found = getDemoInvoices().find((row) => row.id === invoiceId);
        if (!found) {
          setError("That invoice could not be found.");
          return;
        }
        setInvoice(found);
        setItems(
          found.id
            ? [
                {
                  id: `demo-item-${found.id}`,
                  invoice_id: found.id,
                  description: "Professional services rendered",
                  rate_or_unit_price: Number(found.subtotal),
                  quantity: 1,
                  total_amount: Number(found.subtotal),
                  created_at: found.created_at,
                },
              ]
            : []
        );
        setClient(getDemoClients().find((row) => row.id === found.client_id) ?? null);
        setProfile(null);
      }
    } catch (err) {
      console.error("Invoice detail failed to load:", err);
      setError("Could not load this invoice. Check your connection and reload.");
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    load();
  }, [load]);

  const applyPatch = async (patch: Partial<Invoice>) => {
    if (!invoice) return;
    setError(null);

    if (isDemoMode || isDemoRecordId(invoice.id)) {
      const next = getDemoInvoices().map((row) =>
        row.id === invoice.id
          ? { ...row, ...patch, updated_at: new Date().toISOString() }
          : row
      );
      saveDemoInvoices(next);
      setInvoice((prev) => (prev ? { ...prev, ...patch } : prev));
      return;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("invoices")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", invoice.id)
      .eq("user_id", userId ?? "");

    if (updateError) throw updateError;
    setInvoice((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const handleStatus = async (status: InvoiceStatus) => {
    if (
      status === "cancelled" &&
      !window.confirm(
        "Cancel this invoice? BIR keeps the number in your sequence, but it can no longer be collected."
      )
    ) {
      return;
    }
    try {
      setBusy(status);
      await applyPatch({ status });
    } catch (err) {
      const failure = err as Error;
      setError(failure.message || "Failed to update this invoice.");
    } finally {
      setBusy(null);
    }
  };

  const handleMarkPaid = async (
    _target: Invoice,
    paymentMethod: string,
    paymentDate: string
  ) => {
    await applyPatch({
      status: "paid",
      payment_method: paymentMethod,
      payment_date: paymentDate,
    });
  };

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    setPdfBusy(true);
    try {
      await downloadInvoicePdf({ profile, client, invoice, items });
    } catch (err) {
      console.error("PDF generation failed:", err);
      setError("Could not generate the PDF. Try Print instead.");
    } finally {
      setPdfBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <div className="p-16 flex flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy-900 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <div className="max-w-2xl mx-auto p-8">
          <div className="p-6 rounded-xl bg-white border border-slate-200 text-center space-y-4">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-sm text-slate-700">
              {error || "That invoice could not be found."}
            </p>
            <Link href="/invoices">
              <Button variant="outline" size="sm" className="font-semibold">
                Back to invoices
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const businessName =
    profile?.registered_business_name || profile?.full_name || "Your Business";
  const canEdit = invoice.status === "draft" || invoice.status === "sent";
  const overdue = isOverdue(invoice);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="print:hidden">
        <AppHeader />
      </div>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-5">
        <div className="print:hidden flex flex-col gap-4">
          <Link
            href="/invoices"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy-900"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to invoices
          </Link>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="flex-1">{error}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleDownloadPdf}
              disabled={pdfBusy}
              className="bg-navy-900 hover:bg-navy-800 text-white font-semibold"
            >
              <Download className="w-4 h-4 mr-1.5" />
              {pdfBusy ? "Generating..." : "Download PDF"}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="font-semibold"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Print
            </Button>

            {canEdit && (
              <Link href={`/invoices/${invoice.id}/edit`}>
                <Button variant="outline" className="font-semibold">
                  <Edit2 className="w-4 h-4 mr-1.5" />
                  Edit
                </Button>
              </Link>
            )}

            {invoice.status === "draft" && (
              <Button
                variant="outline"
                onClick={() => handleStatus("sent")}
                disabled={busy !== null}
                className="font-semibold"
              >
                <Send className="w-4 h-4 mr-1.5" />
                Mark as Sent
              </Button>
            )}

            {invoice.status === "sent" && (
              <Button
                onClick={() => setPaidOpen(true)}
                disabled={busy !== null}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Mark as Paid
              </Button>
            )}

            {(invoice.status === "draft" || invoice.status === "sent") && (
              <Button
                variant="ghost"
                onClick={() => handleStatus("cancelled")}
                disabled={busy !== null}
                className="font-semibold text-slate-500 hover:text-red-600"
              >
                <Ban className="w-4 h-4 mr-1.5" />
                Cancel
              </Button>
            )}
          </div>
        </div>

        {isDemoMode && (
          <div className="print:hidden p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Demo mode.</strong> This document is sample data stored in your
              browser — not a filed BIR Service Invoice.
            </span>
          </div>
        )}

        {/* ---------------- The invoice document ---------------- */}
        <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-10 print:border-0 print:shadow-none print:rounded-none print:p-0">
          <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-navy-900">
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold text-navy-900 leading-tight">
                {businessName}
              </h1>
              {profile?.full_name && profile.full_name !== businessName && (
                <p className="text-xs text-slate-600">{profile.full_name}</p>
              )}
              {profile?.registered_address && (
                <p className="text-xs text-slate-600 mt-1">
                  {profile.registered_address}
                </p>
              )}
              <div className="text-xs text-slate-600 mt-2 font-mono space-y-0.5">
                <p>TIN: {profile?.tin_number || "—"}</p>
                <p>RDO: {profile?.rdo_code || "—"}</p>
                {profile?.is_vat_registered && <p>VAT Registered Taxpayer</p>}
              </div>
            </div>

            <div className="sm:text-right shrink-0">
              <p className="text-[10px] font-bold tracking-[0.25em] text-selyo-800">
                SERVICE INVOICE
              </p>
              <p className="font-mono text-2xl font-extrabold text-navy-900 mt-1">
                {invoice.invoice_number}
              </p>
              <span
                className={`inline-flex mt-1.5 items-center px-2 py-0.5 rounded-md border text-[10px] font-bold ${INVOICE_STATUS_BADGE[invoice.status]}`}
              >
                {INVOICE_STATUS_LABEL[invoice.status]}
              </span>
              {overdue && (
                <p className="text-[10px] font-bold text-red-600 mt-1">Overdue</p>
              )}
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6">
            <div>
              <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                Bill To
              </p>
              <p className="text-sm font-bold text-navy-900 mt-1">
                {client?.name || "—"}
              </p>
              {client?.billing_address && (
                <p className="text-xs text-slate-600 mt-0.5">
                  {client.billing_address}
                </p>
              )}
              {client?.country && (
                <p className="text-xs text-slate-600">{client.country}</p>
              )}
              {client?.email && (
                <p className="text-xs text-slate-600">{client.email}</p>
              )}
            </div>

            <div className="sm:text-right text-xs space-y-1">
              <div className="flex sm:justify-end gap-2">
                <span className="text-slate-500">Date of Issue</span>
                <span className="font-semibold text-slate-800">
                  {formatInvoiceDate(invoice.issue_date)}
                </span>
              </div>
              <div className="flex sm:justify-end gap-2">
                <span className="text-slate-500">Payment Due</span>
                <span className="font-semibold text-slate-800">
                  {formatInvoiceDate(invoice.due_date)}
                </span>
              </div>
              <div className="flex sm:justify-end gap-2">
                <span className="text-slate-500">Currency</span>
                <span className="font-semibold text-slate-800">
                  {invoice.currency}
                </span>
              </div>
              {invoice.status === "paid" && (
                <div className="flex sm:justify-end gap-2">
                  <span className="text-slate-500">Paid</span>
                  <span className="font-semibold text-emerald-700">
                    {formatInvoiceDate(invoice.payment_date)}
                    {invoice.payment_method ? ` · ${invoice.payment_method}` : ""}
                  </span>
                </div>
              )}
            </div>
          </div>

          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-navy-900 text-white text-left">
                <th className="px-3 py-2 font-bold rounded-tl-md">Description</th>
                <th className="px-3 py-2 font-bold text-right w-16">Qty</th>
                <th className="px-3 py-2 font-bold text-right w-28">Rate</th>
                <th className="px-3 py-2 font-bold text-right w-32 rounded-tr-md">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                    No line items recorded on this invoice.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="px-3 py-2.5 text-slate-800">
                      {item.description}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-600">
                      {Number(item.quantity)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-600">
                      {formatCurrency(
                        Number(item.rate_or_unit_price),
                        invoice.currency
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold text-slate-800">
                      {formatCurrency(Number(item.total_amount), invoice.currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="flex justify-end mt-4">
            <div className="w-full sm:w-80 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-mono text-slate-800">
                  {formatCurrency(Number(invoice.subtotal), invoice.currency)}
                </span>
              </div>
              {Number(invoice.discount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Discount</span>
                  <span className="font-mono text-slate-800">
                    − {formatCurrency(Number(invoice.discount), invoice.currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="font-bold text-navy-900">
                  Total ({invoice.currency})
                </span>
                <span className="font-mono font-extrabold text-navy-900">
                  {formatCurrency(
                    Number(invoice.total_original_currency),
                    invoice.currency
                  )}
                </span>
              </div>
              {invoice.currency !== "PHP" && (
                <div className="flex justify-between">
                  <span className="text-slate-500">PHP equivalent</span>
                  <span className="font-mono font-bold text-selyo-800">
                    {formatCurrency(Number(invoice.total_in_php), "PHP")}
                  </span>
                </div>
              )}
              {Number(invoice.withholding_tax_rate) > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      Less {Number(invoice.withholding_tax_rate)}% withheld (2307)
                    </span>
                    <span className="font-mono text-amber-700">
                      − {formatCurrency(Number(invoice.withholding_tax_amount_php), "PHP")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-navy-900">
                      Net collectible
                    </span>
                    <span className="font-mono font-bold text-emerald-700">
                      {formatCurrency(Number(invoice.net_amount_payable_php), "PHP")}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {invoice.currency !== "PHP" && (
            <div className="mt-6 p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
              Conversion rate applied on this invoice: 1 {invoice.currency} = ₱
              {Number(invoice.bsp_fx_rate).toFixed(4)} — recorded so the PHP
              equivalent above stays auditable for BIR.
            </div>
          )}

          <footer className="mt-8 pt-4 border-t border-slate-200 text-[10px] text-slate-500 leading-relaxed space-y-1">
            <p className="font-semibold text-slate-600">
              {invoice.notes_disclaimer ||
                "THIS SERVICE INVOICE COMPLIES WITH RA 11976 (EASE OF PAYING TAXES ACT)."}
            </p>
            <p>
              This document is a Service Invoice, not an Official Receipt. It is
              valid for claiming expenses and tax credits. Keep all sequentially
              numbered invoices — including cancelled ones — for your BIR records.
            </p>
          </footer>
        </article>
      </main>

      <MarkPaidModal
        invoice={paidOpen ? invoice : null}
        onClose={() => setPaidOpen(false)}
        onConfirm={handleMarkPaid}
      />
    </div>
  );
}
