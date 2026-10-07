/**
 * Three small AI helpers around the main check: shorten a long draft, read key facts from each document,
 * and suggest one change from past results. This file is the pure part (schemas, checks, no-AI fallbacks),
 * so it is safe in the browser and easy to test. The model calls live in assist.ts.
 *
 * The rule for all three: the model proposes, code checks, the merchant decides.
 */
import { z } from "zod";
import { DRAFT_LIMIT, citedIds, containsCardNumber, sentenceHasSource, splitSentences } from "./guardrails";
import type { Summary } from "./results";

// ---------------------------------------------------------------- shorten

/** Aim below the limit so a small edit by the merchant does not push it over again. */
export const SHORTEN_TARGET = 900;
export const SHORTEN_TOOL = "record_shortened_draft";
export const shortenSchema = z.object({ draft: z.string() });
export const SHORTEN_TOOL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["draft"],
  properties: { draft: { type: "string", description: "The shortened response, 900 characters or fewer, a [E#] or [Razorpay] tag after every sentence" } },
};

const stripCites = (s: string) => s.replace(/\[[^\]]*\]/g, " ");
/** Numbers as plain digit strings ("1,200.50" becomes "1200.50"), ignoring the digits inside [E3] tags. */
export function numbersIn(s: string): string[] {
  return (stripCites(s).match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map((n) => n.replace(/,/g, ""));
}

export interface ShortenCheck {
  original: string;
  shortened: string;
  evidenceIds: string[];
  /** Everything the model was allowed to take numbers from: the draft, the documents, the dispute facts. */
  known: string;
}

/** Why a shortened draft is not acceptable, or null when it is. */
export function checkShortened({ original, shortened, evidenceIds, known }: ShortenCheck): string | null {
  const text = shortened.trim();
  if (!text) return "empty";
  if (text.length > DRAFT_LIMIT) return "still too long";
  if (text.length >= original.trim().length) return "not shorter";
  if (containsCardNumber(text)) return "card number";
  const sentences = splitSentences(text);
  if (sentences.length === 0) return "no sentences";
  if (!sentences.every(sentenceHasSource)) return "a sentence has no source";
  const allowed = new Set([...evidenceIds, "Razorpay"]);
  if (!citedIds(text).every((id) => allowed.has(id))) return "cites a document that does not exist";
  const seen = new Set(numbersIn(known));
  if (!numbersIn(text).every((n) => seen.has(n))) return "a number that is not in the case";
  return null;
}

/** The no-AI fallback: keep whole sentences from the start until the next one would not fit. */
export function trimToLimit(draft: string, limit = DRAFT_LIMIT): { draft: string; dropped: number } | null {
  const sentences = splitSentences(draft);
  const kept: string[] = [];
  for (const s of sentences) {
    const next = [...kept, s].join(" ");
    if (next.length > limit) break;
    kept.push(s);
  }
  if (kept.length === 0) return null;
  return { draft: kept.join(" "), dropped: sentences.length - kept.length };
}

export type ShortenResult =
  | { status: "ok"; draft: string; method: "ai"; model: string; promptVersion: string; cached: boolean }
  | { status: "ok"; draft: string; method: "trim"; dropped: number; message: string }
  | { status: "unavailable"; message: string }
  | { status: "rejected"; message: string };

// ---------------------------------------------------------------- key facts

export const KEYFACTS_TOOL = "record_key_facts";
export const keyFactsSchema = z.object({
  documents: z.array(z.object({ id: z.string(), facts: z.array(z.object({ fact: z.string(), quote: z.string() })) })),
});
export const KEYFACTS_TOOL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["documents"],
  properties: {
    documents: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "facts"],
        properties: {
          id: { type: "string", description: "The document's ID, for example E1" },
          facts: {
            type: "array",
            maxItems: 3,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["fact", "quote"],
              properties: {
                fact: { type: "string", maxLength: 160, description: "One short line: what the document shows that matters for the dispute" },
                quote: { type: "string", description: "An exact, word-for-word excerpt from that document that supports the fact" },
              },
            },
          },
        },
      },
    },
  },
};

export interface KeyFactDoc {
  id: string;
  facts: { fact: string; quote: string }[];
}

