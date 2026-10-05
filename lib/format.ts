/** One fixed demo rate, labelled "demo rate" wherever it is shown. Placeholder: confirm before launch. */
export const DEMO_RATE_INR_PER_USD = 88;
/** Rough demo rates for other currencies, same label. */
const OTHER: Record<string, number> = { GBP: 115, EUR: 100 };

export function toInr(amountMajor: number, currency: string): number {
  const rate = currency === "USD" ? DEMO_RATE_INR_PER_USD : OTHER[currency] ?? DEMO_RATE_INR_PER_USD;
  return amountMajor * rate;
}

const SYMBOL: Record<string, string> = { USD: "$", GBP: "£", EUR: "€" };

export function formatOriginal(subunits: number, currency: string): string {
  const major = subunits / 100;
  return `${SYMBOL[currency] ?? currency + " "}${major.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

/** Indian short form: ₹2.67L, ₹99K, ₹1.2Cr */
export function formatInr(inr: number): string {
  if (inr >= 1e7) return `₹${(inr / 1e7).toFixed(2)}Cr`;
  if (inr >= 1e5) return `₹${(inr / 1e5).toFixed(2)}L`;
  if (inr >= 1e3) return `₹${Math.round(inr / 1e3)}K`;
  return `₹${Math.round(inr)}`;
}
export function formatInrFull(inr: number): string {
  return "₹" + Math.round(inr).toLocaleString("en-IN");
}

export function timeLeft(hours: number): { text: string; warn: boolean } {
  if (hours >= 48) return { text: `${Math.floor(hours / 24)}d`, warn: false };
  return { text: `${hours}h`, warn: hours < 24 };
}

export function merchantShort(m: string): string {
  return m.split(" (")[0].split(".")[0];
}
export function merchantDetail(m: string): string {
  return m;
}
