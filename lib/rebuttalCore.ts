import { z } from "zod";
import { DRAFT_LIMIT, citedIds, containsCardNumber, sentenceHasSource, splitSentences } from "./guardrails";

/**
 * Bank's rebuttal: a practice run where a second model call plays the cardholder's bank reviewer and attacks the merchant's draft.
 * This file is pure (no Node imports) so the browser can use it to apply a fix. The model call is in rebuttal.ts.
 * The model's schema mirrors the tool in prompts/bank-rebuttal-v1.md; a test keeps the two in step.
 */
export const VERDICTS = ["holds_up", "weak_spot", "likely_to_lose"] as const;
export type Verdict = (typeof VERDICTS)[number];
export const FIX_TYPES = ["reword", "add_document", "none"] as const;

export const rebuttalSchema = z.object({
  verdict: z.enum(VERDICTS),
  strongest_objection: z.string().min(1),
  objection_evidence_ids: z.array(z.string()).optional().default([]),
  weakest_sentence: z.string().nullable().optional().default(null),
  why_weak: z.string().nullable().optional().default(null),
  fix_type: z.enum(FIX_TYPES).optional().default("none"),
  rewritten_sentence: z.string().nullable().optional().default(null),
  document_needed: z.string().nullable().optional().default(null),
});
export type RebuttalOutput = z.infer<typeof rebuttalSchema>;

export interface RebuttalCheck {
  id: "RB1" | "RB2" | "RB3" | "RB4";
  rule: string;
  status: "pass" | "changed" | "na";
  message: string;
}

export type RebuttalFix = { kind: "reword"; sentence: string; newDraft: string } | { kind: "add_document"; document: string };

/** Everything the panel needs. Serialisable so it can cross from server to browser and sit in localStorage. */
export interface RebuttalView {
  verdict: Verdict;
  objection: string;
  evidenceIds: string[];
  weakSentence: string | null;
  whyWeak: string | null;
  fix: RebuttalFix | null;
  checks: RebuttalCheck[];
  /** The exact draft that was tested, so the screen can say when it has changed since. */
  forDraft: string;
  source: { label: string; model: string; promptVersion: string; date: string; live: boolean };
}

export const stripCites = (s: string) => s.replace(/\s*\[[^\]]*\]/g, "").replace(/\s+/g, " ").trim();
const norm = (s: string) => stripCites(s).toLowerCase().replace(/[.!?]+$/, "").trim();
export const sameDraft = (a: string, b: string) => a.replace(/\s+/g, " ").trim() === b.replace(/\s+/g, " ").trim();

/** The sentence of the draft the reviewer quoted, exactly as it sits in the draft (with its citations), or null. */
export function findSentence(draft: string, quoted: string | null | undefined): string | null {
  if (!quoted || !quoted.trim()) return null;
  const q = norm(quoted);
  if (!q) return null;
  const sentences = splitSentences(draft);
  const exact = sentences.find((s) => norm(s) === q);
  if (exact) return exact;
  // A model often quotes only part of a sentence (or half of one the draft joins with a quote mark). Accept that when the words are
  // really inside exactly one sentence of the draft and are long enough to be specific. We still point at the whole sentence.
  if (q.length < 30) return null;
  const inside = sentences.filter((s) => norm(s).includes(q));
  return inside.length === 1 ? inside[0] : null;
}

/**
 * Safety rules for the rebuttal (RB1 to RB4). They run in code after every answer, live or saved.
 * They only ever remove something unsafe (a quote that is not in the draft, a rewrite that cites a missing document or breaks the length limit).
 * The rebuttal never changes the call and never edits the draft by itself.
 */
