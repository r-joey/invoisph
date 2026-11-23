import { createBrowserClient } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

export function createClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // Supports new Supabase Publishable Key (pk_...) and legacy anon key
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createBrowserClient(supabaseUrl, supabaseKey);
}
