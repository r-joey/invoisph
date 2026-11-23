import Link from "next/link";
import { InvoisPHLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  FileCheck,
  TrendingUp,
  Shield,
  ArrowRight,
  Calculator,
  Award,
  Globe2,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <InvoisPHLogo size="md" showTagline={true} />

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-semibold text-slate-700">
                Log In
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="default" size="sm" className="bg-navy-900 hover:bg-navy-800 text-white font-semibold">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-16 sm:py-24 px-4 max-w-7xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            BIR EoPT Act (Republic Act 11976) Ready
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-navy-900 tracking-tight max-w-4xl mx-auto leading-[1.1]">
            BIR-Compliant Service Invoices &{" "}
            <span className="text-selyo-800">8% Flat Tax Tracker</span> for Filipino Freelancers
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Stop worrying about outdated Official Receipts and complex eBIRForms. Auto-calculate BSP foreign exchange rates, track your ₱250,000 tax-free deduction, and pass visa checks with ease.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-navy-900 hover:bg-navy-800 text-white font-bold h-13 px-8 text-base shadow-lg shadow-navy-900/10">
                Create First Service Invoice Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/onboarding" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto font-semibold h-13 px-6 text-base border-slate-300">
                <Calculator className="w-4 h-4 mr-2 text-selyo-700" />
                Configure BIR Profile
              </Button>
            </Link>
          </div>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-8 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Official EoPT Service Invoice Format</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-selyo-700" />
              <span>Bangko Sentral Daily FX Sync</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Visa & Bank Proof of Income</span>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-16 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
              <h2 className="text-3xl font-extrabold text-navy-900">
                Built specifically for Filipino Remote Contractors
              </h2>
              <p className="text-slate-600 text-base">
                Whether you earn in USD on Upwork, Wise, or direct bank transfer, InvoisPH automates your legal tax paper trail.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all space-y-4">
                <div className="w-12 h-12 rounded-xl bg-navy-900 flex items-center justify-center text-white">
                  <FileCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-navy-900">
                  EoPT Service Invoicing
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Under RA 11976, Official Receipts are defunct for service providers. InvoisPH auto-formats your Service Invoices with required disclaimers, sequential numbering, and TIN stamps.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all space-y-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-navy-900">
                  8% Tax & ₱250k Deduction Tracker
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Visually monitor how much of your ₱250k tax-free statutory allowance is used up. Get exact copy-paste numbers for eBIRForms 1701Q Part II Items 32, 36, and 38.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all space-y-4">
                <div className="w-12 h-12 rounded-xl bg-selyo-800 flex items-center justify-center text-white">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-navy-900">
                  Visa & Bank Proof of Income
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Consolidate multi-client income across USD/EUR/AUD into a standardized Philippine Peso earnings summary designed to pass Japan/Schengen embassy and credit card reviews.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 text-center text-xs text-slate-500 space-y-2">
        <p>© {new Date().getFullYear()} InvoisPH. Zero-Anxiety Invoicing & 8% BIR Tax Tracking for Filipino Freelancers.</p>
        <p className="text-[11px] text-slate-400">
          InvoisPH is an independent software tool designed to assist freelancers with BIR EoPT compliance. It does not replace individual certified tax counsel.
        </p>
      </footer>
    </div>
  );
}