const norm = (s: string) => s.toLowerCase().replace(/[“”"‘’'`]/g, "").replace(/\s+/g, " ").trim();

/**
 * Keep only facts the document itself backs up: the quote must appear in the document word for word,
 * and any number in the fact must be a number in the document. A fact that fails either test is dropped.
 */
export function verifyKeyFacts(out: z.infer<typeof keyFactsSchema>, docs: { id: string; text: string }[]): { docs: KeyFactDoc[]; dropped: number } {
  const byId = new Map(docs.map((d) => [d.id, d.text]));
  const done = new Set<string>();
  const result: KeyFactDoc[] = [];
  let dropped = 0;
  for (const d of out.documents) {
    const text = byId.get(d.id);
    if (text === undefined || done.has(d.id)) {
      dropped += d.facts.length;
      continue;
    }
    done.add(d.id);
    const haystack = norm(text);
    const have = new Set(numbersIn(text));
    const kept: { fact: string; quote: string }[] = [];
    for (const f of d.facts) {
      const fact = f.fact.trim();
      const quote = f.quote.trim();
      const ok =
        kept.length < 3 &&
        fact.length > 0 &&
        fact.length <= 200 &&
        quote.length >= 6 &&
        haystack.includes(norm(quote)) &&
        numbersIn(fact.replace(/\bE\d+\b/g, "")).every((n) => have.has(n)) &&
        !containsCardNumber(fact);
      if (ok) kept.push({ fact, quote });
      else dropped += 1;
    }
    if (kept.length) result.push({ id: d.id, facts: kept });
  }
  // Show in document order, whatever order the model used.
  const order = new Map(docs.map((d, i) => [d.id, i]));
  result.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return { docs: result, dropped };
}

export type KeyFactsResult =
  | { status: "live"; docs: KeyFactDoc[]; dropped: number; model: string; promptVersion: string; cached: boolean }
  | { status: "saved"; docs: KeyFactDoc[]; label: string; reason: string; message: string }
  | { status: "unavailable"; message: string }
  | { status: "rejected"; message: string };

// ---------------------------------------------------------------- learning from outcomes

export const LEARN_TOOL = "record_learning_suggestion";
export const LEARN_KINDS = ["terms", "checkout", "evidence", "fold_rule"] as const;
export const KIND_LABEL: Record<(typeof LEARN_KINDS)[number], string> = {
  terms: "Change your terms",
  checkout: "Change your checkout",
  evidence: "Keep better evidence",
  fold_rule: "Fold sooner",
};

export const learnSchema = z.object({
  headline: z.string().min(1).max(140),
  finding: z.string().min(1).max(300),
  cites: z.array(z.object({ code: z.string(), won: z.number().int(), fights: z.number().int() })).min(1).max(3),
  suggestion: z.object({ kind: z.enum(LEARN_KINDS), text: z.string().min(1).max(320) }),
  note: z.string().max(200),
});
export type LearnOutput = z.infer<typeof learnSchema>;
export const LEARN_TOOL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["headline", "finding", "cites", "suggestion", "note"],
  properties: {
    headline: { type: "string", maxLength: 140, description: "The one pattern, as a short sentence" },
    finding: { type: "string", maxLength: 300, description: "What the numbers show, using only the numbers given" },
    cites: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["code", "won", "fights"],
        properties: {
          code: { type: "string", description: "A reason code from the input, for example 13.2" },
          won: { type: "integer", description: "The exact number of fights won for that code" },
          fights: { type: "integer", description: "The exact number of fights for that code" },
        },
      },
    },
    suggestion: {
      type: "object",
      additionalProperties: false,
      required: ["kind", "text"],
      properties: {
        kind: { type: "string", enum: [...LEARN_KINDS] },
        text: { type: "string", maxLength: 320, description: "One concrete change the merchant can make" },
      },
    },
    note: { type: "string", maxLength: 200, description: "Say if the sample is small, in plain words" },
  },
};

/** Only counts go to the model: no names, no amounts, no documents. */
export interface LearnStats {
  settled: number;
  fights: number;
  won: number;
  onTimeRate: number | null;
  byCode: { code: string; disputes: number; fights: number; won: number }[];
  byConfidence: { confidence: string; n: number; won: number }[];
  fold: { n: number; wrong: number };
  escalated: { n: number; fought: number; won: number };
}

export function compactStats(s: Summary): LearnStats {
  const r = (n: number | null) => (n === null ? null : Math.round(n * 100) / 100);
  return {
    settled: s.settled,
    fights: s.fights,
    won: s.won,
    onTimeRate: r(s.onTimeRate),
    byCode: s.byCode.map((c) => ({ code: c.code, disputes: c.disputes, fights: c.fights, won: c.won })),
    byConfidence: s.byConfidence.map((c) => ({ confidence: c.confidence, n: c.n, won: c.won })),
    fold: { n: s.foldCalls.n, wrong: s.foldCalls.wrong },
    escalated: { n: s.escalated.n, fought: s.escalated.fought, won: s.escalated.won },
  };
}

const count = z.number().int().min(0).max(100000);
/** The browser sends these counts, so the server checks their shape before using them. */
export const learnStatsSchema = z.object({
  settled: count,
  fights: count,
  won: count,
  onTimeRate: z.number().min(0).max(1).nullable(),
  byCode: z.array(z.object({ code: z.string().regex(/^1[0-9]\.[0-9]$/), disputes: count, fights: count, won: count })).max(12),
  byConfidence: z.array(z.object({ confidence: z.enum(["High", "Medium", "Low"]), n: count, won: count })).max(3),
  fold: z.object({ n: count, wrong: count }),
  escalated: z.object({ n: count, fought: count, won: count }),
});

/** Why a suggestion is not acceptable, or null. Every number it cites must match the counts it was given. */
export function checkLearning(out: LearnOutput, stats: LearnStats): string | null {
  for (const c of out.cites) {
    const row = stats.byCode.find((r) => r.code === c.code);
    if (!row) return `cites ${c.code}, which is not in the counts`;
    if (row.fights !== c.fights || row.won !== c.won) return `cites ${c.code} with numbers that do not match`;
  }
  if (/\b(guarantee[sd]?|will win|always win|tax advice|legal advice)\b/i.test(`${out.headline} ${out.finding} ${out.suggestion.text} ${out.note}`)) return "promises an outcome or gives advice it should not";
  return null;
}

/** Fewer than this many fights on a code is a hint, not a pattern. */
export const SMALL_SAMPLE = 5;
export const smallSample = (out: LearnOutput) => out.cites.some((c) => c.fights < SMALL_SAMPLE);

export type LearnResult =
  | { status: "live"; output: LearnOutput; model: string; promptVersion: string; cached: boolean }
  | { status: "saved"; output: LearnOutput; label: string; reason: string; message: string }
  | { status: "unavailable"; message: string }
  | { status: "rejected"; message: string };
