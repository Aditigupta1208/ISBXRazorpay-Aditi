/** Safety rules R1 to R9 (docs/pm/05-data-and-stack.md). Pure functions: run on the server and in the browser. */
import { CHECKLISTS } from "./evidenceChecklist";
export type Status = "pass" | "changed" | "blocked" | "na";
export type FinalCall = "fight" | "fold" | "escalate" | "shield";

export interface GuardrailLine {
  id: "R1" | "R2" | "R3" | "R4" | "R5" | "R6" | "R7" | "R8" | "R9";
  rule: string;
  status: Status;
  message: string;
}

export interface GuardrailInput {
  reasonCode: string;
  call: FinalCall; // the model's call
  confidence?: string;
  decidingEvidence: string[];
  missingEvidence: string[];
  evidenceIds: string[];
  evidenceTexts: string[];
  draft: string;
  documentCount: number; // evidence items mapped to a Razorpay slot
  figures?: { key: string; supported: boolean }[]; // amounts, dates and counts in the draft (lib/factCheck.ts), for R9
  confirmedFigures?: string[]; // figures the merchant ticked as checked
  slots?: { evidenceId: string; slot: string }[]; // which slot each document was placed in (needed for R8)
  schemaOk: boolean;
}

export interface GuardrailResult {
  lines: GuardrailLine[];
  finalCall: FinalCall;
  changedReason?: string; // shown as "Changed by safety rule: ..."
  submitBlockers: string[];
}

export const DRAFT_LIMIT = 1000;
const CITE = "\\[(?:E\\d+|Razorpay)(?:\\s*,\\s*(?:E\\d+|Razorpay))*\\]";
const ENDS_WITH_CITE = new RegExp(`(?:${CITE}\\s*)+[.!?]?\\s*$`);
const ANY_CITE = new RegExp(CITE, "g");

const ABBREV = /(?:^|[\s(])(?:dr|mr|mrs|ms|vs|inc|ltd|approx|e\.g|i\.e)\.$/i;

/**
 * Split a draft into sentences; citations after the full stop stay with their sentence.
 * A full stop only ends a sentence when a space, the end of the text or a citation follows it,
 * so amounts like "USD 1,200.50" and "3.5%" stay whole. Common abbreviations ("Dr.", "e.g.") do not end one either.
 */
export function splitSentences(draft: string): string[] {
  const raw = draft.match(/(?:[^.!?]|[.!?](?![\s\[]|$))+(?:[.!?]+(?:\s*\[[^\]]+\])*)?/g) ?? [];
  const merged: string[] = [];
  let carry = "";
  for (const part of raw) {
    const text = (carry ? `${carry} ${part.trim()}` : part.trim()).trim();
    const bare = text.replace(/\s*\[[^\]]*\]\s*$/, "");
    if (ABBREV.test(bare) && !/\[[^\]]*\]\s*$/.test(text)) {
      carry = text;
      continue;
    }
    carry = "";
    merged.push(text);
  }
  if (carry) merged.push(carry);
  return merged.filter((s) => s.replace(/\[[^\]]*\]/g, "").trim().length > 0);
}

/**
 * Drop sentences that repeat an earlier one word for word (ignoring case, spacing and the citation).
 * Small live models sometimes loop on a sentence. This only removes exact repeats, so it never adds or changes a claim.
 */
export function dedupeSentences(draft: string): string {
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const sent of splitSentences(draft)) {
    const key = sent.replace(/\[[^\]]*\]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (key && seen.has(key)) continue;
    seen.add(key);
    kept.push(sent);
  }
  return kept.join(" ");
}

export function citedIds(text: string): string[] {
  const ids: string[] = [];
  for (const m of text.matchAll(ANY_CITE)) {
    for (const part of m[0].slice(1, -1).split(",")) ids.push(part.trim());
  }
  return ids;
}

export function sentenceHasSource(s: string): boolean {
  return ENDS_WITH_CITE.test(s);
}

