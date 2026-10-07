import { createHash } from "node:crypto";
import { buildUserMessage, validateAdded, validatePolicy, type AddedEvidence, type ModelParams, type ModelReply } from "./agent";
import { containsCardNumber, isFraudCode } from "./guardrails";
import type { Policy } from "./limits";
import { DEFAULT_REBUTTAL_TOKENS } from "./limits";
import { costUsd } from "./pricing";
import { DEMO_RATE_INR_PER_USD } from "./money";
import { REBUTTAL_PROMPT_VERSION, REBUTTAL_TOOL } from "./prompt";
import { checkRebuttal, rebuttalSchema, sameDraft, type RebuttalOutput, type RebuttalView } from "./rebuttalCore";
import type { CaseData } from "./types";

export const MAX_REBUTTAL_DRAFT_CHARS = 2000;

export interface SavedRebuttal {
  output: RebuttalOutput;
  /** The draft this example was written for. It is only shown while the draft on screen is the same. */
  forDraft: string;
  label: string;
}

export interface RebuttalDeps {
  callModel: ((p: ModelParams) => Promise<ModelReply>) | null; // null = no API key
  model: string;
  system: string;
  toolSchema: Record<string, unknown>;
  getSaved: (caseId: string) => SavedRebuttal | undefined;
  ruleText: (code: string) => string | undefined;
  now?: () => number;
  cache?: Map<string, { at: number; value: RebuttalLive }>;
  inrPerUsd?: number;
}

export interface RebuttalMeta {
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
export type RebuttalLive = { status: "live"; view: RebuttalView; meta: RebuttalMeta };
export type RebuttalResult =
  | RebuttalLive
  | { status: "saved"; view: RebuttalView; reason: string; message: string }
  | { status: "unavailable"; reason: string; message: string }
  | { status: "rejected"; code: "card_number" | "too_long" | "empty" | "too_many"; message: string; field?: string };

/** The draft is data too. Neutralise anything that could close or open our wrapper tag. */
export function escapeDraft(text: string): string {
  return text.replace(/<\s*(\/?)\s*draft/gi, "&lt;$1draft");
}

export function buildRebuttalMessage(c: CaseData, added: AddedEvidence[], policy: Policy | undefined, draft: string, ruleText?: string): string {
  return [
    buildUserMessage(c, added, policy),
    ruleText ? `Visa rule for ${c.dispute.reason_code}: ${ruleText}` : `Visa reason code ${c.dispute.reason_code}: ${c.dispute.reason_description}`,
    "Merchant's draft:",
    `<draft>${escapeDraft(draft)}</draft>`,
  ].join("\n");
}

function cacheKey(deps: RebuttalDeps, c: CaseData, added: AddedEvidence[], policy: Policy | undefined, draft: string): string {
  return createHash("sha256")
    .update(JSON.stringify([deps.model, REBUTTAL_PROMPT_VERSION, c.id, added.map((a) => [a.title, a.content]), policy?.text.trim() ?? "", policy?.acceptance ?? "", draft.trim()]))
    .digest("hex");
}

const TTL_MS = 60 * 60 * 1000;
const today = () => new Date().toISOString().slice(0, 10);

/**
 * One practice run. Same order as the main check: reject bad input, skip fraud, use the cache,
 * call the model (retry once on an invalid answer), then fall back to the saved example if the draft is unchanged.
 */
export async function analyzeRebuttal(c: CaseData, added: AddedEvidence[], draft: string, deps: RebuttalDeps, policy?: Policy): Promise<RebuttalResult> {
  const bad = validateAdded(added) ?? validatePolicy(policy);
  if (bad && bad.status === "rejected") return bad;
  const text = draft.trim();
  if (!text) return { status: "rejected", code: "empty", message: "Write a response first, then test it.", field: "draft" };
  if (text.length > MAX_REBUTTAL_DRAFT_CHARS) return { status: "rejected", code: "too_long", message: "Shorten the response to 1,000 characters first.", field: "draft" };
  if (containsCardNumber(text)) return { status: "rejected", code: "card_number", message: "Remove the card number from the response.", field: "draft" };
  if (isFraudCode(c.dispute.reason_code)) return { status: "unavailable", reason: "fraud", message: "Fraud disputes go to Chargeback Shield. There is no response to test." };

  const evidenceIds = [...c.evidence.map((e) => e.id), ...added.map((a) => a.id)];

  const fallback = (reason: string, message: string): RebuttalResult => {
    const s = deps.getSaved(c.id);
    if (s && added.length === 0 && sameDraft(s.forDraft, text)) {
      const view = checkRebuttal(s.output, { draft: text, evidenceIds, source: { label: s.label, model: "none", promptVersion: REBUTTAL_PROMPT_VERSION, date: "2026-10-07", live: false } });
      return { status: "saved", view, reason, message };
    }
    const offline = reason === "no_key";
    return {
      status: "unavailable",
      reason,
      message: offline
        ? s
          ? "The live test is off in this demo, and the saved example only fits the original draft."
          : "The live test is off in this demo. Check the response against your documents yourself."
        : "The test didn't work just now. Try again in a moment, or check the response against your documents yourself.",
    };
  };

  if (!deps.callModel) return fallback("no_key", "The live test is off in this demo, so you are seeing a saved example.");

  const now = deps.now ?? Date.now;
  const key = cacheKey(deps, c, added, policy, text);
  const hit = deps.cache?.get(key);
  if (hit && now() - hit.at < TTL_MS) return { ...hit.value, meta: { ...hit.value.meta, cached: true } };

  const started = now();
  let tokensIn = 0;
  let tokensOut = 0;
  for (let attempt = 0; attempt < 2; attempt++) {
    let reply: ModelReply;
    try {
      reply = await deps.callModel({
        model: deps.model,
        system: deps.system,
        user: buildRebuttalMessage(c, added, policy, text, deps.ruleText(c.dispute.reason_code)),
        toolName: REBUTTAL_TOOL,
        toolDescription: "Record the bank reviewer's pushback on the merchant's draft.",
        toolSchema: deps.toolSchema,
        maxTokens: DEFAULT_REBUTTAL_TOKENS,
      });
    } catch (err) {
      console.error("[llm] rebuttal call failed:", err instanceof Error ? err.message : String(err));
      return fallback("call_failed", "The live test didn't answer, so you are seeing a saved example.");
    }
    tokensIn += reply.tokensIn;
    tokensOut += reply.tokensOut;
    const parsed = rebuttalSchema.safeParse(reply.input);
    if (parsed.success) {
      const usd = costUsd(tokensIn, tokensOut, deps.model);
      const meta: RebuttalMeta = { live: true, model: deps.model, promptVersion: REBUTTAL_PROMPT_VERSION, tokensIn, tokensOut, ms: now() - started, costUsd: usd, costInr: usd * (deps.inrPerUsd ?? DEMO_RATE_INR_PER_USD), cached: false };
      const view = checkRebuttal(parsed.data, {
        draft: text,
        evidenceIds,
        source: { label: `Live practice run: ${deps.model}, prompt ${REBUTTAL_PROMPT_VERSION}`, model: deps.model, promptVersion: REBUTTAL_PROMPT_VERSION, date: today(), live: true },
      });
      const value: RebuttalLive = { status: "live", view, meta };
      deps.cache?.set(key, { at: now(), value });
      if (deps.cache && deps.cache.size > 200) deps.cache.delete(deps.cache.keys().next().value as string);
      return value;
    }
  }
  return fallback("invalid_output", "The live answer wasn't usable, so you are seeing a saved example.");
}
