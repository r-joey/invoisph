"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/layout/app-header";
import { MarkPaidModal } from "@/components/invoices/mark-paid-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Invoice } from "@/types/database.types";
import { formatCurrency } from "@/lib/utils";
import {
  INVOICE_STATUS_BADGE,
  INVOICE_STATUS_LABEL,
  formatInvoiceDate,
  isOverdue,
  type InvoiceStatus,
} from "@/lib/services/invoices";
import {
  getDemoInvoices,
  saveDemoInvoices,
} from "@/lib/demo/invoices";
import {
  getDemoClients,
  isDemoRecordId,
} from "@/lib/demo/clients";
import {
  Plus,
  FileText,
  AlertCircle,
  CheckCircle2,
  Send,
  Ban,
  Receipt,
  Wallet,
  TrendingUp,
} from "lucide-react";

const TABS = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "sent", label: "Unpaid" },
  { id: "paid", label: "Paid" },
  { id: "cancelled", label: "Cancelled" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function sumPhp(invoices: Invoice[], field: "total_in_php" | "net_amount_payable_php"): number {
  return invoices.reduce((total, invoice) => total + Number(invoice[field] || 0), 0);
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clientNames, setClientNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("all");
  const [paidTarget, setPaidTarget] = useState<Invoice | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [createdNumber, setCreatedNumber] = useState<string | null>(null);

  // Read the ?created=INV-0001 flag left by the builder after a successful save.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCreatedNumber(params.get("created"));
  }, []);

  const load = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        const [{ data: invoiceRows }, { data: clientRows }] = await Promise.all([
          supabase
            .from("invoices")
            .select("*")
            .eq("user_id", user.id)
            .order("issue_date", { ascending: false })
            .order("created_at", { ascending: false }),
          supabase.from("clients").select("id, name").eq("user_id", user.id),
        ]);

        setInvoices(invoiceRows ?? []);
        const names: Record<string, string> = {};
        for (const client of clientRows ?? []) {
          names[client.id] = client.name;
        }
        setClientNames(names);
      } else {
        // Demo mode: everything lives in localStorage.
        setIsDemoMode(true);
        setInvoices(getDemoInvoices());
        const names: Record<string, string> = {};
        for (const client of getDemoClients()) {
          names[client.id] = client.name;
        }
        setClientNames(names);
      }
    } catch (err) {
      console.error("Invoice list failed to load:", err);
      setActionError(
        "Could not load your invoices. Check your connection and reload this page."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const applyPatch = useCallback(
    async (invoice: Invoice, patch: Partial<Invoice>) => {
      setActionError(null);

      if (isDemoMode || isDemoRecordId(invoice.id)) {
        const next = invoices.map((row) =>
          row.id === invoice.id
            ? { ...row, ...patch, updated_at: new Date().toISOString() }
            : row
        );
        setInvoices(next);
        saveDemoInvoices(next);
        return;
      }

      const supabase = createClient();
      const { error } = await supabase
        .from("invoices")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", invoice.id)
        .eq("user_id", userId ?? "");

      if (error) throw error;

      setInvoices((prev) =>
        prev.map((row) => (row.id === invoice.id ? { ...row, ...patch } : row))
      );
    },
    [invoices, isDemoMode, userId]
  );

  const handleStatusChange = async (invoice: Invoice, status: InvoiceStatus) => {
    if (
      status === "cancelled" &&
      !window.confirm(
        `Cancel ${invoice.invoice_number}? BIR keeps the number in your sequence, but the invoice can no longer be collected.`
      )
    ) {
      return;
    }

    try {
      await applyPatch(invoice, { status });
    } catch (err) {
      const failure = err as Error;
      setActionError(failure.message || "Failed to update this invoice.");
    }
  };

  const handleMarkPaid = async (
    invoice: Invoice,
    paymentMethod: string,
    paymentDate: string
  ) => {
    await applyPatch(invoice, {
      status: "paid",
      payment_method: paymentMethod,
      payment_date: paymentDate,
    });
  };

  const stats = useMemo(() => {
    const billable = invoices.filter((invoice) => invoice.status !== "cancelled");
    const paid = invoices.filter((invoice) => invoice.status === "paid");
    const unpaid = invoices.filter((invoice) => invoice.status === "sent");
    return {
      invoicedPhp: sumPhp(billable, "total_in_php"),
      paidPhp: sumPhp(paid, "total_in_php"),
      outstandingPhp: sumPhp(unpaid, "net_amount_payable_php"),
      draftCount: invoices.filter((invoice) => invoice.status === "draft").length,
    };
  }, [invoices]);

  const visibleInvoices = useMemo(
    () =>
      tab === "all"
        ? invoices
        : invoices.filter((invoice) => invoice.status === tab),
    [invoices, tab]
  );

  const countFor = (id: TabId) =>
    id === "all"
      ? invoices.length
      : invoices.filter((invoice) => invoice.status === id).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              Service Invoices
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Sequentially numbered EoPT invoices with the official PHP equivalent
              logged for your BIR records.
            </p>
          </div>
          <Link href="/invoices/new">
            <Button className="bg-navy-900 hover:bg-navy-800 text-white font-bold shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              New Service Invoice
            </Button>
          </Link>
        </div>

        {createdNumber && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">
                Invoice {createdNumber} saved.
              </span>{" "}
              Its number was allocated automatically from your sequence.
            </div>
            <button
              type="button"
              onClick={() => setCreatedNumber(null)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {actionError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="flex-1">{actionError}</span>
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="text-xs font-semibold text-red-700 hover:text-red-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {isDemoMode && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Demo mode.</strong> Invoices are stored only in this browser
              and are not filed with BIR. Connect Supabase to issue real Service
              Invoices.
            </span>
          </div>
        )}

        {/* Summary tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Receipt className="w-3.5 h-3.5" />
                Invoiced
              </div>
              <div className="text-lg font-extrabold font-mono text-navy-900">
                {formatCurrency(stats.invoicedPhp)}
              </div>
              <p className="text-[11px] text-slate-500">PHP equivalent, ex-cancelled</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Wallet className="w-3.5 h-3.5" />
                Collected
              </div>
              <div className="text-lg font-extrabold font-mono text-emerald-700">
                {formatCurrency(stats.paidPhp)}
              </div>
              <p className="text-[11px] text-slate-500">Counts toward your 8% gross</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <TrendingUp className="w-3.5 h-3.5" />
                Outstanding
              </div>
              <div className="text-lg font-extrabold font-mono text-amber-700">
                {formatCurrency(stats.outstandingPhp)}
              </div>
              <p className="text-[11px] text-slate-500">Awaiting client payment</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <FileText className="w-3.5 h-3.5" />
                Drafts
              </div>
              <div className="text-lg font-extrabold font-mono text-slate-700">
                {stats.draftCount}
              </div>
              <p className="text-[11px] text-slate-500">Not yet issued to a client</p>
            </CardContent>
          </Card>
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                tab === item.id
                  ? "bg-navy-900 text-white shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {item.label} ({countFor(item.id)})
            </button>
          ))}
        </div>

        {/* Invoice table */}
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy-900 border-t-transparent" />
            <p className="text-xs font-semibold text-slate-500">
              Loading your invoices...
            </p>
          </div>
        ) : visibleInvoices.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200 bg-white">
            <CardContent className="p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-navy-900 text-base">
                  {invoices.length === 0
                    ? "No Service Invoices yet"
                    : `No ${tab === "all" ? "" : TABS.find((t) => t.id === tab)?.label.toLowerCase()} invoices`}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {invoices.length === 0
                    ? "Create your first BIR-compliant Service Invoice with automatic BSP reference conversion and sequential numbering."
                    : "Switch tabs or create a new invoice to see it here."}
                </p>
              </div>
              <Link href="/invoices/new">
                <Button
                  size="sm"
                  className="bg-navy-900 hover:bg-navy-800 text-white font-semibold"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Service Invoice
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                    <th className="px-4 py-3">Invoice</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Issued</th>
                    <th className="px-4 py-3 hidden md:table-cell">Due</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right hidden sm:table-cell">
                      ₱ Equivalent
                    </th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleInvoices.map((invoice) => {
                    const overdue = isOverdue(invoice);
                    return (
                      <tr
                        key={invoice.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/invoices/${invoice.id}`}
                            className="font-mono font-bold text-navy-900 hover:text-selyo-800 hover:underline"
                          >
                            {invoice.invoice_number}
                          </Link>
                          {invoice.payment_method && (
                            <span className="block text-[11px] text-slate-500">
                              via {invoice.payment_method}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-800">
                            {invoice.client_id
                              ? clientNames[invoice.client_id] || "Unassigned client"
                              : "No client"}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-slate-600 whitespace-nowrap">
                          {formatInvoiceDate(invoice.issue_date)}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell whitespace-nowrap">
                          <span className={overdue ? "text-red-600 font-semibold" : "text-slate-600"}>
                            {formatInvoiceDate(invoice.due_date)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-800 whitespace-nowrap">
                          {formatCurrency(
                            invoice.total_original_currency,
                            invoice.currency
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-navy-900 whitespace-nowrap hidden sm:table-cell">
                          {formatCurrency(invoice.total_in_php)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold ${INVOICE_STATUS_BADGE[invoice.status]}`}
                          >
                            {INVOICE_STATUS_LABEL[invoice.status]}
                          </span>
                          {overdue && (
                            <span className="block text-[11px] font-semibold text-red-600 mt-0.5">
                              Overdue
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {invoice.status === "draft" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(invoice, "sent")}
                                className="h-8 text-xs font-semibold"
                              >
                                <Send className="w-3.5 h-3.5 mr-1" />
                                Mark sent
                              </Button>
                            )}
                            {invoice.status === "sent" && (
                              <Button
                                size="sm"
                                onClick={() => setPaidTarget(invoice)}
                                className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                Mark paid
                              </Button>
                            )}
                            {(invoice.status === "draft" ||
                              invoice.status === "sent") && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStatusChange(invoice, "cancelled")}
                                className="h-8 text-xs font-semibold text-slate-500 hover:text-red-600"
                                title="Cancel this invoice"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {invoice.status === "paid" && (
                              <span className="text-[11px] text-slate-500 whitespace-nowrap">
                                {invoice.payment_date
                                  ? formatInvoiceDate(invoice.payment_date)
                                  : "Settled"}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <MarkPaidModal
        invoice={paidTarget}
        onClose={() => setPaidTarget(null)}
        onConfirm={handleMarkPaid}
      />
    </div>
  );
}
