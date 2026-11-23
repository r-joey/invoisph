/**
 * InvoisPH - Foreign Exchange (FX) Engine
 * Aligned with BIR RA 11976 (EoPT) & Bangko Sentral ng Pilipinas (BSP) conversion standards.
 *
 * Rate sources (first that succeeds wins):
 *   1. Open Exchange Rates (free, no-key API) when OPEN_EXCHANGE_RATES_APP_ID is set
 *   2. open.er-api.com free PHP-base API (default)
 *
 * Cache hierarchy in getLatestFXRates():
 *   1. In-memory cache (60 min per worker)
 *   2. Supabase `fx_rates` table (daily validity window, service-role only)
 *   3. Live fetch
 *   4. Static fallback rates (FALLBACK_RATES_TO_PHP)
 */

import { createServiceClient } from "@/lib/supabase/service";

export interface FXRatesResponse {
  date: string;
  base: string;
  ratesToPHP: Record<string, number>;
  source: "live" | "open_exchange" | "cached" | "fallback";
  timestamp: number;
}

// Deterministic baseline rates if network is offline or the API fails
export const FALLBACK_RATES_TO_PHP: Record<string, number> = {
  USD: 58.55,
  EUR: 62.10,
  AUD: 38.25,
  GBP: 74.40,
  CAD: 42.15,
  SGD: 43.60,
  JPY: 0.382,
  PHP: 1.0,
};

const TARGET_CURRENCIES = ["USD", "EUR", "AUD", "GBP", "CAD", "SGD", "JPY"] as const;

// In-memory cache for fast lookups per day
let cachedRates: FXRatesResponse | null = null;

// ---------------------------------------------------------------------------
// Supabase FX rates cache (service-role only; rows stay valid ~24h from fetch)
// ---------------------------------------------------------------------------

interface FxCacheRow {
  source: string;
  rates: Record<string, number>;
  fetched_at: string;
}

async function readFxCache(): Promise<{
  ratesToPHP: Record<string, number>;
  date: string;
  source: "live" | "open_exchange";
} | null> {
  const serviceClient = createServiceClient();
  if (!serviceClient) return null;

  try {
    const { data } = await serviceClient
      .from("fx_rates")
      .select("source, rates, fetched_at")
      .gte("valid_until", new Date().toISOString())
      .order("fetched_at", { ascending: false })
      .limit(1);

    const row = data?.[0] ?? null;
    if (!row) return null;

    return {
      ratesToPHP: { ...row.rates, PHP: 1 },
      date: row.fetched_at
        ? String(row.fetched_at).split("T")[0]
        : new Date().toISOString().split("T")[0],
      source: row.source === "open_exchange" ? "open_exchange" : "live",
    };
  } catch {
    // A broken cache must never break the read path.
    return null;
  }
}

async function writeFxCache(
  source: "live" | "open_exchange",
  ratesToPHP: Record<string, number>
): Promise<void> {
  const serviceClient = createServiceClient();
  if (!serviceClient) return;

  try {
    const now = new Date();
    const validUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    await serviceClient.from("fx_rates").insert({
      source,
      rates: ratesToPHP,
      valid_until: validUntil.toISOString(),
    });
    // Best-effort housekeeping: drop rows whose validity has lapsed.
    await serviceClient.from("fx_rates").delete().lt("valid_until", now.toISOString());
  } catch {
    // Caching is best-effort; the live read already succeeded by the time we write.
  }
}

// ---------------------------------------------------------------------------
// Live sources
// ---------------------------------------------------------------------------

interface LiveSource {
  ratesToPHP: Record<string, number>;
  source: "live" | "open_exchange";
}

