/**
 * Alerts as the front door: which disputes would reach the merchant in Slack, WhatsApp or email, and which wait for a digest.
 * Preview only. Nothing is sent, and a "suggest Fold" rule never accepts anything: Fold is always the merchant's click.
 */
export type Channel = "slack" | "whatsapp" | "email";

export interface AlertRules {
  channel: Channel;
  minInr: number; // alert when the amount at stake is at least this
  alwaysReasons: string[]; // alert for these reason codes whatever the amount
  urgentHours: number | null; // always alert when this many hours or fewer are left; null turns it off
  digest: boolean; // send everything else once a day
  foldBelowPct: number | null; // suggest Fold when the chance to win is under this; null turns it off
}

export const DEFAULT_RULES: AlertRules = { channel: "whatsapp", minInr: 50000, alwaysReasons: [], urgentHours: 12, digest: true, foldBelowPct: 20 };

export const MAX_MIN_INR = 100_000_000; // ₹10 crore

/** Rules read back from storage: anything of the wrong type falls back to the default for that rule, so a damaged value cannot break the page. */
export function sanitizeRules(raw: unknown): AlertRules {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_RULES;
  const num = (v: unknown, dflt: number, max: number) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.min(v, max) : dflt);
  const hours = [12, 24, 48];
  const fold = [20, 30, 40];
  return {
    channel: o.channel === "slack" || o.channel === "whatsapp" || o.channel === "email" ? o.channel : d.channel,
    minInr: num(o.minInr, d.minInr, MAX_MIN_INR),
    alwaysReasons: Array.isArray(o.alwaysReasons) ? o.alwaysReasons.filter((x): x is string => typeof x === "string" && /^13\.\d$/.test(x)) : d.alwaysReasons,
    urgentHours: o.urgentHours === null ? null : typeof o.urgentHours === "number" && hours.includes(o.urgentHours) ? o.urgentHours : d.urgentHours,
    digest: typeof o.digest === "boolean" ? o.digest : d.digest,
    foldBelowPct: o.foldBelowPct === null ? null : typeof o.foldBelowPct === "number" && fold.includes(o.foldBelowPct) ? o.foldBelowPct : d.foldBelowPct,
  };
}

export const CHANNEL_LABEL: Record<Channel, string> = { slack: "Slack", whatsapp: "WhatsApp", email: "Email" };

export interface AlertRow {
  id: string;
  disputeId: string;
  merchant: string;
  amountText: string; // "$1,200"
  inr: number;
  inrText: string;
  reasonCode: string;
  reason: string;
  hours: number;
  timeText: string;
  call: "fight" | "fold" | "escalate" | "shield" | null;
  odds: number | null; // 0 to 1
  gap: string | null; // "Missing: ..." or "Decided by: ..."
}

export type Route = "alert" | "digest" | "app" | "not_covered";
export interface Decision {
  route: Route;
  why: string;
  suggestFold: boolean;
}

export function decide(r: AlertRow, rules: AlertRules): Decision {
  if (r.call === "shield") return { route: "not_covered", why: "A fraud reason: Chargeback Shield handles it, so no alert from here.", suggestFold: false };
  const suggestFold = r.call === "fold" || (rules.foldBelowPct !== null && r.odds !== null && r.odds * 100 < rules.foldBelowPct);
  if (rules.urgentHours !== null && r.hours <= rules.urgentHours) return { route: "alert", why: `${rules.urgentHours} hours or less left.`, suggestFold };
  if (rules.alwaysReasons.includes(r.reasonCode)) return { route: "alert", why: `You always want alerts for ${r.reasonCode}.`, suggestFold };
  if (r.inr >= rules.minInr) return { route: "alert", why: `At least ${rules.minInr.toLocaleString("en-IN")} rupees at stake.`, suggestFold };
  if (rules.digest) return { route: "digest", why: "Below your alert rules, so it goes in the daily digest.", suggestFold };
  return { route: "app", why: "Below your alert rules and the digest is off, so it waits in the app.", suggestFold };
}

const CALL_WORD = { fight: "Fight", fold: "Accept", escalate: "Get one document first", shield: "Chargeback Shield" } as const;

/** The text of one alert, the same for every channel; the preview wraps it in a Slack, WhatsApp or email frame. */
export function alertText(r: AlertRow, d: Decision): string {
  const lines = [
    `${r.amountText} (${r.inrText}) dispute, Visa ${r.reasonCode} ${r.reason}`,
    `${r.merchant}`,
    `Advisor's call: ${r.call ? CALL_WORD[r.call] : "not checked yet"}. ${r.timeText} left to respond.`,
  ];
  if (r.gap) lines.push(r.gap);
  if (d.suggestFold) lines.push("The advisor suggests Accept. You decide: nothing is accepted for you.");
  lines.push("Open it to review. Nothing is sent without your approval.");
  return lines.join("\n");
}

/** The body of an alert bubble. The call and the time left are shown beside it as a chip and a badge, so they are not repeated here. */
export function alertBody(r: AlertRow, d: Decision): string {
  const lines = [`${r.amountText} (${r.inrText}) · Visa ${r.reasonCode} ${r.reason}`, r.merchant];
  if (r.gap) lines.push(r.gap);
  if (d.suggestFold) lines.push("The advisor suggests Accept. You decide: nothing is accepted for you.");
  return lines.join("\n");
}

export function digestText(rows: AlertRow[]): string {
  if (rows.length === 0) return "No disputes in today's digest.";
  return [`Today's digest: ${rows.length} dispute${rows.length > 1 ? "s" : ""} below your alert rules`, ...rows.map((r) => `- ${r.disputeId}: ${r.amountText}, ${r.reasonCode}, ${r.timeText} left, ${r.call ? CALL_WORD[r.call] : "not checked"}`)].join("\n");
}
