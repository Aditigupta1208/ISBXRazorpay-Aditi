/** How the two fixed-rule systems score against the answer key, on the known cases and on the unseen ones. Pure, shared by the Evals page and tests. */
import { fixedChecklist, type BaselineInput } from "./baseline";
import { TUNED_RULES, tunedChecklist, tunedToCall } from "./tunedRules";
import type { CaseData } from "./types";

export interface KeyRow {
  id: string;
  decision: string;
  case_type: string;
  label_status?: string;
}

const want = (d: string) => (d === "Fight" ? "fight" : d === "Accept" ? "fold" : d === "Escalate" ? "escalate" : "shield");
const simpleCall = (c: "Fight" | "Accept" | "n/a") => (c === "Fight" ? "fight" : c === "Accept" ? "fold" : "none");

export interface Scoreboard {
  rulesAdded: number;
  known: { n: number; simple: number; tuned: number };
  unseen: { n: number; simple: number; tuned: number; unconfirmed: number; ids: string[]; tunedMisses: { id: string; call: string; rule: string | null }[]; simpleMisses: string[] };
}

export function scoreRules(cases: CaseData[], key: KeyRow[]): Scoreboard {
  const out: Scoreboard = {
    rulesAdded: TUNED_RULES.length,
    known: { n: 0, simple: 0, tuned: 0 },
    unseen: { n: 0, simple: 0, tuned: 0, unconfirmed: 0, ids: [], tunedMisses: [], simpleMisses: [] },
  };
  for (const k of key) {
    const c = cases.find((x) => x.id === k.id);
    if (!c) continue;
    const input: BaselineInput = { reasonCode: c.dispute.reason_code, razorpayFacts: c.razorpay_facts, evidence: c.evidence };
    const w = want(k.decision);
    const s = simpleCall(fixedChecklist(input).call) === w;
    const t = tunedChecklist(input);
    const tOk = tunedToCall(t.call) === w;
    const bucket = k.case_type === "Unseen" ? out.unseen : out.known;
    bucket.n++;
    if (s) bucket.simple++;
    if (tOk) bucket.tuned++;
    if (k.case_type === "Unseen") {
      out.unseen.ids.push(k.id);
      if (k.label_status && !/^confirmed/i.test(k.label_status)) out.unseen.unconfirmed++;
      if (!tOk) out.unseen.tunedMisses.push({ id: k.id, call: t.call, rule: t.rule?.id ?? null });
      if (!s) out.unseen.simpleMisses.push(k.id);
    }
  }
  return out;
}
