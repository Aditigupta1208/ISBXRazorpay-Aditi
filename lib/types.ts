export type Call = "fight" | "fold" | "escalate" | "shield";

export interface Dispute {
  id: string;
  payment_id: string;
  amount: number; // subunits (cents)
  currency: string;
  network: string;
  reason_code: string;
  reason_description: string;
  phase: string;
  status: string;
  raised_on: string;
  respond_by_hours_left: number;
}

export interface Evidence {
  id: string;
  content: string;
}

export interface CaseData {
  id: string;
  dispute: Dispute;
  merchant: string;
  customer_claim: string;
  dispute_summary: string;
  razorpay_facts: string;
  evidence: Evidence[];
  source: { pattern: string; url: string };
}

export interface SavedResult {
  caseId: string;
  call: Call;
  confidence?: string;
  decidingEvidence: string[];
  reason?: string;
  draft?: string;
  slots: { evidenceId: string; slot: string }[];
  /** Shown to the merchant, e.g. "Saved result: ChatGPT 5.6 Terra, prompt v1" */
  sourceLabel: string;
}

/** Everything the check panel needs, serialisable so it can cross from server to browser. */
export interface CheckView {
  caseId: string;
  call: Call;
  confidence: string;
  reason: string;
  decidingEvidence: string[];
  missingEvidence: string[];
  contradictions: string[];
  draft: string;
  slots: { evidenceId: string; slot: string }[];
  ruleText: string;
  /** 0 to 1. Saved v1 results have no estimate, so it is derived from confidence and labelled. */
  odds: number;
  oddsNote: string;
  /** Subunits; null when the full amount is defensible. */
  defensibleAmount: number | null;
  getFirst?: string;
  requestText?: string;
  tip: string;
  economicsNote?: string;
  evidenceFlags?: { evidenceId: string; flag: string }[];
  source: { label: string; model: string; promptVersion: string; date: string; live: boolean };
  raw: Record<string, unknown>;
}
