/**
 * Results: what happened to the disputes the merchant acted on. Pure functions, safe in the browser.
 * Records come from two places: the sample history (made-up, labelled) and what the merchant records in this demo.
 */
import history from "@/data/sample-history.json";
import type { Rates } from "./rates";

export type Conf = "High" | "Medium" | "Low";
export type AdvisorCall = "fight" | "fold" | "escalate";

export interface Rec {
  id: string;
  source: "sample" | "you";
  code: string;
  amountInr: number; // disputed amount
  contestInr: number; // part contested; recovered in full if the merchant wins
  call: AdvisorCall; // what the advisor said at the time
  confidence: Conf | null;
  action: "fight" | "fold"; // what the merchant did
  outcome: "won" | "lost" | null; // null: submitted, waiting for the result
  onTime: boolean;
}

/** The AI estimate shown for each confidence level on saved results (data/prerun/demo-supplements.json). */
export const ODDS_BY_CONFIDENCE: Record<Conf, number> = { High: 0.8, Medium: 0.55, Low: 0.35 };

interface SampleRow {
  id: string;
  reason_code: string;
  amount_usd: number;
  advisor_call: string;
  confidence: string;
  merchant_action: string;
  outcome: string;
  on_time: boolean;
}

export const SAMPLE_COUNT = (history as { records: SampleRow[] }).records.length;

export function sampleRecords(rates: Rates): Rec[] {
  return (history as { records: SampleRow[] }).records.map((r) => ({
    id: r.id,
    source: "sample" as const,
    code: r.reason_code,
    amountInr: r.amount_usd * rates.usd,
    contestInr: r.amount_usd * rates.usd,
    call: r.advisor_call as AdvisorCall,
    confidence: r.confidence as Conf,
    action: r.merchant_action as "fight" | "fold",
    outcome: r.outcome as "won" | "lost",
    onTime: r.on_time,
  }));
}

const frac = (a: number, b: number) => (b > 0 ? a / b : null);

export interface CodeRow { code: string; disputes: number; fights: number; won: number; recoveredInr: number; disputedInr: number }
export interface ConfRow { confidence: Conf; n: number; won: number; estimate: number }

export interface Summary {
  pending: number;
  settled: number;
  disputedInr: number;
  recoveredInr: number;
  lostInr: number;
  netRecovered: number | null; // recovered / disputed
  fights: number;
  won: number;
  winRate: number | null;
  onTimeRate: number | null;
  byCode: CodeRow[];
  fightCalls: { n: number; won: number };
  byConfidence: ConfRow[]; // only for Fight calls
  foldCalls: { n: number; wrong: number }; // wrong: advisor said Fold, merchant fought anyway and won
  escalated: { n: number; fought: number; won: number };
}

export function summarize(recs: Rec[]): Summary {
  const settled = recs.filter((r) => r.outcome !== null);
  const recovered = (r: Rec) => (r.outcome === "won" ? r.contestInr : 0);
  const disputedInr = settled.reduce((s, r) => s + r.amountInr, 0);
  const recoveredInr = settled.reduce((s, r) => s + recovered(r), 0);
  const fought = settled.filter((r) => r.action === "fight");
  const won = fought.filter((r) => r.outcome === "won").length;

  const codes = new Map<string, CodeRow>();
  for (const r of settled) {
    const c = codes.get(r.code) ?? { code: r.code, disputes: 0, fights: 0, won: 0, recoveredInr: 0, disputedInr: 0 };
    c.disputes += 1;
    c.disputedInr += r.amountInr;
    c.recoveredInr += recovered(r);
    if (r.action === "fight") {
      c.fights += 1;
      if (r.outcome === "won") c.won += 1;
    }
    codes.set(r.code, c);
  }

  const fightCalls = settled.filter((r) => r.call === "fight");
  const foldCalls = settled.filter((r) => r.call === "fold");
  const esc = settled.filter((r) => r.call === "escalate");
  const byConfidence = (["High", "Medium", "Low"] as Conf[])
    .map((c) => {
      const rows = fightCalls.filter((r) => r.confidence === c);
      return { confidence: c, n: rows.length, won: rows.filter((r) => r.outcome === "won").length, estimate: ODDS_BY_CONFIDENCE[c] };
    })
    .filter((r) => r.n > 0);

  return {
    pending: recs.length - settled.length,
    settled: settled.length,
    disputedInr,
    recoveredInr,
    lostInr: disputedInr - recoveredInr,
    netRecovered: frac(recoveredInr, disputedInr),
    fights: fought.length,
    won,
    winRate: frac(won, fought.length),
    onTimeRate: frac(settled.filter((r) => r.onTime).length, settled.length),
    byCode: [...codes.values()].sort((a, b) => a.code.localeCompare(b.code)),
    fightCalls: { n: fightCalls.length, won: fightCalls.filter((r) => r.outcome === "won").length },
    byConfidence,
    foldCalls: { n: foldCalls.length, wrong: foldCalls.filter((r) => r.action === "fight" && r.outcome === "won").length },
    escalated: {
      n: esc.length,
      fought: esc.filter((r) => r.action === "fight").length,
      won: esc.filter((r) => r.action === "fight" && r.outcome === "won").length,
    },
  };
}

