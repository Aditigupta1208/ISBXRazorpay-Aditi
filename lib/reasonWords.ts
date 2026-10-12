/** The reason for a dispute in a merchant's own words. The Visa code and name stay beside it for reference. */
const PLAIN: Record<string, string> = {
  "10.4": "Card fraud",
  "13.1": "Never received",
  "13.2": "Cancelled subscription",
  "13.3": "Not as described",
  "13.6": "Refund not received",
  "13.7": "Cancelled, not refunded",
};

export function plainReason(code: string, fallback: string): string {
  return PLAIN[code] ?? fallback;
}
