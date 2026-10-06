/**
 * Misses become eval cases.
 * When what happened contradicts the advisor's call (it said Fight and the merchant lost, or it said Fold and the merchant
 * fought and won), the dispute is a candidate for the eval set. This builds a file in the shape of data/cases.json with a
 * PROPOSED label. A person must confirm the label before it is added to data/labels.json. Nothing is sent anywhere.
 */
export type MissKind = "wrong_fight" | "wrong_fold";

export interface MissInput {
  call: "fight" | "fold" | "escalate" | "shield";
  action: "submit" | "fold" | undefined;
  outcome: "won" | "lost" | undefined;
}

/** Escalate is never a miss: it hands the decision to a person. */
export function missKind(i: MissInput): MissKind | null {
  if (i.action !== "submit" || !i.outcome) return null;
  if (i.call === "fight" && i.outcome === "lost") return "wrong_fight";
  if (i.call === "fold" && i.outcome === "won") return "wrong_fold";
  return null;
}

/** Mask email addresses, phone-like numbers and long digit runs (card, account or reference numbers). */
export function redact(text: string): string {
  return text
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[email]")
    .replace(/\+?\d[\d\s().-]{8,}\d/g, (m) => (/\d{9,}/.test(m.replace(/\D/g, "")) ? "[number]" : m));
}

export interface MissCaseInput extends MissInput {
  caseId: string;
  reasonCode: string;
  reasonDescription: string;
  currency: string;
  customerClaim: string;
  razorpayFacts: string;
  evidence: { id: string; title?: string; content: string }[];
  confidence: string;
  decidingEvidence: string[];
  reason: string;
}

export function buildMissCase(i: MissCaseInput, today = new Date()) {
  const kind = missKind(i);
  if (!kind) return null;
  const proposed = kind === "wrong_fight" ? "Accept" : "Fight";
  return {
    status: "NEEDS HUMAN REVIEW: confirm or change proposed_label before adding to data/labels.json",
    created: today.toISOString().slice(0, 10),
    source_case: i.caseId,
    miss: kind === "wrong_fight" ? "Advisor said Fight; the dispute was lost." : "Advisor said Fold; the merchant fought and won.",
    proposed_label: proposed,
    case: {
      dispute: { reason_code: i.reasonCode, reason_description: i.reasonDescription, currency: i.currency, network: "Visa", phase: "chargeback" },
      customer_claim: redact(i.customerClaim),
      razorpay_facts: redact(i.razorpayFacts),
      evidence: i.evidence.map((e) => ({ id: e.id, ...(e.title ? { title: redact(e.title) } : {}), content: redact(e.content) })),
    },
    advisor: { call: i.call, confidence: i.confidence, deciding_evidence: i.decidingEvidence, reason: redact(i.reason) },
    merchant_result: { action: i.action, outcome: i.outcome },
    note: "Names, email addresses and long numbers are masked. Check the text for anything else that identifies a person before sharing.",
  };
}
