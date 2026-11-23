import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPayMongoCheckoutSession } from "@/lib/services/paymongo";
import { isProActive, type ProTier } from "@/lib/services/billing";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  let body: { plan_tier?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Fall through to validation — missing tier is a 400 below.
  }

  const planTier = body.plan_tier;
  if (planTier !== "pro_monthly" && planTier !== "pro_annual") {
    return NextResponse.json({ error: "Invalid plan tier." }, { status: 400 });
  }

  // If the user already has an active Pro subscription, there's nothing to buy.
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (isProActive(existing)) {
    return NextResponse.json({ alreadyPro: true, checkoutUrl: null });
  }

  // Start a clean pending row; it flips to `active` when the webhook lands.
  await supabase.from("subscriptions").delete().eq("user_id", user.id);
  await supabase.from("subscriptions").insert({
    user_id: user.id,
    plan_tier: planTier as ProTier,
    status: "pending",
  });

  try {
    const checkoutUrl = await createPayMongoCheckoutSession({
      userId: user.id,
      planTier,
    });
    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    // Roll back the pending row so the user stays on the free tier.
    await supabase.from("subscriptions").delete().eq("user_id", user.id);
    console.error("PayMongo checkout failed:", err);
    return NextResponse.json(
      { error: "Failed to start checkout. Please try again." },
      { status: 500 }
    );
  }
}