/** Luhn check for card numbers. */
export function luhn(digits: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

/** True when the text holds a 13 to 19 digit number (spaces or dashes allowed) that passes the Luhn check. */
export function containsCardNumber(text: string): boolean {
  const matches = text.match(/\b(?:\d[ -]?){13,19}\b/g) ?? [];
  return matches.some((m) => {
    const d = m.replace(/\D/g, "");
    return d.length >= 13 && d.length <= 19 && luhn(d);
  });
}

/** R8: slots that hold a key document for this reason code. Empty when the code has no checklist. */
export function keySlotsFor(code: string): string[] {
  const c = CHECKLISTS[code];
  return c ? [...new Set(c.key.flatMap((r) => r.slots))] : [];
}

export function isFraudCode(code: string): boolean {
  return code.startsWith("10.");
}

export function evaluateGuardrails(i: GuardrailInput): GuardrailResult {
  const lines: GuardrailLine[] = [];
  let finalCall: FinalCall = i.call;
  let changedReason: string | undefined;
  const blockers: string[] = [];

  // R5 fraud routing (runs before any model call in the live app)
  if (isFraudCode(i.reasonCode)) {
    finalCall = "shield";
    changedReason = "Fraud disputes go to Chargeback Shield";
    lines.push({ id: "R5", rule: "Fraud codes go to Chargeback Shield", status: "changed", message: `Reason code ${i.reasonCode} is fraud. Routed to Chargeback Shield; no check was run.` });
  } else {
    lines.push({ id: "R5", rule: "Fraud codes go to Chargeback Shield", status: "pass", message: "Not a fraud reason code." });
  }

  // R1 schema
  lines.push(
    i.schemaOk
      ? { id: "R1", rule: "Answer has the expected fields", status: "pass", message: "All required fields are present." }
      : { id: "R1", rule: "Answer has the expected fields", status: "blocked", message: "The answer is missing fields. Decide manually." },
  );

  // R3 deciding evidence exists
  // "Razorpay" is Razorpay's own dispute record, which the prompt allows as deciding evidence (R2 accepts it as a source too).
  const unknown = i.decidingEvidence.filter((e) => e !== "Razorpay" && !i.evidenceIds.includes(e));
  if (finalCall !== "shield" && unknown.length > 0) {
    finalCall = "escalate";
    changedReason = `The answer cited ${unknown.join(", ")}, which is not in this dispute`;
    lines.push({ id: "R3", rule: "Deciding evidence exists", status: "changed", message: `${unknown.join(", ")} is not in this dispute. Changed to Escalate.` });
  } else {
    lines.push({ id: "R3", rule: "Deciding evidence exists", status: "pass", message: "Every deciding document is in this dispute." });
  }

  // R4 Fight needs confidence and complete evidence
  if (finalCall === "fight" && (i.confidence?.toLowerCase() === "low" || i.missingEvidence.length > 0)) {
    finalCall = "escalate";
    changedReason = i.missingEvidence.length > 0 ? "Fight needs complete evidence" : "Fight needs more than low confidence";
    lines.push({ id: "R4", rule: "Fight needs confidence and complete evidence", status: "changed", message: `${changedReason}. Changed from Fight to Escalate.` });
  } else {
    lines.push({ id: "R4", rule: "Fight needs confidence and complete evidence", status: "pass", message: "No downgrade needed." });
  }

  // R2 citations (only when there is a draft to check)
  const trimmed = i.draft.trim();
  if (trimmed.length === 0) {
    lines.push({ id: "R2", rule: "Every draft sentence cites a document", status: "na", message: "No draft yet." });
  } else {
    const sents = splitSentences(trimmed);
    const uncited = sents.filter((s) => !sentenceHasSource(s));
    const missingIds = citedIds(trimmed).filter((id) => id !== "Razorpay" && !i.evidenceIds.includes(id));
    if (uncited.length > 0 || missingIds.length > 0) {
      const parts: string[] = [];
      if (uncited.length > 0) parts.push(`${uncited.length} sentence${uncited.length > 1 ? "s" : ""} without a source`);
      if (missingIds.length > 0) parts.push(`cites ${[...new Set(missingIds)].join(", ")}, which is not in this dispute`);
      lines.push({ id: "R2", rule: "Every draft sentence cites a document", status: "blocked", message: parts.join("; ") + ". Edit the draft to submit." });
      blockers.push("Every sentence needs a source");
    } else {
      lines.push({ id: "R2", rule: "Every draft sentence cites a document", status: "pass", message: `${sents.length} sentence${sents.length > 1 ? "s" : ""}, all cited.` });
    }
  }

  // R8 a Fight must rest on at least one key document for this reason code
  // Only lowers a Fight. Never creates one and never changes Accept or Escalate. Frozen in docs/HELDOUT_TEST.md.
  const R8_RULE = "A Fight cites a key document for this reason";
  const keySlots = keySlotsFor(i.reasonCode);
  if (finalCall !== "fight" || !i.slots || keySlots.length === 0 || i.draft.trim().length === 0) {
    lines.push({ id: "R8", rule: R8_RULE, status: "na", message: finalCall === "fight" ? "Not checked: no draft, slots or key list for this reason." : "Only checked when the call is Fight." });
  } else {
    const keyIds = new Set(i.slots.filter((s) => keySlots.includes(s.slot)).map((s) => s.evidenceId));
    const cites = citedIds(i.draft).filter((id) => keyIds.has(id));
    if (cites.length === 0) {
      finalCall = "escalate";
      changedReason = "Your evidence does not include the key document for this reason.";
      lines.push({ id: "R8", rule: R8_RULE, status: "changed", message: "Your evidence does not include the key document for this reason. Changed from Fight to Escalate." });
    } else {
      lines.push({ id: "R8", rule: R8_RULE, status: "pass", message: `The draft cites ${[...new Set(cites)].join(", ")}, a key document for this reason.` });
    }
  }

  // R9 every amount, date and count in the draft is in a cited document or the dispute record, or the merchant has checked it
  if (!i.figures || i.draft.trim().length === 0) {
    lines.push({ id: "R9", rule: "Numbers and dates in the draft are in the documents", status: "na", message: "No draft to check yet." });
  } else {
    const open = i.figures.filter((f) => !f.supported && !(i.confirmedFigures ?? []).includes(f.key));
    if (open.length > 0) {
      lines.push({ id: "R9", rule: "Numbers and dates in the draft are in the documents", status: "blocked", message: `${open.length} figure${open.length > 1 ? "s" : ""} in the draft ${open.length > 1 ? "are" : "is"} not in a cited document. Check ${open.length > 1 ? "them" : "it"} or edit the draft.` });
      blockers.push(`Check ${open.length} figure${open.length > 1 ? "s" : ""} in the draft`);
    } else {
      lines.push({ id: "R9", rule: "Numbers and dates in the draft are in the documents", status: "pass", message: i.figures.length === 0 ? "The draft has no amounts, dates or counts." : `${i.figures.length} figure${i.figures.length > 1 ? "s" : ""} checked against the documents.` });
    }
  }

  // R6 length
  if (trimmed.length > DRAFT_LIMIT) {
    lines.push({ id: "R6", rule: "Draft is 1,000 characters or less", status: "blocked", message: `${trimmed.length} characters. Shorten it by ${trimmed.length - DRAFT_LIMIT}.` });
    blockers.push("Draft is over 1,000 characters");
  } else {
    lines.push({ id: "R6", rule: "Draft is 1,000 characters or less", status: trimmed ? "pass" : "na", message: trimmed ? `${trimmed.length} of ${DRAFT_LIMIT} characters.` : "No draft yet." });
  }

  // R7 card numbers
  if (i.evidenceTexts.some(containsCardNumber)) {
    lines.push({ id: "R7", rule: "No full card numbers", status: "blocked", message: "A full card number is in the evidence. Remove it and try again." });
    blockers.push("Remove the card number from the evidence");
  } else {
    lines.push({ id: "R7", rule: "No full card numbers", status: "pass", message: "No card numbers found." });
  }

  if (trimmed.length === 0) blockers.push("Write a response");
  if (i.documentCount < 1) blockers.push("Attach at least one document");

  lines.sort((a, b) => a.id.localeCompare(b.id));
  return { lines, finalCall, changedReason, submitBlockers: blockers };
}

type LineStatus = { status: string };

/** "5 passed, 2 not needed yet" instead of "5 of 7", which reads as if two failed. */
export function checksSummary(lines: LineStatus[]): string {
  const n = (s: string) => lines.filter((l) => l.status === s).length;
  const parts = [`${n("pass")} passed`];
  if (n("changed")) parts.push(`${n("changed")} changed the answer`);
  if (n("blocked")) parts.push(`${n("blocked")} need your attention`);
  if (n("na")) parts.push(`${n("na")} not needed yet`);
  return parts.join(", ");
}

export function checksBadge(lines: LineStatus[]): string {
  const bad = lines.filter((l) => l.status === "changed" || l.status === "blocked").length;
  return bad ? `${bad} to look at` : "All clear";
}
