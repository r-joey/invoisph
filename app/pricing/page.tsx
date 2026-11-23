"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CheckCircle2, CreditCard, Zap } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  PRO_ANNUAL_PRICE_PHP,
  PRO_MONTHLY_PRICE_PHP,
  isProActive,
} from "@/lib/services/billing";
import type { Subscription } from "@/types/database.types";
import { AlertCircle, ArrowLeft } from "lucide-react";

const FREE_FEATURES = [
  "Up to 3 invoices/month",
  "Manual FX rates",
  "Standard PDF export",
];

const PRO_FEATURES = [
  "Unlimited invoices",
  "Auto BSP FX rates — live and cached daily",
  "eBIRForms 1701Q/1701A mapper",
  "Custom branding & logo",
  "Proof of Income visa certificate",
  "Everything in Free Starter",
];

function FeatureLine({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2 text-xs text-slate-600">
      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-selyo-800" />
      <span>{text}</span>
    </li>
  );
}

export default function PricingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnnual, setIsAnnual] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("subscriptions")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();
          setSubscription(data);
        }
      } catch (err) {
        console.error("Failed to load subscription:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const upgradeTo = async (planTier: "pro_monthly" | "pro_annual") => {
    setCheckoutError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_tier: planTier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not start checkout.";
      setCheckoutError(message);
    }
  };

  const isPro = isProActive(subscription);
  const proPrice = isAnnual ? PRO_ANNUAL_PRICE_PHP : PRO_MONTHLY_PRICE_PHP;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <div className="p-16 flex flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy-900 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600">Loading plans...</p>
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
            Plans &amp; Pricing
          </h1>
          <p className="text-sm text-slate-600">
            Choose the plan that fits your freelance workflow.
          </p>
        </div>

        {checkoutError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{checkoutError}</span>
          </div>
        )}

        {/* Billing cycle toggle */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-slate-500">Billing cycle</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                !isAnnual
                  ? "border-navy-900 bg-navy-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                isAnnual
                  ? "border-selyo-700 bg-selyo-800 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Annually
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
          {/* Free Starter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Free Starter</CardTitle>
              <CardDescription>
                Zero-cost entry point for solo freelancers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 h-full flex flex-col">
              <div>
                <span className="text-3xl font-extrabold text-navy-900 font-mono">
                  ₱0
                </span>
                <span className="ml-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Forever free
                </span>
              </div>
              <ul className="space-y-1.5">
                {FREE_FEATURES.map((feature) => (
                  <FeatureLine key={feature} text={feature} />
                ))}
              </ul>
              <div className="pt-2 mt-auto">
                <Button variant="outline" size="lg" disabled className="w-full font-semibold">
                  You&apos;re on the Free Starter
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pro Freelancer */}
          <Card className="border-selyo-700 ring-1 ring-selyo-200 bg-gradient-to-br from-selyo-50/40 via-white to-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Pro Freelancer</CardTitle>
                <Zap className="w-5 h-5 text-selyo-800" />
              </div>
              <CardDescription>
                For freelancers scaling their workflow.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 h-full flex flex-col">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-navy-900 font-mono">
                    ₱{proPrice}
                  </span>
                  <span className="text-sm font-medium text-slate-500">
                    /{isAnnual ? "year" : "month"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {isAnnual
                    ? "Annual billing — saves ~₱590/yr vs. monthly."
                    : "Billed monthly — upgrade anytime."}
                </p>
              </div>
              <ul className="space-y-1.5">
                {PRO_FEATURES.map((feature) => (
                  <FeatureLine key={feature} text={feature} />
                ))}
              </ul>
              <div className="pt-2 mt-auto space-y-2">
                {isPro ? (
                  <Button disabled className="w-full bg-navy-900 font-semibold">
                    Your Pro plan
                  </Button>
                ) : (
                  <Button
                    onClick={() =>
                      upgradeTo(isAnnual ? "pro_annual" : "pro_monthly")
                    }
                    className="w-full bg-selyo-800 hover:bg-selyo-700 text-white font-semibold"
                  >
                    <CreditCard className="w-4 h-4 mr-1.5" />
                    Upgrade to Pro — ₱{proPrice}/{isAnnual ? "year" : "month"}
                  </Button>
                )}
                <p className="text-[10px] text-center text-slate-400">
                  PayMongo checkout — GCash, Maya, QR Ph, cards
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