/** The merchant's own record on one reason code, for the line next to the AI estimate. */
export function historyFor(recs: Rec[], code: string): { fights: number; won: number } {
  const f = recs.filter((r) => r.code === code && r.action === "fight" && r.outcome !== null);
  return { fights: f.length, won: f.filter((r) => r.outcome === "won").length };
}

/** The reason code with the lowest win rate (at least `min` fights), for one plain sentence. */
export function weakestCode(rows: CodeRow[], min = 3): CodeRow | null {
  const eligible = rows.filter((r) => r.fights >= min);
  if (!eligible.length) return null;
  return eligible.reduce((a, b) => (b.won / b.fights < a.won / a.fights ? b : a));
}

/** Convert what the merchant did in this demo into a record. A Fold is final; a submit waits for Won or Lost. */
export function fromAction(input: {
  id: string; code: string; atStakeInr: number; contestInr: number; call: AdvisorCall; confidence: string | null;
  actionType: "submit" | "fold"; outcome: "won" | "lost" | null;
}): Rec {
  const conf = input.confidence === "High" || input.confidence === "Medium" || input.confidence === "Low" ? input.confidence : null;
  const fold = input.actionType === "fold";
  return {
    id: input.id,
    source: "you",
    code: input.code,
    amountInr: input.atStakeInr,
    contestInr: fold ? 0 : input.contestInr,
    call: input.call,
    confidence: conf,
    action: fold ? "fold" : "fight",
    outcome: fold ? "lost" : input.outcome,
    onTime: true,
  };
}

/** How many "imaginary past fights" the AI's own estimate counts for when it is blended with the merchant's record. */
export const ODDS_PRIOR_WEIGHT = 10;

export interface AdjustedOdds {
  odds: number; // 0 to 1, what the money check uses
  ai: number;
  n: number; // settled fights the advisor called Fight at this confidence
  won: number;
  adjusted: boolean; // true whenever at least one settled fight informed the odds
}

/**
 * Blend the AI's estimate with how fights the advisor called at the same confidence actually went:
 * (weight * ai + won) / (weight + n). Few results barely move it; many results take over.
 * Only Fight calls with a known confidence and a settled outcome count. Folds and escalations never do.
 */
export function adjustOdds(ai: number, confidence: string | null | undefined, recs: Rec[], weight = ODDS_PRIOR_WEIGHT): AdjustedOdds {
  const base = { odds: ai, ai, n: 0, won: 0, adjusted: false };
  if (confidence !== "High" && confidence !== "Medium" && confidence !== "Low") return base;
  const rows = recs.filter((r) => r.call === "fight" && r.action === "fight" && r.confidence === confidence && r.outcome !== null);
  const won = rows.filter((r) => r.outcome === "won").length;
  const odds = (weight * ai + won) / (weight + rows.length);
  const adjusted = rows.length > 0;
  return { odds: adjusted ? odds : ai, ai, n: rows.length, won, adjusted };
}
