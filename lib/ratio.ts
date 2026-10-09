/**
 * Dispute-ratio tile. The merchant types in two numbers; everything else is arithmetic and attributed text.
 * Figures come from Razorpay's own blog (checked 9 Oct 2026): a recommendation of under 0.5%, "begin investigation" as it approaches 0.5%,
 * "emergency controls" at 0.75%, and a Visa merchant threshold of 1.5% from 1 April 2026. Ratio = disputes in a month / transactions in the same month.
 * Razorpay does not say whether a dispute you win stays in the count, so we say it may.
 */
export const RATIO_SOURCE = {
  label: "Razorpay blog: international payment chargebacks for Indian businesses",
  url: "https://razorpay.com/blog/international-payment-chargebacks-for-indian-businesses-how-to-win-prevent-and-handle-them",
};
export const RATIO_MARKS = [
  { pct: 0.5, label: "Razorpay's blog recommends staying under this", kind: "recommended" },
  { pct: 0.75, label: "Razorpay's blog says to put emergency controls in place here", kind: "emergency" },
  { pct: 1.5, label: "Visa's merchant threshold from 1 April 2026, per Razorpay's blog", kind: "visa" },
] as const;

export interface RatioResult {
  ratioPct: number | null;
  band: "under" | "watch" | "emergency" | "visa" | null;
  /** Extra disputes you could still get this month before reaching each mark. Null if the ratio is already at or past it. */
  room: { pct: number; label: string; more: number | null }[];
  note: string;
}

export function dispRatio(transactions: number, disputes: number): RatioResult {
  if (!Number.isFinite(transactions) || !Number.isFinite(disputes) || transactions <= 0 || disputes < 0) {
    return { ratioPct: null, band: null, room: [], note: "Type in both numbers to see your ratio." };
  }
  const ratioPct = (disputes / transactions) * 100;
  const band = ratioPct >= 1.5 ? "visa" : ratioPct >= 0.75 ? "emergency" : ratioPct >= 0.5 ? "watch" : "under";
  const room = RATIO_MARKS.map((m) => {
    // Largest whole number of disputes that stays strictly below the mark.
    const limit = Math.ceil((m.pct / 100) * transactions) - 1;
    return { pct: m.pct, label: m.label, more: ratioPct >= m.pct ? null : Math.max(limit - disputes, 0) };
  });
  const note =
    band === "under"
      ? "Under the 0.5% Razorpay's blog recommends."
      : band === "watch"
        ? "Near or over 0.5%. Razorpay's blog says to begin investigating as it approaches this."
        : band === "emergency"
          ? "At or over 0.75%. Razorpay's blog says to put emergency controls in place."
          : "At or over 1.5%, Visa's merchant threshold from April 2026 (per Razorpay's blog).";
  return { ratioPct, band, room, note };
}
