import type { Client } from "@/types/database.types";

/**
 * Demo directory used when InvoisPH runs without a Supabase session (the
 * "Preview Demo Mode" button on /login). Demo rows are identifiable by their
 * `demo-` id prefix so they are never written to a real account.
 */
const DEMO_CLIENTS_STORAGE_KEY = "invoisph_demo_clients";

export const INITIAL_DEMO_CLIENTS: Client[] = [
  {
    id: "demo-client-1",
    user_id: "demo-user",
    name: "Apex Growth Marketing LLC",
    email: "billing@apexgrowth.io",
    country: "United States",
    currency: "USD",
    billing_address: "555 California St, Suite 300, San Francisco, CA 94104, USA",
    notes: "Direct contract, monthly retainer ($1,800/mo), paid via Wise to BDO",
    archived: false,
    manual_fx_rate: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-client-2",
    user_id: "demo-user",
    name: "Sydney Digital Media Pty Ltd",
    email: "accounts@sydneydigital.com.au",
    country: "Australia",
    currency: "AUD",
    billing_address: "Level 14, 100 George St, Sydney NSW 2000, Australia",
    notes: "Hourly design contract ($35 AUD/hr), bi-weekly invoices",
    archived: false,
    manual_fx_rate: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-client-3",
    user_id: "demo-user",
    name: "Manila Creative Labs Corp",
    email: "finance@manilacreative.ph",
    country: "Philippines",
    currency: "PHP",
    billing_address: "26th Floor, High Street South Corporate Plaza, BGC, Taguig City",
    notes: "Local client, subject to 5% creditable withholding tax (BIR Form 2307)",
    archived: false,
    manual_fx_rate: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/** Read the demo directory, seeding localStorage on first use. */
export function getDemoClients(): Client[] {
  if (typeof window === "undefined") return INITIAL_DEMO_CLIENTS;

  const raw = window.localStorage.getItem(DEMO_CLIENTS_STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Client[];
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Corrupt demo data falls back to the seed below.
    }
  }

  saveDemoClients(INITIAL_DEMO_CLIENTS);
  return INITIAL_DEMO_CLIENTS;
}

export function saveDemoClients(clients: Client[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_CLIENTS_STORAGE_KEY, JSON.stringify(clients));
}

/** Demo rows are never persisted to Supabase — their ids carry this prefix. */
export function isDemoRecordId(id: string | null | undefined): boolean {
  return Boolean(id && id.startsWith("demo-"));
}
