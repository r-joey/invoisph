"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/layout/app-header";
import { InvoiceForm, type InvoiceFormSubmit } from "@/components/invoices/invoice-form";
import type { Client, Profile, Subscription } from "@/types/database.types";
import type { FXRatesResponse } from "@/lib/services/fx";
import { DEFAULT_INVOICE_DISCLAIMER, formatInvoiceNumber } from "@/lib/services/invoices";
import { freeTierInvoiceLimitExceeded } from "@/lib/services/billing";
import { getDemoClients } from "@/lib/demo/clients";
import {
  getDemoInvoices,
  nextDemoInvoiceNumber,
  saveDemoInvoices,
} from "@/lib/demo/invoices";
import { ArrowLeft, AlertCircle } from "lucide-react";
import type { Invoice } from "@/types/database.types";

function buildDemoProfile(nextNumber: number): Profile {
  const now = new Date().toISOString();
  return {
    id: "demo-user",
    email: "juan.delacruz@example.com",
    full_name: "Juan De La Cruz",
    registered_business_name: "Juan Creative & Tech Services",
    tin_number: "123-456-789-000",
    rdo_code: "044 - Taguig / Pateros",
    registered_address: "Unit 402, Sunshine Tower, Mandaluyong City, Metro Manila",
    is_vat_registered: false,
    tax_regime: "8_percent_gross",
    currency_default: "USD",
    next_invoice_number: nextNumber,
    invoice_prefix: "INV",
    logo_url: null,
    onboarding_completed: true,
    created_at: now,
    updated_at: now,
  };
}

export default function NewInvoicePage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [fx, setFx] = useState<FXRatesResponse | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [upgradeRequired, setUpgradeRequired] = useState(false);

  const [saving, setSaving] = useState<"draft" | "sent" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled) return;

        if (user) {
          setUserId(user.id);
          const [
            { data: profileRow },
            { data: clientRows },
            { data: invoiceRows },
            { data: subscriptionRow },
          ] = await Promise.all([
            supabase.from("profiles").select("*").eq("id", user.id).single(),
            supabase
              .from("clients")
              .select("*")
              .eq("user_id", user.id)
              .eq("archived", false)
              .order("name", { ascending: true }),
            supabase.from("invoices").select("*").eq("user_id", user.id),
            supabase
              .from("subscriptions")
              .select("*")
              .eq("user_id", user.id)
              .maybeSingle(),
          ]);
          if (cancelled) return;
          if (profileRow) setProfile(profileRow);
          setClients(clientRows ?? []);
          setInvoices(invoiceRows ?? []);
          setSubscription(subscriptionRow);
          setUpgradeRequired(freeTierInvoiceLimitExceeded(invoiceRows ?? [], subscriptionRow));
        } else {
          setIsDemoMode(true);
          setProfile(buildDemoProfile(getDemoInvoices().length + 1));
          setClients(getDemoClients());
          setInvoices(getDemoInvoices());
        }
      } catch (err) {
        console.error("Failed to prepare the invoice builder:", err);
        if (!cancelled) {
          setError(
            "Could not load your profile. Check your connection and reload this page."
          );
        }
      } finally {
        if (!cancelled) setChecking(false);
      }

      try {
        const res = await fetch("/api/fx-rates");
        if (res.ok && !cancelled) setFx((await res.json()) as FXRatesResponse);
      } catch (err) {
        console.error("Failed to load reference FX rates:", err);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (payload: InvoiceFormSubmit) => {
    if (upgradeRequired) {
      setError(
        "Free Starter tier — 3 invoices/month reached. Upgrade to Pro for unlimited invoices."
      );
      return;
    }
    setError(null);
    setSaving(payload.status);

    try {
      // ---- Demo mode: local only -----------------------------------------
      if (isDemoMode) {
        const existing = getDemoInvoices();
        const created: Invoice = {
          id: `demo-invoice-${Date.now()}`,
          user_id: "demo-user",
          client_id: payload.clientId,
          invoice_number: nextDemoInvoiceNumber(existing),
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
          payment_date: null,
          payment_method: null,
          notes_disclaimer: DEFAULT_INVOICE_DISCLAIMER,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        saveDemoInvoices([created, ...existing]);
        router.push(`/invoices?created=${encodeURIComponent(created.invoice_number)}`);
        return;
      }

      if (!userId) {
        throw new Error(
          "You are not signed in to a workspace. Reload this page and try again."
        );
      }

      const supabase = createClient();
      const { data: created, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          user_id: userId,
          client_id: payload.clientId,
          // Allocated atomically by the set_invoice_number trigger.
          invoice_number: "",
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
          notes_disclaimer: DEFAULT_INVOICE_DISCLAIMER,
        })
        .select("id, invoice_number")
        .single();

      if (invoiceError) throw invoiceError;
      if (!created) throw new Error("The invoice could not be created.");

      if (!created.invoice_number) {
        await supabase
          .from("invoices")
          .delete()
          .eq("id", created.id)
          .eq("user_id", userId);
        throw new Error(
          "Your database is missing the Phase 3 invoice-numbering trigger. Re-run supabase/schema.sql in the Supabase SQL editor, then save this invoice again."
        );
      }

      const { error: itemsError } = await supabase.from("invoice_items").insert(
        payload.items.map((item) => ({
          invoice_id: created.id,
          description: item.description,
          rate_or_unit_price: item.rate,
          quantity: item.quantity,
          total_amount: item.total,
        }))
      );

      if (itemsError) {
        // Never leave a numbered invoice with no line items behind.
        await supabase
          .from("invoices")
          .delete()
          .eq("id", created.id)
          .eq("user_id", userId);
        throw itemsError;
      }

      router.push(`/invoices?created=${encodeURIComponent(created.invoice_number)}`);
    } catch (err: unknown) {
      const failure = err as Error;
      setError(failure.message || "Failed to save this invoice. Please try again.");
    } finally {
      setSaving(null);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <div className="p-16 flex flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy-900 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600">
            Preparing your Service Invoice builder...
          </p>
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
            href="/invoices"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy-900"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to invoices
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            New Service Invoice
          </h1>
          <p className="text-sm text-slate-600">
            Issued under RA 11976 (Ease of Paying Taxes Act) — not an Official
            Receipt.
          </p>
        </div>

        {isDemoMode && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Demo mode.</strong> This invoice is saved to this browser only
              and is not filed with BIR. Connect Supabase to issue real Service
              Invoices.
            </span>
          </div>
        )}

        <InvoiceForm
          mode="create"
          profile={profile}
          clients={clients}
          fx={fx}
          numberLabel={formatInvoiceNumber(
            profile?.invoice_prefix ?? null,
            profile?.next_invoice_number ?? 1
          )}
          numberHint="Assigned automatically, in sequence, when you save."
          submitting={saving}
          error={error}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/invoices")}
          upgradeRequired={upgradeRequired}
        />
      </main>
    </div>
  );
}
