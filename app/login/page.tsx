"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { InvoisPHLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ShieldCheck, Mail, Lock, Sparkles, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      setMessage(null);
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: unknown) {
      const error = err as Error;
      setMessage({ type: "error", text: error?.message || "Failed to sign in." });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail || !signupPassword) return;
    if (signupPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email: signupEmail.trim(),
        password: signupPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
        return;
      }

      if (!data?.user) {
        setMessage({
          type: "error",
          text: "Could not create the account. Try again.",
        });
        return;
      }

      // No email verification: sign straight in with the new credentials.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: signupEmail.trim(),
        password: signupPassword,
      });

      if (signInError) {
        setMessage({ type: "error", text: signInError.message });
        return;
      }

      window.location.href = "/dashboard";
    } catch (err: unknown) {
      const error = err as Error;
      setMessage({ type: "error", text: error?.message || "Failed to create the account." });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <InvoisPHLogo size="md" showTagline={true} />
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            EoPT RA 11976 Compliant
          </div>
        </div>
      </header>

      {/* Main Login Hero Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Freelancer Value Props */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-50 text-navy-800 text-xs font-semibold border border-navy-100">
              <Sparkles className="w-3.5 h-3.5 text-selyo-700" />
              Tailored for Filipino Freelancers & Remote Contractors
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-navy-900 tracking-tight leading-[1.15]">
              Zero-Anxiety Invoicing &{" "}
              <span className="text-selyo-800 underline decoration-selyo-200 decoration-wavy">
                8% Flat Tax Tracking
              </span>
            </h1>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
              Generate BIR-compliant <strong className="text-navy-900">Service Invoices</strong>, auto-fetch daily Bangko Sentral ng Pilipinas exchange rates, and map your ₱250,000 deduction straight to eBIRForms without paying expensive accountants.
            </p>

            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Compliant BIR Service Invoices (EoPT Act)
                  </p>
                  <p className="text-xs text-slate-500">
                    Replaces outdated Official Receipts with legally sequential numbering & mandatory BIR disclaimers.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Live BSP Daily Foreign Exchange Conversion
                  </p>
                  <p className="text-xs text-slate-500">
                    Bill foreign clients in USD/EUR/AUD/GBP while auto-logging precise PHP equivalent for tax filing.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Instant 1-Click Visa & Bank Loan Proof of Income
                  </p>
                  <p className="text-xs text-slate-500">
                    Pass Japan/Schengen embassy and local bank scrutiny with stamped earnings certificates.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-selyo-700" />
                Encrypted PostgreSQL with Row Level Security
              </span>
              <span>•</span>
              <span>Free Starter Tier Available</span>
            </div>
          </div>

          {/* Right Column: Sign In Card */}
          <div className="lg:col-span-5">
            <Card className="border border-slate-200/90 shadow-xl shadow-slate-200/50">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl text-navy-900 font-extrabold">
                  Welcome to InvoisPH
                </CardTitle>
                <CardDescription>
                  Sign in or create your freelancer account in seconds
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {message && (
                  <div
                    className={`p-3.5 rounded-lg text-sm flex items-start gap-2.5 ${
                      message.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {message.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span>{message.text}</span>
                  </div>
                )}

                {/* Email & Password Sign In */}
                <form onSubmit={handleSignIn} className="space-y-3.5">
                  <div>
                    <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="juan.delacruz@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="accent"
                    size="lg"
                    className="w-full font-semibold"
                    disabled={loading || !email || !password}
                  >
                    Sign In
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-slate-400 font-medium">
                      or create an account
                    </span>
                  </div>
                </div>

                {/* Sign Up — email + password, with direct sign-in after creation */}
                <form onSubmit={handleSignUp} className="space-y-3.5">
                  <div>
                    <label htmlFor="signup-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      New Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-10"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="signup-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-10"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="signup-confirm" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <Input
                        id="signup-confirm"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="default"
                    size="lg"
                    className="w-full font-semibold bg-navy-900 hover:bg-navy-800 text-white"
                    disabled={loading || !signupEmail || !signupPassword || signupPassword !== confirmPassword}
                  >
                    Create Account
                  </Button>
                </form>

                <div className="pt-2 border-t border-slate-100 flex flex-col gap-2.5 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      document.cookie = "invoisph_demo=true; path=/; max-age=86400";
                      window.location.href = "/dashboard";
                    }}
                    className="w-full py-2.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Preview Demo Mode (Explore without Supabase setup)
                  </button>
                  <p className="text-xs text-slate-500">
                    By continuing, you agree to comply with Philippine tax laws and BIR regulations.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-4 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} InvoisPH. Built for Philippine Freelancers & Remote Workers.</p>
      </footer>
    </div>
  );
}
