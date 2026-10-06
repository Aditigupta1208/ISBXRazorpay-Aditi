/**
 * The fixed-checklist baseline, as code.
 * This is the "no AI" competitor for the Evals page: it reads only WHICH KINDS of document are attached (by keywords),
 * never what they say, and applies one fixed rule per reason code. It can answer Fight or Accept, never Escalate.
 * The rules are the ones in data/labels.json "checklist_rules". A test checks that this code reproduces the stored
 * checklist answers on all 20 cases, so the baseline is not hand-picked.
 */
export type BaselineCall = "Fight" | "Accept" | "n/a";

export type DocKind = "delivery_or_usage" | "usage_log" | "terms_record" | "contract_or_description" | "refund_record" | "cancellation_policy";

const KINDS: Record<Exclude<DocKind, "refund_record">, RegExp> = {
  // delivery or usage proof (13.1): delivery email, check-in, completion sheet, access or login logs, hosting logs
  delivery_or_usage: /\b(deployed|check-in register|completion sheet|delivered files|delivery (email|record)|hosting log|login log|access log|usage (log|summary)|logged in)\b/i,
  usage_log: /\b(login log|usage (log|summary)|access log|logged in)\b/i,
  terms_record: /\b(terms acceptance|acceptance record|checkout record|ticked)\b/i,
  contract_or_description: /\b(scope of work|quote|pricing page|sales page|product page|description page)\b/i,
  cancellation_policy: /\b(cancell?ations?\b.*\b(non-refundable|refund)|cancellation policy)\b/i,
};

export interface BaselineInput {
  reasonCode: string;
  razorpayFacts: string;
  evidence: { id: string; content: string }[];
}

export interface BaselineResult {
  call: BaselineCall;
  reason: string;
  found: DocKind[];
}

/** Razorpay shows a processed refund (and not "no refund"). */
export function hasRefundRecord(facts: string): boolean {
  return /\brefund\b[^.]*\bprocessed\b/i.test(facts) && !/\bno refund\b/i.test(facts);
}

export function kindsPresent(i: BaselineInput): DocKind[] {
  const out = new Set<DocKind>();
  for (const e of i.evidence) {
    for (const [k, re] of Object.entries(KINDS)) if (re.test(e.content)) out.add(k as DocKind);
  }
  if (hasRefundRecord(i.razorpayFacts)) out.add("refund_record");
  return [...out];
}

export function fixedChecklist(i: BaselineInput): BaselineResult {
  const found = kindsPresent(i);
  const has = (k: DocKind) => found.includes(k);
  const fight = (reason: string): BaselineResult => ({ call: "Fight", reason, found });
  const accept = (reason: string): BaselineResult => ({ call: "Accept", reason, found });
  switch (i.reasonCode) {
    case "13.1":
      return has("delivery_or_usage") ? fight("Delivery or usage proof is attached.") : accept("No delivery or usage proof.");
    case "13.2":
      return has("terms_record") && has("usage_log") ? fight("Terms record and usage log are attached.") : accept("Terms record or usage log is missing.");
    case "13.3":
      return has("contract_or_description") ? fight("A contract, quote or description page is attached.") : accept("No contract or description attached.");
    case "13.6":
      return has("refund_record") ? fight("Razorpay shows a processed refund.") : accept("No refund record.");
    case "13.7":
      return has("cancellation_policy") ? fight("A cancellation policy is attached.") : accept("No cancellation policy attached.");
    default:
      return { call: "n/a", reason: "Outside the five non-fraud reasons.", found };
  }
}
