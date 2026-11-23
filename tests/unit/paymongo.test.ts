import { describe, afterEach, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import {
  parsePaymongoEvent,
  verifyPaymongoSignature,
} from "@/lib/services/paymongo";

const SECRET = "test-webhook-secret";

const CHECKOUT_BODY = JSON.stringify({
  data: {
    attributes: {
      type: "checkout_session.payment.paid",
      data: {
        id: "cs_1",
        attributes: {
          metadata: { user_id: "user-1", plan_tier: "pro_monthly" },
          payments: [{ id: "pay_1", attributes: { status: "paid" } }],
        },
      },
    },
  },
});

/** Builds a `Paymongo-Signature` header the same way PayMongo does. */
function signHeader(
  body: string,
  mode: "te" | "li",
  ts = String(Math.floor(Date.now() / 1000))
): string {
  const hex = createHmac("sha256", SECRET).update(`${ts}.${body}`).digest("hex");
  return mode === "te" ? `t=${ts},te=${hex},li=` : `t=${ts},te=,li=${hex}`;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("verifyPaymongoSignature", () => {
  it("accepts live-mode (li) signatures over the raw body", () => {
    vi.stubEnv("PAYMONGO_WEBHOOK_SECRET", SECRET);
    expect(verifyPaymongoSignature(CHECKOUT_BODY, signHeader(CHECKOUT_BODY, "li"))).toBe(true);
  });

  it("accepts test-mode (te) signatures", () => {
    vi.stubEnv("PAYMONGO_WEBHOOK_SECRET", SECRET);
    expect(verifyPaymongoSignature(CHECKOUT_BODY, signHeader(CHECKOUT_BODY, "te"))).toBe(true);
  });

  it("rejects tampered bodies, wrong secrets, and stale timestamps", () => {
    vi.stubEnv("PAYMONGO_WEBHOOK_SECRET", SECRET);
    const ts = String(Math.floor(Date.now() / 1000));

    // Tampered body
    expect(
      verifyPaymongoSignature(`${CHECKOUT_BODY}tampered`, signHeader(CHECKOUT_BODY, "li"))
    ).toBe(false);

    // Wrong secret
    const wrongHex = createHmac("sha256", "another-secret")
      .update(`${ts}.${CHECKOUT_BODY}`)
      .digest("hex");
    expect(verifyPaymongoSignature(CHECKOUT_BODY, `t=${ts},te=,li=${wrongHex}`)).toBe(false);

    // Stale timestamp — a valid HMAC, but signed more than 5 minutes ago
    const oldTs = String(Math.floor(Date.now() / 1000) - 1000);
    const staleHex = createHmac("sha256", SECRET)
      .update(`${oldTs}.${CHECKOUT_BODY}`)
      .digest("hex");
    expect(verifyPaymongoSignature(CHECKOUT_BODY, `t=${oldTs},te=,li=${staleHex}`)).toBe(false);

    // Missing or malformed headers
    expect(verifyPaymongoSignature(CHECKOUT_BODY, null)).toBe(false);
    expect(verifyPaymongoSignature(CHECKOUT_BODY, "garbage")).toBe(false);
  });
});

describe("parsePaymongoEvent", () => {
  it("parses checkout_session.payment.paid", () => {
    expect(parsePaymongoEvent(CHECKOUT_BODY)).toEqual({
      type: "checkout_session.payment.paid",
      userId: "user-1",
      planTier: "pro_monthly",
      paymentId: "pay_1",
    });
  });

  it("parses payment.paid with metadata on the payment resource", () => {
    const body = JSON.stringify({
      data: {
        attributes: {
          type: "payment.paid",
          data: {
            id: "pay_9",
            attributes: {
              status: "paid",
              metadata: { user_id: "user-2", plan_tier: "pro_annual" },
            },
          },
        },
      },
    });
    expect(parsePaymongoEvent(body)).toEqual({
      type: "payment.paid",
      userId: "user-2",
      planTier: "pro_annual",
      paymentId: "pay_9",
    });
  });

  it("returns null for malformed payloads", () => {
    expect(parsePaymongoEvent("not json")).toBeNull();
    expect(parsePaymongoEvent(JSON.stringify({ data: { attributes: {} } }))).toBeNull();
  });
});
