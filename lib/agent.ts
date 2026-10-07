import { createHash } from "node:crypto";
import { containsCardNumber, isFraudCode } from "./guardrails";
import { costUsd } from "./pricing";
import { DEMO_RATE_INR_PER_USD } from "./money";
import { PROMPT_VERSION } from "./prompt";
import { decisionSchema, type DecisionOutput } from "./schema";
import type { CaseData, Call, CheckView } from "./types";

import { ACCEPTANCE_OPTIONS, MAX_ADDED, MAX_EVIDENCE_CHARS, MAX_POLICY_CHARS, MAX_TITLE_CHARS, type Policy } from "./limits";

export { MAX_ADDED, MAX_EVIDENCE_CHARS, MAX_TITLE_CHARS };
export const MAX_TOKENS = 2000;

export interface AddedEvidence {
  id: string;
  title: string;
  content: string;
}

export interface ModelParams {
  model: string;
  system: string;
  /** Plain text, or content blocks (a document or image plus text) for reading uploads. */
  user: string | unknown[];
  toolName: string;
  toolDescription: string;
  toolSchema: Record<string, unknown>;
  maxTokens: number;
}
export interface ModelReply {
  /** The tool call's input, or undefined if the model did not call the tool. */
  input: unknown;
  tokensIn: number;
  tokensOut: number;
  /** The model that really answered, when it differs from the one asked for (a fallback). */
  model?: string;
}

export interface Deps {
  callModel: ((p: ModelParams) => Promise<ModelReply>) | null; // null = no API key
  model: string;
  system: string;
  toolSchema: Record<string, unknown>;
  getSaved: (caseId: string) => CheckView | undefined;
  now?: () => number;
  cache?: Map<string, { at: number; value: LiveOk }>;
  inrPerUsd?: number; // for the cost shown in Under the hood; defaults to the demo rate
}

export interface Meta {
  live: true;
  model: string;
  promptVersion: string;
  tokensIn: number;
  tokensOut: number;
  ms: number;
  costUsd: number;
  costInr: number;
  cached: boolean;
}
export type LiveOk = { status: "live"; view: CheckView; meta: Meta };
export type AnalyzeResult =
  | LiveOk
  | { status: "routed"; view: CheckView }
  | { status: "saved"; reason: string; message: string }
  | { status: "unavailable"; reason: string; message: string }
  | { status: "rejected"; code: "card_number" | "too_long" | "empty" | "too_many"; message: string; field?: string };

/** Evidence is data. Neutralise anything that could close or open our wrapper tags. */
export function escapeEvidence(text: string): string {
  return text.replace(/<\s*(\/?)\s*(evidence|merchant_policy|draft)/gi, (_m, slash: string, tag: string) => `&lt;${slash}${tag.toLowerCase()}`);
}

export { policyBlock, escapePolicy } from "./policyBlock";
import { policyBlock } from "./policyBlock";

