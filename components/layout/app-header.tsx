"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { InvoisPHLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogOut, Plus } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/invoices", label: "Invoices" },
  { href: "/clients", label: "Clients" },
  { href: "/tax-dashboard", label: "8% Tax Tracker" },
  { href: "/reports", label: "Proof of Income" },
] as const;

/**
 * Shared application chrome for authenticated screens. Marks the current
 * section from the pathname so every page highlights its own nav item.
 */
export function AppHeader() {
  const pathname = usePathname();

  const handleSignOut = async () => {
    document.cookie = "invoisph_demo=; path=/; max-age=0";
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // A demo session has no Supabase session to end; just leave.
    }
    window.location.href = "/login";
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard">
            <InvoisPHLogo size="md" />
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm font-semibold">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "px-3 py-1.5 rounded-md transition-colors",
                  isActive(item.href)
                    ? "bg-navy-50 text-navy-900"
                    : "text-slate-600 hover:text-navy-900 hover:bg-slate-100"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/invoices/new">
            <Button
              size="sm"
              className="bg-navy-900 hover:bg-navy-800 text-white font-semibold"
            >
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
  );
}
