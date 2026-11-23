import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Profile } from "@/types/database.types";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const returnTo = requestUrl.searchParams.get("returnTo") || "/dashboard";

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if profile exists and has completed onboarding
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", data.user.id)
        .single<{ onboarding_completed: boolean }>();

      if (!profile || !profile.onboarding_completed) {
        return NextResponse.redirect(new URL("/onboarding", requestUrl.origin));
      }

      return NextResponse.redirect(new URL(returnTo, requestUrl.origin));
    }
  }

  // If error or no code, return to login with error param
  return NextResponse.redirect(
    new URL("/login?error=Authentication failed. Please try again.", requestUrl.origin)
  );
}