/** Open Exchange Rates (free, no-key). Base is USD: rates[PHP] = PHP per 1 USD. */
async function fetchFromOpenExchangeRates(): Promise<LiveSource> {
  const appId = process.env.OPEN_EXCHANGE_RATES_APP_ID;

  if (!appId) {
    return fetchFromOpenErApi();
  }

  const res = await fetch(
    `https://openexchangerates.org/api/latest.json?app_id=${encodeURIComponent(appId)}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) {
    throw new Error(`FX API responded with status ${res.status}`);
  }

  const data = await res.json();
  const phpPerUnit = (cur: string): number => {
    const perForeign = Number(data?.rates?.[cur]);
    const perPhp = Number(data?.rates?.PHP);
    if (!perForeign || !perPhp) {
      throw new Error(`OpenExchangeRates response missing a rate for ${cur} or PHP`);
    }
    // USD-based API: 1 foreign unit = (rates[cur] / rates[PHP]) USD = rates[cur]/rates[PHP] PHP
    return perForeign / perPhp;
  };

  const ratesToPHP: Record<string, number> = { PHP: 1 };
  for (const cur of TARGET_CURRENCIES) {
    ratesToPHP[cur] = Number(phpPerUnit(cur).toFixed(4));
  }
  return { ratesToPHP, source: "open_exchange" };
}

/** Free open.er-api.com API. Base is PHP; rates[cur] = PHP per 1 foreign unit. */
async function fetchFromOpenErApi(): Promise<LiveSource> {
  const res = await fetch("https://open.er-api.com/v6/latest/PHP", {
    next: { revalidate: 3600 }, // Next.js cache 1 hour
  });

  if (!res.ok) {
    throw new Error(`FX API responded with status ${res.status}`);
  }

  const data = await res.json();
  const ratesFromPHP = data.rates; // 1 PHP = X foreign currency

  // Convert: 1 Foreign Currency = (1 / ratesFromPHP[currency]) PHP
  const ratesToPHP: Record<string, number> = { PHP: 1 };
  for (const cur of TARGET_CURRENCIES) {
    if (ratesFromPHP && ratesFromPHP[cur] && ratesFromPHP[cur] > 0) {
      ratesToPHP[cur] = Number((1 / ratesFromPHP[cur]).toFixed(4));
    } else {
      ratesToPHP[cur] = FALLBACK_RATES_TO_PHP[cur] || 1.0;
    }
  }

  return { ratesToPHP, source: "live" };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getLatestFXRates(): Promise<FXRatesResponse> {
  const todayDateStr = new Date().toISOString().split("T")[0];

  // In-memory cache (60 min per worker)
  if (cachedRates && Date.now() - cachedRates.timestamp < 60 * 60 * 1000) {
    return { ...cachedRates, source: "cached" };
  }

  // Supabase daily cache (newest row still valid)
  const dbCache = await readFxCache();
  if (dbCache) {
    cachedRates = {
      date: dbCache.date,
      base: "PHP",
      ratesToPHP: dbCache.ratesToPHP,
      source: dbCache.source,
      timestamp: Date.now(),
    };
    return cachedRates;
  }

  // Live fetch
  try {
    const live = await fetchFromOpenExchangeRates();

    cachedRates = {
      date: todayDateStr,
      base: "PHP",
      ratesToPHP: live.ratesToPHP,
      source: live.source,
      timestamp: Date.now(),
    };

    await writeFxCache(live.source, live.ratesToPHP);
    return cachedRates;
  } catch (err) {
    console.warn("Failed to fetch live FX rates, using fallback rates:", err);

    return {
      date: todayDateStr,
      base: "PHP",
      ratesToPHP: FALLBACK_RATES_TO_PHP,
      source: "fallback",
      timestamp: Date.now(),
    };
  }
}

/**
 * Convert an amount from any supported currency to PHP using current or custom FX rate
 */
export function convertToPHP(
  amount: number,
  currency: string,
  customFxRate?: number
): { phpAmount: number; rateUsed: number } {
  if (currency === "PHP") {
    return { phpAmount: amount, rateUsed: 1.0 };
  }

  const rate =
    customFxRate ||
    (cachedRates?.ratesToPHP[currency] ?? FALLBACK_RATES_TO_PHP[currency] ?? 1.0);
  const phpAmount = Number((amount * rate).toFixed(2));
  return { phpAmount, rateUsed: rate };
}
