/**
 * Exchange rates (INR per 1 unit of currency). Pure and safe to use in the browser.
 * The live fetch is in lib/fx.ts (server only). When no live or pinned rate is
 * available these demo values are used and the UI says so.
 */
export type RateSource = "live" | "pinned" | "fallback";

export interface Rates {
  usd: number;
  gbp: number;
  eur: number;
  source: RateSource;
  asOf: string | null; // ISO date of the rate, when known
}

export const FALLBACK_RATES: Rates = { usd: 88, gbp: 115, eur: 100, source: "fallback", asOf: null };

export function inrPer(currency: string, rates: Rates = FALLBACK_RATES): number {
  if (currency === "GBP") return rates.gbp;
  if (currency === "EUR") return rates.eur;
  return rates.usd;
}

/** "live rate", "fixed rate" or "demo rate", for short labels. */
export function rateWord(rates: Rates): string {
  return rates.source === "live" ? "live rate" : rates.source === "pinned" ? "fixed rate" : "demo rate";
}

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** One plain sentence saying where the rate comes from. */
export function rateNote(rates: Rates): string {
  const r = `₹${rates.usd.toFixed(2)} per USD`;
  if (rates.source === "live") return `Rate: ${r}, ECB reference rate for ${rates.asOf ? fmtDate(rates.asOf) : "the latest day"} (via frankfurter.dev). Indicative only; Razorpay converts at its own rate.`;
  if (rates.source === "pinned") return `Rate: ${r}, fixed by the builder for this demo. Indicative only; Razorpay converts at its own rate.`;
  return `Rate: ₹${rates.usd} per USD is a demo value, because the live rate could not be loaded.`;
}
