/**
 * Closing the loop in the repo: a "miss" downloaded from the app (see lib/missCase.ts) becomes a PENDING eval candidate,
 * and only joins data/cases.json and data/labels.json when the builder confirms the label.
 * Pure functions here; file handling is in lib/candidateStore.ts.
 */
import { z } from "zod";
import { fixedChecklist } from "./baseline";
import type { CaseData } from "./types";

const REASON_CODES = ["13.1", "13.2", "13.3", "13.6", "13.7"];
export const DECISIONS = ["Fight", "Accept", "Escalate"] as const;
export type Decision = (typeof DECISIONS)[number];

export const CandidateSchema = z.object({
  status: z.string().regex(/NEEDS HUMAN REVIEW/),
  created: z.string(),
  source_case: z.string(),
  miss: z.string(),
  proposed_label: z.enum(DECISIONS),
  case: z.object({
    dispute: z.object({ reason_code: z.string(), reason_description: z.string(), currency: z.string() }),
    customer_claim: z.string().min(1),
    razorpay_facts: z.string(),
    evidence: z.array(z.object({ id: z.string().regex(/^E\d+$/), title: z.string().optional(), content: z.string().min(1) })).min(1),
  }),
  advisor: z.object({ call: z.string(), confidence: z.string(), deciding_evidence: z.array(z.string()), reason: z.string() }),
  merchant_result: z.object({ action: z.string().optional(), outcome: z.string().optional() }),
});
export type Candidate = z.infer<typeof CandidateSchema>;

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const LONG_NUMBER = /\d[\d\s-]{11,}\d/;

/** Validate a downloaded file. Returns the candidate or a list of plain-language problems. */
export function parseCandidate(raw: unknown): { ok: true; candidate: Candidate } | { ok: false; problems: string[] } {
  const r = CandidateSchema.safeParse(raw);
  if (!r.success) return { ok: false, problems: r.error.issues.map((i) => `${i.path.join(".") || "file"}: ${i.message}`) };
  const c = r.data;
  const problems: string[] = [];
  if (!REASON_CODES.includes(c.case.dispute.reason_code)) problems.push(`reason code ${c.case.dispute.reason_code} is not one of ${REASON_CODES.join(", ")}`);
  const text = JSON.stringify(c.case);
  if (EMAIL.test(text)) problems.push("an email address is still in the case text: mask it, then try again");
  if (LONG_NUMBER.test(text)) problems.push("a long number (card, account or phone) is still in the case text: mask it, then try again");
  return problems.length ? { ok: false, problems } : { ok: true, candidate: c };
}

/** The next free case number, from the ids already in the eval set (C30 gives C31). */
export function nextCaseId(ids: string[]): string {
  const max = ids.reduce((m, id) => Math.max(m, Number(id.replace(/\D/g, "")) || 0), 0);
  return `C${String(max + 1).padStart(2, "0")}`;
}

export interface Confirmation {
  id: string;
  decision: Decision;
  deciding: string; // for example "E1 + E2"
  amountUsd?: number;
  hoursLeft?: number;
  today?: string; // YYYY-MM-DD
}

/** What gets appended to data/cases.json and data/labels.json once the builder confirms the label. */
export function promote(c: Candidate, conf: Confirmation) {
  if (!DECISIONS.includes(conf.decision)) throw new Error(`label must be one of ${DECISIONS.join(", ")}`);
  if (!/E\d+/.test(conf.deciding)) throw new Error('say which documents decide it, for example --deciding "E1 + E2"');
  const ids = new Set(c.case.evidence.map((e) => e.id));
  for (const m of conf.deciding.match(/E\d+/g) ?? []) if (!ids.has(m)) throw new Error(`${m} is not an evidence id in this case`);
  const usd = conf.amountUsd ?? 1000;
  const today = conf.today ?? new Date().toISOString().slice(0, 10);
  const row: CaseData = {
    id: conf.id,
    dispute: {
      id: `disp_demo${conf.id}`,
      payment_id: `pay_demo${conf.id}`,
      amount: Math.round(usd * 100),
      currency: c.case.dispute.currency,
      network: "Visa",
      reason_code: c.case.dispute.reason_code,
      reason_description: c.case.dispute.reason_description,
      phase: "chargeback",
      status: "open",
      raised_on: today,
      respond_by_hours_left: conf.hoursLeft ?? 48,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    merchant: "Names removed (from a recorded outcome).",
    customer_claim: c.case.customer_claim,
    dispute_summary: `Amount: USD ${usd.toLocaleString("en-US")}${conf.amountUsd ? "" : " (placeholder)"}. Customer claim: '${c.case.customer_claim}'`,
    razorpay_facts: c.case.razorpay_facts,
    evidence: c.case.evidence.map((e) => ({ id: e.id, content: e.title ? `${e.title}: ${e.content}` : e.content })),
    source: { pattern: `Eval candidate from a recorded outcome on ${c.source_case} (${c.miss}). Label confirmed by the builder on ${today}.`, url: "" },
  };
  const simple = fixedChecklist({ reasonCode: row.dispute.reason_code, razorpayFacts: row.razorpay_facts, evidence: row.evidence });
  const label = {
    id: conf.id,
    decision: conf.decision,
    deciding_evidence: conf.deciding,
    case_type: "From outcome",
    label_status: `confirmed by the builder on ${today}`,
    checklist_decision: simple.call,
    checklist_reason: simple.reason,
  };
  return { caseRow: row, labelRow: label };
}
