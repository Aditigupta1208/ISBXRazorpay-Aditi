import casesFile from "@/data/cases.json";
import labelsFile from "@/data/labels.json";
import chatgpt from "@/data/prerun/kill-test-v1-chatgpt.json";
import supplements from "@/data/prerun/demo-supplements.json";
import type { CaseData, Call, CheckView, SavedResult } from "./types";

const cases = (casesFile as { cases: CaseData[] }).cases;

interface RawRun {
  id: string;
  decision: string;
  confidence?: string;
  deciding_evidence?: string;
  reason?: string;
  draft_response?: string;
  evidence_slots?: string;
}

const SOURCE_LABEL = "Saved result: ChatGPT 5.6 Terra, prompt v1";

export function toCall(decision: string): Call {
  const d = decision.toLowerCase();
  if (d.startsWith("fight")) return "fight";
  if (d.startsWith("accept") || d.startsWith("fold")) return "fold";
  if (d.startsWith("route")) return "shield";
  return "escalate";
}

const ids = (s?: string) => (s ? s.match(/E\d+/g) ?? [] : []);

function parseSlots(s?: string) {
  if (!s) return [];
  return s
    .split(";")
    .map((p) => p.trim())
    .map((p) => {
      const [id, slot] = p.split(":").map((x) => x.trim());
      return { evidenceId: id, slot };
    })
    .filter((x) => x.evidenceId && x.slot);
}

const saved = new Map<string, SavedResult>();
for (const r of (chatgpt as { results: RawRun[] }).results) {
  saved.set(r.id, {
    caseId: r.id,
    call: toCall(r.decision),
    confidence: r.confidence,
    decidingEvidence: ids(r.deciding_evidence),
    reason: r.reason,
    draft: r.draft_response,
    slots: parseSlots(r.evidence_slots),
    sourceLabel: SOURCE_LABEL,
  });
}

export function getCases(): CaseData[] {
  return cases;
}
/** Cases that have a saved result: these are the demo disputes. C17 to C20 exist only for the evals. */
export function getDemoCases(): CaseData[] {
  return cases.filter((c) => saved.has(c.id));
}
export function getCase(id: string): CaseData | undefined {
  return cases.find((c) => c.id === id);
}
export function getSavedResult(caseId: string): SavedResult | undefined {
  return saved.get(caseId);
}
/** Plain-language rule text for a Visa reason code, from the answer key. */
export function getRuleText(code: string): string | undefined {
  return (labelsFile as { visa_rules?: Record<string, string> }).visa_rules?.[code];
}
export function isFraudCode(code: string): boolean {
  return code.startsWith("10.");
}

interface Supp {
  get_first?: string;
  request_text?: string;
  defensible_amount?: number;
  tip?: string;
}
const SUPP = supplements as unknown as {
  odds_from_confidence: Record<string, number>;
  reason_code_tips: Record<string, string>;
  cases: Record<string, Supp>;
};

const rawById = new Map<string, RawRun>();
for (const r of (chatgpt as { results: RawRun[] }).results) rawById.set(r.id, r);

/** In the saved v1 results an Escalate lists what is missing in the deciding_evidence field ("missing: ..."). */
function missingFrom(s?: string): string[] {
  const m = s?.match(/^missing:\s*(.+)$/i);
  return m ? [m[1].trim()] : [];
}

/** The full view for the check panel, from the saved result plus the builder-authored supplements. */
/**
 * Placeholder win chance for a saved result. Confidence is confidence in the call, so on a Fold a high confidence
 * means the fight is unlikely to win; reading it as the chance to win showed 80% beside a Fold. Not model output.
 */
/** One saved sentence read awkwardly on screen; the saved file is untouched and Under the hood still shows it as the model wrote it. */
const READABLE_REASON: Record<string, string> = {
  C06: "Thinking about cancelling is not the same as cancelling. The audit log shows no completed cancellation request.",
};

const FOLD_ODDS: Record<string, number> = { High: 0.15, Medium: 0.3, Low: 0.4 };
export function savedOdds(call: string, confidence: string): number {
  if (call === "fold") return FOLD_ODDS[confidence] ?? 0.3;
  if (call === "escalate") return 0.5;
  return SUPP.odds_from_confidence[confidence] ?? 0.5;
}

export function getCheckView(caseId: string): CheckView | undefined {
  const c = getCase(caseId);
  const s = saved.get(caseId);
  const raw = rawById.get(caseId);
  if (!c || !s || !raw) return undefined;
  const sup = SUPP.cases[caseId] ?? {};
  const confidence = s.confidence ?? "Medium";
  return {
    caseId,
    call: s.call,
    confidence,
    reason: READABLE_REASON[caseId] ?? s.reason ?? "",
    decidingEvidence: s.decidingEvidence,
    missingEvidence: missingFrom(raw.deciding_evidence),
    contradictions: [],
    draft: s.draft ?? "",
    slots: s.slots,
    ruleText: getRuleText(c.dispute.reason_code) ?? "",
    odds: savedOdds(s.call, confidence),
    oddsNote: "The saved result has no estimate, so this is set from its call and confidence. A live check gives its own.",
    defensibleAmount: sup.defensible_amount ?? null,
    getFirst: sup.get_first,
    requestText: sup.request_text,
    tip: sup.tip ?? SUPP.reason_code_tips[c.dispute.reason_code] ?? "",
    source: {
      label: s.sourceLabel,
      model: "ChatGPT 5.6 Terra (medium)",
      promptVersion: "v1",
      date: "2026-10-04",
      live: false,
    },
    raw: raw as unknown as Record<string, unknown>,
  };
}

/** The builder-written prevention tip for a reason code (not model output). */
export function getReasonTip(code: string): string {
  return SUPP.reason_code_tips[code] ?? "";
}
