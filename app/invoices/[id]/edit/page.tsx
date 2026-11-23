"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/layout/app-header";
import {
  InvoiceForm,
  type InvoiceFormInitial,
  type InvoiceFormSubmit,
} from "@/components/invoices/invoice-form";
import type {
  Client,
  Invoice,
  InvoiceItem,
  Profile,
} from "@/types/database.types";
import type { FXRatesResponse } from "@/lib/services/fx";
import { getDemoClients, isDemoRecordId } from "@/lib/demo/clients";
import { getDemoInvoices, saveDemoInvoices } from "@/lib/demo/invoices";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function EditInvoicePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const invoiceId = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [initial, setInitial] = useState<InvoiceFormInitial | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [fx, setFx] = useState<FXRatesResponse | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState<"draft" | "sent" | null>(null);

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
          supabase
            .from("clients")
            .select("*")
            .eq("user_id", user.id)
            .eq("archived", false)
            .order("name", { ascending: true }),
          supabase.from("profiles").select("*").eq("id", user.id).single(),
        ]);

        const itemRows = itemResult.data ?? [];
        setInvoice(row);
        setItems(itemRows);
        setClients(clientResult.data ?? []);
        setProfile(profileResult.data ?? null);
        setInitial({
          clientId: row.client_id ?? "",
          issueDate: row.issue_date,
          dueDate: row.due_date,
          currency: row.currency,
          fxRate: Number(row.bsp_fx_rate),
          discount: Number(row.discount),
          whtRate: Number(row.withholding_tax_rate),
          items: itemRows.map((item) => ({
            key: `item-${item.id}`,
            description: item.description,
            quantity: String(Number(item.quantity)),
            rate: String(Number(item.rate_or_unit_price)),
          })),
        });
      } else {
        // Demo mode
        setIsDemoMode(true);
        const found = getDemoInvoices().find((row) => row.id === invoiceId);
        if (!found) {
          setError("That invoice could not be found.");
          return;
        }
        setInvoice(found);
        setClients(getDemoClients());
        setInitial({
          clientId: found.client_id ?? "",
          issueDate: found.issue_date,
          dueDate: found.due_date,
          currency: found.currency,
          fxRate: Number(found.bsp_fx_rate),
          discount: Number(found.discount),
          whtRate: Number(found.withholding_tax_rate),
          items: [
            {
              key: `item-${found.id}`,
              description: "Professional services rendered",
              quantity: "1",
              rate: String(Number(found.subtotal)),
            },
          ],
        });
      }
    } catch (err) {
      console.error("Invoice edit failed to load:", err);
      setError("Could not load this invoice. Check your connection and reload.");
    } finally {
      setLoading(false);
    }

    try {
      const res = await fetch("/api/fx-rates");
      if (res.ok) setFx((await res.json()) as FXRatesResponse);
    } catch (err) {
      console.error("Failed to load reference FX rates:", err);
    }
  }, [invoiceId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (payload: InvoiceFormSubmit) => {
    if (!invoice) return;
    setError(null);
    setSaving(payload.status);

    try {
      if (isDemoMode || isDemoRecordId(invoice.id)) {
        const next = getDemoInvoices().map((row) =>
          row.id === invoice.id
            ? {
                ...row,
                client_id: payload.clientId,
                issue_date: payload.issueDate,
                due_date: payload.dueDate,
                status: payload.status,
                currency: payload.currency,
                subtotal: payload.totals.subtotal,
                discount: payload.totals.discount,
                total_original_currency: payload.totals.totalOriginal,
                bsp_fx_rate: payload.totals.fxRate,
                total_in_php: payload.totals.totalPhp,
                withholding_tax_rate: payload.totals.whtRate,
                withholding_tax_amount_php: payload.totals.whtAmountPhp,
                net_amount_payable_php: payload.totals.netPayablePhp,
                updated_at: new Date().toISOString(),
              }
            : row
        );
        saveDemoInvoices(next);
        router.push(`/invoices/${invoice.id}`);
        return;
      }

      if (!userId) {
        throw new Error("You are not signed in to a workspace. Reload and try again.");
      }

      const supabase = createClient();

      // The invoice number is immutable once allocated — it is not in this patch.
      const { error: updateError } = await supabase
        .from("invoices")
        .update({
          client_id: payload.clientId,
          issue_date: payload.issueDate,
          due_date: payload.dueDate,
          status: payload.status,
          currency: payload.currency,
          subtotal: payload.totals.subtotal,
          discount: payload.totals.discount,
          total_original_currency: payload.totals.totalOriginal,
          bsp_fx_rate: payload.totals.fxRate,
          total_in_php: payload.totals.totalPhp,
          withholding_tax_rate: payload.totals.whtRate,
          withholding_tax_amount_php: payload.totals.whtAmountPhp,
          net_amount_payable_php: payload.totals.netPayablePhp,
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoice.id)
        .eq("user_id", userId);

      if (updateError) throw updateError;

      // Replace line items: insert the new rows first so a failure cannot leave
      // the invoice with no lines at all, then remove the superseded ones.
      const { data: inserted, error: insertError } = await supabase
        .from("invoice_items")
        .insert(
          payload.items.map((item) => ({
            invoice_id: invoice.id,
            description: item.description,
            rate_or_unit_price: item.rate,
            quantity: item.quantity,
            total_amount: item.total,
          }))
        )
        .select("id");

      if (insertError) throw insertError;

      const keepIds = new Set((inserted ?? []).map((row) => row.id));
      const staleIds = items
        .map((row) => row.id)
        .filter((id) => !keepIds.has(id));

      if (staleIds.length > 0) {
        const { error: deleteError } = await supabase
          .from("invoice_items")
          .delete()
          .in("id", staleIds);
        if (deleteError) {
          console.error("Could not remove superseded line items:", deleteError);
        }
      }

      router.push(`/invoices/${invoice.id}`);
    } catch (err: unknown) {
      const failure = err as Error;
      setError(failure.message || "Failed to save this invoice.");
    } finally {
      setSaving(null);
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

  if (!invoice || !initial) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <div className="max-w-2xl mx-auto p-8">
          <div className="p-6 rounded-xl bg-white border border-slate-200 text-center space-y-4">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-sm text-slate-700">
              {error || "That invoice could not be found."}
            </p>
            <Link href="/invoices" className="text-xs font-semibold underline">
              Back to invoices
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Settled documents are final; issue a new invoice instead of rewriting history.
  if (invoice.status === "paid" || invoice.status === "cancelled") {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <div className="max-w-2xl mx-auto p-8">
          <div className="p-6 rounded-xl bg-white border border-slate-200 text-center space-y-4">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <h1 className="text-base font-bold text-navy-900">
              {invoice.status === "paid"
                ? "This invoice has been paid"
                : "This invoice was cancelled"}
            </h1>
            <p className="text-xs text-slate-600">
              Settled documents are kept exactly as issued. Create a new Service
              Invoice if you need to bill again — BIR expects the original to
              remain unchanged.
            </p>
            <Link href={`/invoices/${invoice.id}`}>
              <span className="text-xs font-semibold underline">
                Back to invoice {invoice.invoice_number}
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="space-y-1">
          <Link
            href={`/invoices/${invoice.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy-900"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to invoice
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Edit {invoice.invoice_number}
          </h1>
          <p className="text-sm text-slate-600">
            The invoice number is fixed for the life of this document.
          </p>
        </div>

        {invoice.status === "sent" && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>This invoice has already been sent.</strong> Your client is
              holding a copy — consider issuing a new invoice instead of changing
              the figures they agreed to.
            </span>
          </div>
        )}

        <InvoiceForm
          mode="edit"
          profile={profile}
          clients={clients}
          fx={fx}
          numberLabel={invoice.invoice_number}
          numberHint="Fixed — assigned when this invoice was first saved."
          initial={initial}
          submitting={saving}
          error={error}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/invoices/${invoice.id}`)}
        />
      </main>
    </div>
  );
}
