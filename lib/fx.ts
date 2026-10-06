import { FALLBACK_RATES, type Rates } from "./rates";

/**
 * Server only. Live USD/INR from the ECB reference rates via frankfurter.dev (no key).
 * - FX_RATE_INR_PER_USD pins the USD rate (use it so the video, the note and the demo agree).
 * - Cached for 12 hours, 3 second timeout, any failure or odd value falls back to the demo rates.
 */
const DEFAULT_URL = "https://api.frankfurter.dev/v1/latest?base=USD&symbols=INR,GBP,EUR";
const TIMEOUT_MS = 3000;

export function parseRates(json: unknown): Rates | null {
  const j = json as { date?: unknown; rates?: Record<string, unknown> } | null;
  const inr = Number(j?.rates?.INR), gbp = Number(j?.rates?.GBP), eur = Number(j?.rates?.EUR);
  if (![inr, gbp, eur].every((n) => Number.isFinite(n) && n > 0)) return null;
  if (inr < 40 || inr > 200) return null; // sanity band: refuse nonsense rather than show it
  return {
    usd: inr,
    gbp: inr / gbp, // INR per GBP, from USD per GBP
    eur: inr / eur,
    source: "live",
    asOf: typeof j?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(j.date) ? j.date : null,
  };
}

export function applyPin(rates: Rates, pin: string | undefined): Rates {
  const n = Number(pin);
  if (pin && Number.isFinite(n) && n >= 40 && n <= 200) return { ...rates, usd: n, source: "pinned", asOf: null };
  return rates;
}

export async function getRates(fetchFn: typeof fetch = fetch, pin = process.env.FX_RATE_INR_PER_USD): Promise<Rates> {
  let base = FALLBACK_RATES;
  try {
    const res = await fetchFn(process.env.FX_API_URL || DEFAULT_URL, { signal: AbortSignal.timeout(TIMEOUT_MS), next: { revalidate: 43200 } } as RequestInit);
    if (res.ok) base = parseRates(await res.json()) ?? FALLBACK_RATES;
  } catch {
    // keep the fallback
  }
  return applyPin(base, pin);
}
