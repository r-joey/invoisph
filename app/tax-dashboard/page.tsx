"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { TaxThresholdMeter } from "@/components/tax/TaxThresholdMeter";
import { QuarterlyBreakdownCards } from "@/components/tax/QuarterlyBreakdownCards";
import { EBIRFormsCheatSheet } from "@/components/tax/EBIRFormsCheatSheet";
import { computeTaxSummary } from "@/lib/services/tax";
import { getDemoInvoices } from "@/lib/demo/invoices";
import type { Invoice, Profile } from "@/types/database.types";
import { AlertCircle, ArrowLeft, ScrollText } from "lucide-react";

function buildDemoProfile(): Profile {
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
    next_invoice_number: 1,
    invoice_prefix: "INV",
    logo_url: null,
    onboarding_completed: true,
    created_at: now,
    updated_at: now,
  };
}

export default function TaxDashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [cheatOpen, setCheatOpen] = useState(false);

  const summary = useMemo(() => computeTaxSummary(invoices), [invoices]);

  const load = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const [{ data: invoiceRows }, { data: prof }] = await Promise.all([
          supabase
            .from("invoices")
            .select("*")
            .order("issue_date", { ascending: false }),
          supabase.from("profiles").select("*").eq("id", user.id).single(),
        ]);
        setInvoices(invoiceRows ?? []);
        setProfile(prof);
      } else {
        // Demo mode: preview invoices live in localStorage.
        setIsDemoMode(true);
        setInvoices(getDemoInvoices());
        setProfile(buildDemoProfile());
      }
    } catch (err) {
      console.error("Failed to load tax dashboard data:", err);
      setError("Could not load your invoices. Check your connection and reload this page.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const issuerName = profile?.registered_business_name || profile?.full_name || "Freelancer";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy-900"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Tax Tracker — 8% Flat Tax Filing
          </h1>
          <p className="text-sm text-slate-600 max-w-xl">
            Turn raw invoices into zero-effort quarterly filings: the ₱250,000
            tax-free threshold, the quarterly breakdown, and the eBIRForms
            cheat sheet.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy-900 border-t-transparent" />
            <p className="text-sm font-medium text-slate-600">
              Preparing your tax summary...
            </p>
          </div>
        ) : (
          <>
            <TaxThresholdMeter summary={summary} />

            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-navy-900">Quarterly Breakdown</h2>
                <Button
                  onClick={() => setCheatOpen(true)}
                  className="bg-navy-900 hover:bg-navy-800 text-white font-semibold"
                >
                  <ScrollText className="w-4 h-4 mr-1.5" />
                  eBIRForms Cheat Sheet
                </Button>
              </div>
              <QuarterlyBreakdownCards summary={summary} />
            </section>

            {isDemoMode && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Demo mode.</strong> This summary is seeded from your
                  browser preview and is not filed with BIR. Connect Supabase to
                  see your real numbers.
                </span>
              </div>
            )}
          </>
        )}

        <EBIRFormsCheatSheet
          issuerName={issuerName}
          summary={summary}
          open={cheatOpen}
          onClose={() => setCheatOpen(false)}
        />
      </main>
    </div>
  );
}
