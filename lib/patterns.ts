import type { Call } from "./types";

export interface PatternInput {
  code: string; // reason code, e.g. "13.2"
  reason: string; // reason description
  inr: number;
  call: Call | null; // saved advisor call
}

export interface Pattern {
  code: string;
  reason: string;
  count: number;
  inr: number;
  calls: { fight: number; fold: number; escalate: number };
}

/** Group disputes by reason code, biggest rupee amount first. Fraud (shield) cases are left out: Chargeback Shield covers them. */
export function buildPatterns(rows: PatternInput[]): Pattern[] {
  const by = new Map<string, Pattern>();
  for (const r of rows) {
    if (r.call === "shield" || r.code.startsWith("10.")) continue;
    const p = by.get(r.code) ?? { code: r.code, reason: r.reason, count: 0, inr: 0, calls: { fight: 0, fold: 0, escalate: 0 } };
    p.count += 1;
    p.inr += r.inr;
    if (r.call === "fight" || r.call === "fold" || r.call === "escalate") p.calls[r.call] += 1;
    by.set(r.code, p);
  }
  return [...by.values()].sort((a, b) => b.inr - a.inr || a.code.localeCompare(b.code));
}
