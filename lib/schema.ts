import { z } from "zod";

/** Mirrors the tool schema in prompts/dispute-agent-v2.3.md. A test keeps the two in step. */
export const SLOTS = [
  "shipping_proof",
  "billing_proof",
  "cancellation_proof",
  "customer_communication",
  "proof_of_service",
  "explanation_letter",
  "refund_confirmation",
  "access_activity_log",
  "refund_cancellation_policy",
  "term_and_conditions",
  "others",
] as const;

export const FLAGS = ["contradiction", "unreadable", "instruction_like"] as const;
export const DECISIONS = ["fight", "accept", "escalate", "route_to_fraud_cover"] as const;

export const decisionSchema = z.object({
  decision: z.enum(DECISIONS),
  confidence: z.enum(["high", "medium", "low"]),
  deciding_evidence: z.array(z.string()),
  missing_evidence: z.string().nullable().optional().default(null),
  reasoning_summary: z.string().min(1),
  rule_applied: z.string(),
  contradictions: z.array(z.string()).optional().default([]),
  economics_note: z.string().optional().default(""),
  win_probability_estimate: z.number().min(0).max(1),
  defensible_amount: z.number().nonnegative().nullable().optional().default(null),
  evidence_flags: z.array(z.object({ evidence_id: z.string(), flag: z.enum(FLAGS) })).optional().default([]),
  evidence_slots: z.array(z.object({ evidence_id: z.string(), slot: z.enum(SLOTS) })),
  // No max length here on purpose: an over-long draft is caught by safety rule R6, which tells the merchant to shorten it.
  draft_response: z.string().nullable().optional().default(null),
  prevention_tip: z.string().nullable().optional().default(null),
});

export type DecisionOutput = z.infer<typeof decisionSchema>;
