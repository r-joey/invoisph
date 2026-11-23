import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Service-role client for non-user server-side work — currently the FX rates
 * daily cache (`fx_rates` table). Unlike `lib/supabase/server.ts`, this client
 * never reads user cookies and bypasses RLS, so it may only touch data with no
 * per-user authority (caches, queues, scheduled jobs).
 */
let serviceClient: SupabaseClient<Database> | null | undefined;

export function createServiceClient(): SupabaseClient<Database> | null {
  if (serviceClient !== undefined) {
    return serviceClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    // No service credentials configured (yet): report disabled so callers
    // can degrade gracefully instead of crashing.
    serviceClient = null;
    return null;
  }

  serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  return serviceClient;
}
