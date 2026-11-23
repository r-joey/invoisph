import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  activateSubscription,
  parsePaymongoEvent,
  removePendingSubscription,
  verifyPaymongoSignature,
} from "@/lib/services/paymongo";

/**
 * Phase 7 — PayMongo webhook listener.
 *
 * Verifies the `Paymongo-Signature` header, then activates the Pro
 * subscription on `payment.paid` / `checkout_session.payment.paid`, and
 * removes any dangling `pending` rows on `payment.failed`.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature =
    request.headers.get("paymongo-signature") ??
    request.headers.get("x-paymongo-signature");

  if (!verifyPaymongoSignature(rawBody, signature)) {
    console.warn("Rejected webhook with invalid PayMongo signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = parsePaymongoEvent(rawBody);
  if (!event) {
    return NextResponse.json({ received: true });
  }

  const supabase = createClient();

  if (event.userId) {
    if (
      event.type === "checkout_session.payment.paid" ||
      event.type === "payment.paid"
    ) {
      await activateSubscription(
        supabase,
        event.userId,
        event.planTier,
        event.paymentId ?? null
      );
    } else if (event.type === "payment.failed") {
      await removePendingSubscription(supabase, event.userId);
    }
  }

  // PayMongo retries until it gets a 2xx response.
  return NextResponse.json({ received: true });
}
