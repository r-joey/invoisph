"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { InvoisPHLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BIR_RDOS } from "@/lib/constants/rdos";
import { formatTIN } from "@/lib/utils";
import {
  Building2,
  FileText,
  BadgePercent,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  AlertCircle,
  Hash,
  Globe,
  MapPin,
  Sparkles,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [registeredBusinessName, setRegisteredBusinessName] = useState("");
  const [tinNumber, setTinNumber] = useState("");
  const [rdoCode, setRdoCode] = useState("044 - Taguig / Pateros");
  const [registeredAddress, setRegisteredAddress] = useState("");
  const [taxRegime, setTaxRegime] = useState<"8_percent_gross" | "graduated">("8_percent_gross");
  const [currencyDefault, setCurrencyDefault] = useState("USD");
  const [invoicePrefix, setInvoicePrefix] = useState("INV");
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState("1");

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          if (user.user_metadata?.full_name) {
            setFullName(user.user_metadata.full_name);
          }
          // Fetch existing profile if partially filled
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (profile) {
            if (profile.full_name) setFullName(profile.full_name);
            if (profile.registered_business_name) setRegisteredBusinessName(profile.registered_business_name);
            if (profile.tin_number) setTinNumber(profile.tin_number);
            if (profile.rdo_code) setRdoCode(profile.rdo_code);
            if (profile.registered_address) setRegisteredAddress(profile.registered_address);
            if (profile.tax_regime) setTaxRegime(profile.tax_regime as "8_percent_gross" | "graduated");
            if (profile.currency_default) setCurrencyDefault(profile.currency_default);
            if (profile.invoice_prefix) setInvoicePrefix(profile.invoice_prefix);
            if (profile.next_invoice_number) setNextInvoiceNumber(profile.next_invoice_number.toString());
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setCheckingAuth(false);
      }
    }

    loadUser();
  }, []);

  const handleTINChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTIN(e.target.value);
    setTinNumber(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Please provide your full legal name.");
      return;
    }

    if (!tinNumber.trim()) {
      setError("Please provide your BIR Taxpayer Identification Number (TIN).");
      return;
    }

    try {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const profilePayload = {
        full_name: fullName.trim(),
        registered_business_name: registeredBusinessName.trim() || fullName.trim(),
        tin_number: tinNumber.trim(),
        rdo_code: rdoCode,
        registered_address: registeredAddress.trim(),
        tax_regime: taxRegime,
        currency_default: currencyDefault,
        invoice_prefix: invoicePrefix.trim().toUpperCase() || "INV",
        next_invoice_number: parseInt(nextInvoiceNumber, 10) || 1,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      };

      if (user) {
        const { error: upsertError } = await supabase
          .from("profiles")
          .upsert({
            id: user.id,
            email: user.email!,
            ...profilePayload,
          });

        if (upsertError) {
          throw upsertError;
        }
      } else {
        // In demo mode without active Supabase user
        document.cookie = "invoisph_demo=true; path=/; max-age=86400";
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy-900 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600">Setting up your InvoisPH workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <InvoisPHLogo size="lg" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-selyo-800 text-xs font-semibold border border-blue-200">
            <Sparkles className="w-3.5 h-3.5" />
            Step 1 of 1: Freelancer BIR & Invoicing Setup
          </div>
          <h1 className="text-3xl font-extrabold text-navy-900">
            Let&apos;s configure your BIR Service Invoice profile
          </h1>
          <p className="text-slate-600 text-sm max-w-xl">
            Under Republic Act No. 11976 (Ease of Paying Taxes Act), your service invoices must carry your registered business name, valid TIN, and official RDO.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">Setup Error</p>
              <p className="text-xs text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Wizard Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Identity & Registered Business */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5 text-navy-900 font-bold text-lg">
                <Building2 className="w-5 h-5 text-selyo-800" />
                <span>1. Personal & Registered Freelance Identity</span>
              </div>
              <CardDescription>
                This appears on the header of all your generated PDF Service Invoices.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Legal Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Juan De La Cruz"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Your name as stated in your BIR Form 2303 / Certificate of Registration.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Registered Trade Name / Business Name
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Juan Digital Solutions (Optional)"
                    value={registeredBusinessName}
                    onChange={(e) => setRegisteredBusinessName(e.target.value)}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Leave blank if registered solely under your personal name.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Registered Business Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <Input
                    type="text"
                    placeholder="e.g. Unit 402, Sunshine Tower, Mandaluyong City, Metro Manila"
                    value={registeredAddress}
                    onChange={(e) => setRegisteredAddress(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Must match the registered home or office address in your BIR Certificate of Registration.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: BIR Tax Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5 text-navy-900 font-bold text-lg">
                <BadgePercent className="w-5 h-5 text-emerald-600" />
                <span>2. BIR Tax Details & 8% Flat Tax Regime</span>
              </div>
              <CardDescription>
                Powering your quarterly 1701Q calculations and ₱250,000 threshold tracker.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Taxpayer Identification Number (TIN) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="000-000-000-000"
                    value={tinNumber}
                    onChange={handleTINChange}
                    maxLength={15}
                    className="font-mono-numbers font-medium tracking-wide"
                    required
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    9 or 12 digits (with 3-digit branch code, e.g. -000 for Head Office).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Revenue District Office (RDO) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={rdoCode}
                    onChange={(e) => setRdoCode(e.target.value)}
                    className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-selyo-600"
                  >
                    {BIR_RDOS.map((rdo) => (
                      <option key={rdo.code} value={rdo.name}>
                        {rdo.name} ({rdo.region})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    The BIR office where your registration is lodged.
                  </p>
                </div>
              </div>

              {/* Tax Regime Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Tax Regime Selection
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setTaxRegime("8_percent_gross")}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      taxRegime === "8_percent_gross"
                        ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/30"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-navy-900">
                        8% Flat Income Tax (Recommended)
                      </span>
                      {taxRegime === "8_percent_gross" && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      First ₱250,000 gross annual income is <strong>100% tax-free</strong>. Replaces both percentage tax and graduated brackets. Ideal for pure service freelancers earning under ₱3M/year.
                    </p>
                  </div>

                  <div
                    onClick={() => setTaxRegime("graduated")}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      taxRegime === "graduated"
                        ? "border-selyo-700 bg-blue-50/50 ring-2 ring-selyo-600/30"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-navy-900">
                        Graduated Tax Rates (OSD / Itemized)
                      </span>
                      {taxRegime === "graduated" && (
                        <CheckCircle2 className="w-5 h-5 text-selyo-700" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      Traditional 0%–35% progressive brackets with 40% Optional Standard Deduction (OSD) or itemized expenses + 3% percentage tax.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Invoicing Defaults */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5 text-navy-900 font-bold text-lg">
                <FileText className="w-5 h-5 text-navy-800" />
                <span>3. Invoicing Numbering & Default Currency</span>
              </div>
              <CardDescription>
                Configure sequential numbering required by the BIR EoPT framework.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Invoice Prefix
                  </label>
                  <Input
                    type="text"
                    placeholder="INV"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    maxLength={8}
                    className="font-mono uppercase font-bold"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">e.g. INV or SI</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Starting Number
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <Input
                      type="number"
                      min={1}
                      value={nextInvoiceNumber}
                      onChange={(e) => setNextInvoiceNumber(e.target.value)}
                      className="pl-9 font-mono-numbers"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    First invoice will be: {invoicePrefix}-{String(nextInvoiceNumber).padStart(4, "0")}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Primary Billing Currency
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <select
                      value={currencyDefault}
                      onChange={(e) => setCurrencyDefault(e.target.value)}
                      className="flex h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-selyo-600 font-semibold"
                    >
                      <option value="USD">USD ($ - US Dollar)</option>
                      <option value="PHP">PHP (₱ - Philippine Peso)</option>
                      <option value="EUR">EUR (€ - Euro)</option>
                      <option value="AUD">AUD (A$ - Australian Dollar)</option>
                      <option value="GBP">GBP (£ - British Pound)</option>
                      <option value="SGD">SGD (S$ - Singapore Dollar)</option>
                      <option value="CAD">CAD (C$ - Canadian Dollar)</option>
                    </select>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Auto-converted to PHP via BSP FX rates.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="default"
              size="lg"
              className="w-full h-13 text-base font-bold bg-navy-900 hover:bg-navy-800 text-white shadow-lg"
              disabled={loading}
            >
              {loading ? (
                "Saving Your InvoisPH Settings..."
              ) : (
                <>
                  Complete Setup & Open InvoisPH Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
            <p className="text-center text-xs text-slate-500 mt-2.5">
              You can adjust these settings anytime from your Account Settings.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