export function checkRebuttal(
  out: RebuttalOutput,
  ctx: { draft: string; evidenceIds: string[]; source: RebuttalView["source"] },
): RebuttalView {
  const draft = ctx.draft.trim();
  const checks: RebuttalCheck[] = [];

  // RB4 only documents in this dispute are named
  const known = out.objection_evidence_ids.filter((id) => ctx.evidenceIds.includes(id));
  const unknown = [...new Set(out.objection_evidence_ids.filter((id) => !ctx.evidenceIds.includes(id)))];
  const evidenceIds = [...new Set(known)];

  // RB1 the quoted sentence is really in the draft
  let weak: string | null = null;
  let whyWeak: string | null = null;
  let rb1: RebuttalCheck;
  if (out.verdict !== "holds_up" && out.weakest_sentence) {
    const found = findSentence(draft, out.weakest_sentence);
    if (found) {
      weak = stripCites(found);
      whyWeak = out.why_weak;
      rb1 = { id: "RB1", rule: "The sentence it points at is in your draft", status: "pass", message: "Found in your draft." };
    } else {
      rb1 = { id: "RB1", rule: "The sentence it points at is in your draft", status: "changed", message: "The sentence it quoted is not in your draft, so it was hidden and no rewrite is offered." };
    }
  } else {
    rb1 = { id: "RB1", rule: "The sentence it points at is in your draft", status: "na", message: out.verdict === "holds_up" ? "No weak sentence to point at." : "No single sentence was named." };
  }

  // RB2 and RB3 a rewrite must cite real documents and fit the length limit
  let fix: RebuttalFix | null = null;
  let rb2: RebuttalCheck = { id: "RB2", rule: "A suggested rewrite cites real documents", status: "na", message: "No rewrite suggested." };
  let rb3: RebuttalCheck = { id: "RB3", rule: "A suggested rewrite fits the 1,000 character limit", status: "na", message: "No rewrite suggested." };
  if (out.verdict !== "holds_up" && out.fix_type === "reword" && out.rewritten_sentence?.trim()) {
    const rewrite = out.rewritten_sentence.trim();
    const quoted = findSentence(draft, out.weakest_sentence);
    const sentences = splitSentences(rewrite);
    const missing = [...new Set(citedIds(rewrite).filter((id) => id !== "Razorpay" && !ctx.evidenceIds.includes(id)))];
    const uncited = sentences.length === 0 || sentences.some((s) => !sentenceHasSource(s));
    if (!quoted) {
      rb2 = { id: "RB2", rule: "A suggested rewrite cites real documents", status: "changed", message: "The rewrite was dropped because the sentence it replaces was not found." };
    } else if (uncited || missing.length > 0 || containsCardNumber(rewrite)) {
      const why = missing.length > 0 ? `it cites ${missing.join(", ")}, which is not in this dispute` : containsCardNumber(rewrite) ? "it contains a card number" : "a sentence has no source";
      rb2 = { id: "RB2", rule: "A suggested rewrite cites real documents", status: "changed", message: `The rewrite was dropped: ${why}.` };
    } else {
      rb2 = { id: "RB2", rule: "A suggested rewrite cites real documents", status: "pass", message: "Every sentence in the rewrite cites a document in this dispute." };
      const newDraft = draft.replace(quoted, () => rewrite);
      if (newDraft.length > DRAFT_LIMIT) {
        rb3 = { id: "RB3", rule: "A suggested rewrite fits the 1,000 character limit", status: "changed", message: `The rewrite was dropped: your draft would be ${newDraft.length} characters.` };
      } else {
        rb3 = { id: "RB3", rule: "A suggested rewrite fits the 1,000 character limit", status: "pass", message: `The draft would be ${newDraft.length} of ${DRAFT_LIMIT} characters.` };
        fix = { kind: "reword", sentence: rewrite, newDraft };
      }
    }
  } else if (out.verdict !== "holds_up" && out.fix_type === "add_document" && out.document_needed?.trim()) {
    fix = { kind: "add_document", document: out.document_needed.trim() };
  }

  checks.push(rb1, rb2, rb3);
  checks.push(
    unknown.length > 0
      ? { id: "RB4", rule: "It names only documents in this dispute", status: "changed", message: `${unknown.join(", ")} ${unknown.length > 1 ? "are" : "is"} not in this dispute and was removed.` }
      : { id: "RB4", rule: "It names only documents in this dispute", status: evidenceIds.length > 0 ? "pass" : "na", message: evidenceIds.length > 0 ? "Every document it names is in this dispute." : "It named no documents." },
  );

  return {
    verdict: out.verdict,
    objection: out.strongest_objection.trim(),
    evidenceIds,
    weakSentence: weak,
    whyWeak,
    fix,
    checks,
    forDraft: draft,
    source: ctx.source,
  };
}

/** The draft with the suggested rewrite applied, or null if the draft has changed since the test or there is no rewrite. */
export function applyFix(draft: string, view: RebuttalView): string | null {
  if (view.fix?.kind !== "reword") return null;
  if (!sameDraft(draft, view.forDraft)) return null;
  return view.fix.newDraft;
}

export const VERDICT_LABEL: Record<Verdict, string> = {
  holds_up: "Holds up",
  weak_spot: "Has a weak spot",
  likely_to_lose: "Likely to lose",
};
