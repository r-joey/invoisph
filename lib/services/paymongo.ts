import { createHmac, timingSafeEqual } from "node:crypto";
import type { Database } from "@/types/database.types";
import type { ProTier } from "@/lib/services/billing";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Phase 7 — PayMongo integration.
 *
 * - `createPayMongoCheckoutSession` — creates a hosted-checkout session
 *   (GCash, Maya, QR Ph, cards) via the PayMongo v2 Checkout API.
 * - `verifyPaymongoSignature` / `parsePaymongoEvent` — webhook verification
 *   (HMAC-SHA256 of `timestamp.raw_body`) and event parsing.
 * - `activateSubscription` / `removePendingSubscription` — update the
 *   `subscriptions` table when payments complete or fail.
 */

const PAYMONGO_API_BASE = "https://api.paymongo.com";
const WEBHOOK_STALE_TOLERANCE_SECONDS = 300;

function paymongoAuthHeader(): string {
  const key = process.env.PAYMONGO_SECRET_KEY;
  if (!key) throw new Error("PAYMONGO_SECRET_KEY is not set");
  // PayMongo uses HTTP basic auth: the secret key as the username, trailing colon.
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

export async function createPayMongoCheckoutSession(params: {
  userId: string;
  planTier: ProTier;
}): Promise<string> {
  const { userId, planTier } = params;
  const amount = planTier === "pro_annual" ? 199900 : 29900; // PHP centavos
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/+$/,
    ""
  );

  const res = await fetch(`${PAYMONGO_API_BASE}/v2/checkout_sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: paymongoAuthHeader(),
    },
    body: JSON.stringify({
      data: {
        attributes: {
          line_items: [
            {
              name:
                planTier === "pro_annual"
                  ? "Pro Freelancer — 1 year"
                  : "Pro Freelancer — 1 month",
              amount,
              currency: "PHP",
              quantity: 1,
            },
          ],
          payment_method_types: ["card", "gcash", "paymaya", "qrph"],
          success_url: `${appUrl}/dashboard`,
          cancel_url: `${appUrl}/pricing`,
          reference_number: `INVOISPH-PRO-${userId}`,
          pass_on_fees: true,
          metadata: { user_id: userId, plan_tier: planTier },
        },
      },
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    data?: { attributes?: { checkout_url?: string } };
  };

  if (!res.ok) {
    throw new Error(
      `PayMongo API error (${res.status}): ${JSON.stringify(data).slice(0, 500)}`
    );
  }

  const checkoutUrl = data.data?.attributes?.checkout_url;
  if (!checkoutUrl) {
    throw new Error("PayMongo did not return a checkout_url");
  }
  return checkoutUrl;
}

// ---------------------------------------------------------------------------
// Webhook verification + event parsing
// ---------------------------------------------------------------------------

interface WebhookEnvelope {
  data: {
    attributes: {
      type: string;
      data: {
        id: string;
        attributes?: {
          metadata?: Record<string, string>;
          payments?: { id: string; attributes: { status: string } }[];
        };
      };
    };
  };
}

/** Parsed info we need from a webhook event. */
export interface ParsedPaymongoEvent {
  type: string;
  userId: string | null;
  planTier: string | null;
  paymentId: string | null;
}

/**
 * PayMongo signs every webhook with HMAC-SHA256 over `timestamp.raw_body`
 * using the webhook secret. The `Paymongo-Signature` header is
 * `t=<ts>,te=<test signature>,li=<live signature>`.
 */
export function verifyPaymongoSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  if (!signatureHeader) return false;

  const parts = signatureHeader.split(",").map((part) => part.trim());
  const t = parts.find((p) => p.startsWith("t="))?.slice(2);
  const te = parts.find((p) => p.startsWith("te="))?.slice(3);
  const li = parts.find((p) => p.startsWith("li="))?.slice(3);
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!secret || !t) return false;

  // Live events use `li`, test events use `te`.
  const providedHex = li || te;
  if (!providedHex) return false;

  // Optional anti-replay check: reject very old or far-future signatures.
  const ts = Number(t);
  if (
    !Number.isFinite(ts) ||
    Math.abs(Date.now() / 1000 - ts) > WEBHOOK_STALE_TOLERANCE_SECONDS
  ) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest();
  const provided = Buffer.from(providedHex, "hex");
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(expected, provided);
}

export function parsePaymongoEvent(rawBody: string): ParsedPaymongoEvent | null {
  let parsed: WebhookEnvelope;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return null;
  }

  const eventType = parsed?.data?.attributes?.type;
  const resource = parsed?.data?.attributes?.data;
  if (!eventType || !resource) return null;

  const metadata = resource.attributes?.metadata;
  const userId = metadata?.user_id ?? null;
  const planTier = metadata?.plan_tier ?? null;
  const paidPayment = (resource.attributes?.payments ?? []).find(
    (p) => p.attributes.status === "paid"
  );
  const paymentId = paidPayment?.id ?? resource.id ?? null;

  return { type: eventType, userId, planTier, paymentId };
}

// ---------------------------------------------------------------------------
// Subscription updates
// ---------------------------------------------------------------------------

export async function activateSubscription(
  supabase: SupabaseClient<Database>,
  userId: string | null | undefined,
  planTier: string | null | undefined,
  paymentId: string | null
): Promise<void> {
  // Type guard: only Pro tiers may activate a subscription.
  if (!userId || (planTier !== "pro_monthly" && planTier !== "pro_annual")) return;

  const start = new Date();
  const end = new Date(
    start.getFullYear() + (planTier === "pro_annual" ? 1 : 0),
    start.getMonth() + (planTier === "pro_annual" ? 0 : 1),
    start.getDate()
  );

  const { data: updated } = await supabase
    .from("subscriptions")
    .update({
      status: "active",
      current_period_start: start.toISOString(),
      current_period_end: end.toISOString(),
      paymongo_payment_id: paymentId,
    })
    .eq("user_id", userId)
    .eq("status", "pending")
    .select("id");

  if ((updated ?? []).length === 0) {
    // No pending row matched (e.g. the checkout route was skipped) — insert one.
    await supabase.from("subscriptions").insert({
      user_id: userId,
      plan_tier: planTier,
      status: "active",
      current_period_start: start.toISOString(),
      current_period_end: end.toISOString(),
      paymongo_payment_id: paymentId,
    });
  }
}

export async function removePendingSubscription(
  supabase: SupabaseClient<Database>,
  userId: string | null | undefined
): Promise<void> {
  if (!userId) return;
  await supabase
    .from("subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("status", "pending");
}
