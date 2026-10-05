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
