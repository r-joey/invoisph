"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, ArrowLeft, FileCheck } from "lucide-react";
import {
  computeProofOfIncome,
  downloadProofOfIncomePdf,
  periodFor,
  RANGE_PRESETS,
  todayIso,
  type RangePreset,
} from "@/lib/services/proof-of-income";
import { formatCurrency } from "@/lib/utils";
import { formatInvoiceDate } from "@/lib/services/invoices";
import { getDemoInvoices } from "@/lib/demo/invoices";
import { getDemoClients } from "@/lib/demo/clients";
import type { Client, Invoice, Profile } from "@/types/database.types";

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

export default function ProofOfIncomePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [preset, setPreset] = useState<RangePreset>("last12");
  const [customStart, setCustomStart] = useState(() => todayIso());
  const [customEnd, setCustomEnd] = useState(() => todayIso());

  const period = useMemo(() => {
    if (preset === "custom") return { start: customStart, end: customEnd };
    return periodFor(preset);
  }, [preset, customStart, customEnd]);


  const summary = useMemo(
    () => computeProofOfIncome(invoices, clients, period),
    [invoices, clients, period]
  );

  const customComplete = Boolean(customStart && customEnd);

  const load = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const [{ data: invRows }, { data: cliRows }, { data: prof }] = await Promise.all([
          supabase.from("invoices").select("*").eq("user_id", user.id),
          supabase.from("clients").select("*").eq("user_id", user.id),
          supabase.from("profiles").select("*").eq("id", user.id).single(),
        ]);
        setIsDemoMode(false);
        setInvoices(invRows ?? []);
        setClients(cliRows ?? []);
        setProfile(prof);
      } else {
        // Demo mode: preview data from browser storage.
        setIsDemoMode(true);
        setInvoices(getDemoInvoices());
        setClients(getDemoClients());
        setProfile(buildDemoProfile());
      }
    } catch (err) {
      console.error("Failed to load proof-of-income data:", err);
      setError("Could not load your invoices. Check your connection and reload this page.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      await downloadProofOfIncomePdf({ profile, summary });
    } catch (err) {
      console.error("Failed to generate proof-of-income PDF:", err);
      setError("Could not generate the PDF. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <div className="p-16 flex flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy-900 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600">
            Preparing your earnings summary...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy-900"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Proof of Income — Visa &amp; Bank Certificate
          </h1>
          <p className="text-sm text-slate-600 max-w-xl">
            Generate a stamped, sequential earnings report designed to pass
            embassy (Japan/Schengen) and bank credit scrutiny.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {isDemoMode && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Demo mode.</strong> This certificate is seeded from your
              browser preview and is not a real BIR record. Connect Supabase to
              generate an official earnings report.
            </span>
          </div>
        )}

        {/* Period selection */}
        <section className="p-4 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-navy-900">Period</h2>
          <div className="flex flex-wrap gap-2">
            {RANGE_PRESETS.map((p) => (
              <Button
                key={p.id}
                size="sm"
                variant={preset === p.id ? "default" : "outline"}
                onClick={() => setPreset(p.id)}
              >
                {p.label}
              </Button>
            ))}
          </div>
          {preset === "custom" && (
            <div className="flex flex-wrap items-center gap-3">
              <Input
                type="date"
                aria-label="From date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="max-w-[190px]"
              />
              <span className="text-xs text-slate-500">to</span>
              <Input
                type="date"
                aria-label="To date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="max-w-[190px]"
              />
              {!customComplete && (
                <span className="text-xs text-amber-700">Pick both dates to generate.</span>
              )}
            </div>
          )}
          <div className="text-xs text-slate-500">
            Period: {formatInvoiceDate(period.start)} – {formatInvoiceDate(period.end)}
          </div>
        </section>

        {/* Totals summary */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200">
            <div className="text-xs font-bold text-slate-500">TOTAL EARNINGS (PHP)</div>
            <div className="text-2xl font-extrabold text-navy-900 font-mono">
              {formatCurrency(summary.totalPhp, "PHP")}
            </div>
            {summary.byCurrency.length > 0 && (
              <div className="text-xs text-slate-500 mt-1">
                {summary.byCurrency
                  .map((c) => `${c.currency} ${formatCurrency(c.total, c.currency)}`)
                  .join(" · ")}
              </div>
            )}
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200">
            <div className="text-xs font-bold text-slate-500">PAID INVOICES</div>
            <div className="text-2xl font-extrabold text-navy-900 font-mono">
              {summary.invoiceCount}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200">
            <div className="text-xs font-bold text-slate-500">ISSUER</div>
            <div className="text-sm font-bold text-navy-900">
              {profile?.registered_business_name || profile?.full_name || "Freelancer"}
            </div>
          </div>
        </section>

        {/* Preview of what the certificate will contain */}
        {summary.rows.length > 0 && (
          <section className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
            <h2 className="text-base font-bold text-navy-900">Certificate preview</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-100">
                    <th className="py-1.5 pr-4 font-semibold">Invoice</th>
                    <th className="py-1.5 pr-4 font-semibold">Date</th>
                    <th className="py-1.5 pr-4 font-semibold">Client</th>
                    <th className="py-1.5 pr-4 font-semibold">Country</th>
                    <th className="py-1.5 pr-4 font-semibold">Currency</th>
                    <th className="py-1.5 pr-4 font-semibold text-right">Amount</th>
                    <th className="py-1.5 font-semibold text-right">PHP equivalent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.rows.map((row) => (
                    <tr key={row.invoiceNumber}>
                      <td className="py-1.5 pr-4 font-mono text-navy-900">{row.invoiceNumber}</td>
                      <td className="py-1.5 pr-4 text-slate-600">{formatInvoiceDate(row.issueDate)}</td>
                      <td className="py-1.5 pr-4 text-slate-600">{row.clientName}</td>
                      <td className="py-1.5 pr-4 text-slate-600">{row.clientCountry}</td>
                      <td className="py-1.5 pr-4 font-mono text-slate-600">{row.currency}</td>
                      <td className="py-1.5 pr-4 text-right font-mono text-slate-900">
                        {formatCurrency(row.amount, row.currency)}
                      </td>
                      <td className="py-1.5 text-right font-mono text-navy-900">
                        {formatCurrency(row.amountPhp, "PHP")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* One-click generate */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={handleGenerate}
            disabled={generating || (preset === "custom" && !customComplete)}
            className="bg-navy-900 hover:bg-navy-800 text-white font-semibold"
          >
            <FileCheck className="w-4 h-4 mr-1.5" />
            {generating ? "Generating…" : "Generate & Download PDF"}
          </Button>
        </div>
      </main>
    </div>
  );
}
