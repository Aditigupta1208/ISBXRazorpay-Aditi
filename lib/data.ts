import casesFile from "@/data/cases.json";
import labelsFile from "@/data/labels.json";
import chatgpt from "@/data/prerun/kill-test-v1-chatgpt.json";
import type { CaseData, Call, SavedResult } from "./types";

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