export function buildUserMessage(c: CaseData, added: AddedEvidence[], policy?: Policy): string {
  const d = c.dispute;
  const items = [...c.evidence, ...added.map((a) => ({ id: a.id, content: `${a.title}: ${a.content}` }))];
  return [
    `Case ${c.id}`,
    `Reason code: ${d.reason_code} (${d.reason_description})`,
    `Amount: ${d.currency} ${(d.amount / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
    `Dispute raised: ${d.raised_on}`,
    `Customer claim: "${c.customer_claim}"`,
    `Merchant: ${c.merchant}`,
    `Dispute details: ${c.dispute_summary}`,
    `What Razorpay knows: ${c.razorpay_facts}`,
    ...policyBlock(policy),
    "Evidence:",
    ...items.map((e) => `<evidence id="${e.id}">${escapeEvidence(e.content)}</evidence>`),
  ].join("\n");
}

/** Check pasted evidence before it goes anywhere. */
export function validatePolicy(policy?: Policy): AnalyzeResult | null {
  if (!policy) return null;
  if (policy.text.length > MAX_POLICY_CHARS) return { status: "rejected", code: "too_long", message: `Keep your terms under ${MAX_POLICY_CHARS.toLocaleString()} characters.`, field: "policy" };
  if (containsCardNumber(policy.text)) return { status: "rejected", code: "card_number", message: "Remove the card number from your terms.", field: "policy" };
  return null;
}

export function validateAdded(added: { title: string; content: string }[]): AnalyzeResult | null {
  if (added.length > MAX_ADDED) return { status: "rejected", code: "too_many", message: `Add at most ${MAX_ADDED} documents.` };
  for (const a of added) {
    if (!a.title.trim() || !a.content.trim()) return { status: "rejected", code: "empty", message: "Give each document a title and some text." };
    if (a.title.length > MAX_TITLE_CHARS || a.content.length > MAX_EVIDENCE_CHARS)
      return { status: "rejected", code: "too_long", message: `Keep the title under ${MAX_TITLE_CHARS} and the text under ${MAX_EVIDENCE_CHARS.toLocaleString()} characters.` };
    if (containsCardNumber(a.title) || containsCardNumber(a.content))
      return { status: "rejected", code: "card_number", message: "Remove the card number and try again." };
  }
  return null;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function toCheckView(out: DecisionOutput, c: CaseData, meta: Meta): CheckView {
  const call: Call = out.decision === "accept" ? "fold" : out.decision === "route_to_fraud_cover" ? "shield" : out.decision;
  const d = c.dispute;
  let defensible: number | null = out.defensible_amount === null ? null : Math.round(out.defensible_amount * 100);
  if (defensible !== null && (defensible <= 0 || defensible >= d.amount)) defensible = null;
  const flagged = out.evidence_flags.filter((f) => f.flag === "contradiction").map((f) => `${f.evidence_id} conflicts with other evidence`);
  const missing = out.missing_evidence ? [out.missing_evidence] : [];
  return {
    caseId: c.id,
    call,
    confidence: cap(out.confidence),
    reason: out.reasoning_summary,
    decidingEvidence: out.deciding_evidence,
    missingEvidence: missing,
    contradictions: [...out.contradictions, ...flagged],
    draft: call === "fight" || call === "escalate" ? out.draft_response ?? "" : "",
    slots: out.evidence_slots.map((s) => ({ evidenceId: s.evidence_id, slot: s.slot })),
    ruleText: out.rule_applied,
    odds: out.win_probability_estimate,
    oddsNote: "AI estimate from this check. It is an estimate, not a promise.",
    defensibleAmount: defensible,
    getFirst: call === "escalate" ? out.missing_evidence ?? undefined : undefined,
    requestText: call === "escalate" && out.missing_evidence ? `We have a card dispute (${d.id}). Can you send: ${out.missing_evidence}` : undefined,
    tip: out.prevention_tip ?? "",
    economicsNote: out.economics_note || undefined,
    evidenceFlags: out.evidence_flags.map((f) => ({ evidenceId: f.evidence_id, flag: f.flag })),
    source: { label: `Live: ${meta.model}, prompt ${meta.promptVersion}`, model: meta.model, promptVersion: meta.promptVersion, date: new Date().toISOString().slice(0, 10), live: true },
    raw: out as unknown as Record<string, unknown>,
  };
}

export function shieldView(c: CaseData): CheckView {
  return {
    caseId: c.id,
    call: "shield",
    confidence: "High",
    reason: `Reason code ${c.dispute.reason_code} is a fraud code. Chargeback Shield handles it.`,
    decidingEvidence: [],
    missingEvidence: [],
    contradictions: [],
    draft: "",
    slots: [],
    ruleText: "",
    odds: 0,
    oddsNote: "",
    defensibleAmount: null,
    tip: "",
    source: { label: "Routed by a rule, no AI call", model: "none", promptVersion: PROMPT_VERSION, date: new Date().toISOString().slice(0, 10), live: false },
    raw: { decision: "route_to_fraud_cover", note: "Routed by safety rule R5 before any model call" },
  };
}

function cacheKey(deps: Deps, c: CaseData, added: AddedEvidence[], policy?: Policy): string {
  return createHash("sha256").update(JSON.stringify([deps.model, PROMPT_VERSION, c.id, added.map((a) => [a.title, a.content]), policy?.text.trim() ?? "", policy?.acceptance ?? ""])).digest("hex");
}

const TTL_MS = 60 * 60 * 1000;

/**
 * One check. Order matters: reject bad input, route fraud with no model call, use the cache,
 * call the model (retry once on an invalid answer), then fall back to the saved result.
 */
export async function analyze(c: CaseData, added: AddedEvidence[], deps: Deps, policy?: Policy): Promise<AnalyzeResult> {
  const bad = validateAdded(added) ?? validatePolicy(policy);
  if (bad) return bad;

  if (isFraudCode(c.dispute.reason_code)) return { status: "routed", view: shieldView(c) };

  const fallback = (reason: string, message: string): AnalyzeResult =>
    added.length === 0 && deps.getSaved(c.id)
      ? { status: "saved", reason, message }
      : { status: "unavailable", reason, message: reason === "no_key" ? "We couldn't run the check. Decide manually." : "We couldn't run the check. Decide manually. The AI model was busy or too slow, so you can also try Re-run check again in a moment." };

  if (!deps.callModel) return fallback("no_key", "The live check is off in this demo, so you are seeing the saved result.");

  const now = deps.now ?? Date.now;
  const key = cacheKey(deps, c, added, policy);
  const hit = deps.cache?.get(key);
  if (hit && now() - hit.at < TTL_MS) return { ...hit.value, meta: { ...hit.value.meta, cached: true } };

  const started = now();
  let tokensIn = 0;
  let tokensOut = 0;
  let answeredBy = deps.model;
  for (let attempt = 0; attempt < 2; attempt++) {
    let reply: ModelReply;
    try {
      reply = await deps.callModel({
        model: deps.model,
        system: deps.system,
        user: buildUserMessage(c, added, policy),
        toolName: "record_dispute_decision",
        toolDescription: "Record your recommendation for this dispute.",
        toolSchema: deps.toolSchema,
        maxTokens: MAX_TOKENS,
      });
    } catch (err) {
      console.error("[llm] call failed:", err instanceof Error ? err.message : String(err));
      return fallback("call_failed", "The AI model was busy or too slow, so you are seeing the saved result. Try Re-run check again in a moment.");
    }
    tokensIn += reply.tokensIn;
    tokensOut += reply.tokensOut;
    answeredBy = reply.model ?? deps.model;
    const parsed = decisionSchema.safeParse(reply.input);
    if (parsed.success) {
      const usd = costUsd(tokensIn, tokensOut, answeredBy);
      const meta: Meta = { live: true, model: answeredBy, promptVersion: PROMPT_VERSION, tokensIn, tokensOut, ms: now() - started, costUsd: usd, costInr: usd * (deps.inrPerUsd ?? DEMO_RATE_INR_PER_USD), cached: false };
      const value: LiveOk = { status: "live", view: toCheckView(parsed.data, c, meta), meta };
      deps.cache?.set(key, { at: now(), value });
      if (deps.cache && deps.cache.size > 200) deps.cache.delete(deps.cache.keys().next().value as string);
      return value;
    }
  }
  return fallback("invalid_output", "The live answer wasn't usable, so you are seeing the saved result.");
}
