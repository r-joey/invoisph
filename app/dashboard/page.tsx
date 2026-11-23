"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { InvoisPHLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  FileText,
  Plus,
  Users,
  TrendingUp,
  Receipt,
  FileCheck,
  Calendar,
  AlertCircle,
  ExternalLink,
  DollarSign,
  LogOut,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getDemoInvoices } from "@/lib/demo/invoices";
import { isProActive, type Subscription } from "@/lib/services/billing";

export default function DashboardPage() {
  const [profile, setProfile] = useState<{
    full_name: string;
    registered_business_name: string | null;
    tin_number: string | null;
    rdo_code: string | null;
    tax_regime: string;
    next_invoice_number: number;
    invoice_prefix: string;
  } | null>(null);

  const [clientCount, setClientCount] = useState<number>(0);
  const [invoiceCount, setInvoiceCount] = useState<number>(0);
  const [grossReceipts, setGrossReceipts] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  // Cumulative paid gross receipts for the current calendar year, in PHP.
  // Sourced from real invoices below — never a placeholder.
  const statutoryDeduction = 250000;
  const currentGrossPHP = grossReceipts;
  const taxableExcess = Math.max(0, currentGrossPHP - statutoryDeduction);
  const estimatedTaxDue = taxableExcess * 0.08;
  const deductionConsumed = Math.min(currentGrossPHP, statutoryDeduction);
  const deductionRemaining = Math.max(0, statutoryDeduction - currentGrossPHP);
  const thresholdPercentage = Math.min(100, (currentGrossPHP / statutoryDeduction) * 100);

  useEffect(() => {
    // Gross receipts count only invoices actually collected this calendar year,
    // which is the figure the 8% flat tax is assessed on.
    function applyInvoiceStats(
      rows: { status: string; total_in_php: number; issue_date: string }[]
    ) {
      const yearStart = `${new Date().getFullYear()}-01-01`;
      setInvoiceCount(rows.length);
      setGrossReceipts(
        rows
          .filter((row) => row.status === "paid" && row.issue_date >= yearStart)
          .reduce((total, row) => total + Number(row.total_in_php || 0), 0)
      );
    }

    async function loadDashboard() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("full_name, registered_business_name, tin_number, rdo_code, tax_regime, next_invoice_number, invoice_prefix")
            .eq("id", user.id)
            .single();

          if (data) {
            setProfile(data);
          } else {
            // Fallback demo freelancer profile
            setProfile({
              full_name: "Juan De La Cruz",
              registered_business_name: "Juan Creative & Tech Services",
              tin_number: "123-456-789-000",
              rdo_code: "044 - Taguig / Pateros",
              tax_regime: "8_percent_gross",
              next_invoice_number: 1,
              invoice_prefix: "INV",
            });
          }

          const { count } = await supabase
            .from("clients")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id);

          setClientCount(count || 0);

          const { data: invoiceRows } = await supabase
            .from("invoices")
            .select("status, total_in_php, issue_date")
            .eq("user_id", user.id);

          applyInvoiceStats(invoiceRows ?? []);

          const { data: subscriptionRow } = await supabase
            .from("subscriptions")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();
          setSubscription(subscriptionRow);
        } else {
          // Demo mode profile
          setClientCount(3);
          applyInvoiceStats(getDemoInvoices());
          setProfile({
            full_name: "Juan De La Cruz (Demo)",
            registered_business_name: "Juan Creative & Tech Services",
            tin_number: "123-456-789-000",
            rdo_code: "044 - Taguig / Pateros",
            tax_regime: "8_percent_gross",
            next_invoice_number: 1,
            invoice_prefix: "INV",
          });
        }
      } catch (err) {
        console.error("Dashboard load failed:", err);
        setClientCount(3);
        applyInvoiceStats(getDemoInvoices());
        setProfile({
          full_name: "Juan De La Cruz (Demo)",
          registered_business_name: "Juan Creative & Tech Services",
          tin_number: "123-456-789-000",
          rdo_code: "044 - Taguig / Pateros",
          tax_regime: "8_percent_gross",
          next_invoice_number: 1,
          invoice_prefix: "INV",
        });
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const handleSignOut = async () => {
    document.cookie = "invoisph_demo=; path=/; max-age=0";
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <InvoisPHLogo size="md" />
            </Link>
            <nav className="hidden md:flex items-center gap-1 text-sm font-semibold">
              <Link href="/dashboard" className="px-3 py-1.5 rounded-md bg-navy-50 text-navy-900">
                Dashboard
              </Link>
              <Link href="/invoices" className="px-3 py-1.5 rounded-md text-slate-600 hover:text-navy-900 hover:bg-slate-100 transition-colors">
                Invoices
              </Link>
              <Link href="/clients" className="px-3 py-1.5 rounded-md text-slate-600 hover:text-navy-900 hover:bg-slate-100 transition-colors">
                Clients
              </Link>
              <Link href="/tax-dashboard" className="px-3 py-1.5 rounded-md text-slate-600 hover:text-navy-900 hover:bg-slate-100 transition-colors">
                8% Tax Tracker
              </Link>
              <Link href="/reports" className="px-3 py-1.5 rounded-md text-slate-600 hover:text-navy-900 hover:bg-slate-100 transition-colors">
                Proof of Income
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/invoices/new">
              <Button size="sm" className="bg-navy-900 hover:bg-navy-800 text-white font-semibold">
                <Plus className="w-4 h-4 mr-1.5" />
                New Service Invoice
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-slate-500 hover:text-red-600"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-selyo-900 rounded-2xl p-6 sm:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              EoPT Service Invoicing Active
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}!
            </h1>
            <p className="text-sm text-slate-200 max-w-xl">
              TIN: <span className="font-mono">{profile?.tin_number || "000-000-000-000"}</span> • RDO: {profile?.rdo_code || "044 - Taguig"} • Regime: <span className="font-semibold text-emerald-300">8% Flat Income Tax</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/onboarding">
              <Button variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                Edit BIR Profile
              </Button>
            </Link>
            <Link href="/invoices/new">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
                <Receipt className="w-4 h-4 mr-1.5" />
                Create Invoice
              </Button>
            </Link>
          </div>
        </div>

        {/* Free Starter paywall banner — upgrade to Pro */}
        {!loading && !isProActive(subscription) && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 text-xs font-semibold text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Free Starter tier:</strong> up to 3 invoices/month.
                Upgrade to Pro for unlimited invoices and the eBIRForms mapper.
              </span>
            </div>
            <Link href="/pricing">
              <Button variant="outline" size="sm" className="font-semibold">
                Upgrade to Pro →
              </Button>
            </Link>
          </div>
        )}

        {/* ₱250,000 Tax-Free Threshold Progress Card */}
        <Card className="border-emerald-200/70 bg-gradient-to-br from-emerald-50/40 via-white to-white">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span>2026 Annual ₱250,000 Tax-Free Threshold Meter</span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800">
                8% Flat Tax Regime
              </span>
            </div>
            <CardDescription>
              Under Philippine Tax Law, the first ₱250,000 of your gross freelance receipts each calendar year is 100% exempt from income tax.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Consumed: {formatCurrency(deductionConsumed)} ({thresholdPercentage.toFixed(1)}%)</span>
                <span>Remaining Tax-Free: {formatCurrency(deductionRemaining)}</span>
              </div>
              {/* Progress Bar */}
              <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(3, thresholdPercentage)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-500 block">Gross Invoiced Receipts</span>
                <span className="text-base font-bold font-mono text-navy-900">
                  {formatCurrency(currentGrossPHP)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-500 block">Current Tax Due (8%)</span>
                <span className="text-base font-bold font-mono text-emerald-600">
                  {formatCurrency(estimatedTaxDue)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-500 block">Next BIR Deadline</span>
                <span className="text-base font-bold text-navy-900">
                  May 15 (1701Q - Q1)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Access Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Service Invoices</CardTitle>
                <FileText className="w-5 h-5 text-selyo-700" />
              </div>
              <CardDescription>
                Sequential EoPT compliant invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-extrabold text-navy-900 font-mono">
                {invoiceCount}
              </div>
              <p className="text-xs text-slate-500">
                Next Invoice: <span className="font-mono font-semibold">{profile?.invoice_prefix || "INV"}-{String(profile?.next_invoice_number || 1).padStart(4, "0")}</span>
              </p>
              <Link href="/invoices" className="block pt-2">
                <Button variant="outline" size="sm" className="w-full font-semibold">
                  View All Invoices
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Client Directory</CardTitle>
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <CardDescription>
                Local & foreign remote clients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-extrabold text-navy-900 font-mono">
                {clientCount}
              </div>
              <p className="text-xs text-slate-500">
                Direct bank, Upwork, Wise, Payoneer clients
              </p>
              <Link href="/clients" className="block pt-2">
                <Button variant="outline" size="sm" className="w-full font-semibold">
                  Manage Clients
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Proof of Income</CardTitle>
                <FileCheck className="w-5 h-5 text-amber-500" />
              </div>
              <CardDescription>
                Embassies & bank loan certificates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-extrabold text-navy-900 font-mono">
                Ready
              </div>
              <p className="text-xs text-slate-500">
                Japan/Schengen visa certified summary
              </p>
              <Link href="/reports" className="block pt-2">
                <Button variant="outline" size="sm" className="w-full font-semibold">
                  Generate Certificate
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
