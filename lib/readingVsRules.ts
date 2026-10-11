import labelsFile from "@/data/labels.json";
import { toCall } from "./data";
import type { Call } from "./types";

/** Cases picked to show where reading the documents changes the call. The calls themselves come from the data, never typed here. */
export const READING_CASES: { id: string; title: string; why: string }[] = [
  { id: "C14", title: "A policy that was never agreed", why: "A cancellation policy is attached, so the checklist fights. Reading shows it sat in the website footer and checkout had no tick box, so under Visa 13.7 the policy does not count." },
  { id: "C05", title: "Terms accepted, but no use", why: "Terms record and usage log are both attached, so the checklist fights. Reading shows the log has no use, so there is nothing to defend." },
  { id: "C12", title: "No refund on record, but the policy was agreed", why: "No refund is recorded, so the checklist accepts. Reading shows the customer ticked a 14-day refund policy and asked on day 80, so the merchant can fight." },
  { id: "C15", title: "Half is owed, and one document is missing", why: "The accepted policy means only half was owed and the canceller's authority is unconfirmed. The checklist fights; the right call is to escalate." },
];

export interface ReadingRow {
  id: string;
  title: string;
  why: string;
  human: Call;
  checklist: Call;
  agent: Call | null;
}

/** agentFinal: case id to the agent's final call in the latest run. A case missing from the run shows as not run. */
export function readingRows(agentFinal: Map<string, Call>): ReadingRow[] {
  const out: ReadingRow[] = [];
  for (const c of READING_CASES) {
    const l = (labelsFile as { labels: { id: string; decision: string; checklist_decision: string }[] }).labels.find((x) => x.id === c.id);
    if (!l) continue;
    out.push({ ...c, human: toCall(l.decision), checklist: toCall(l.checklist_decision), agent: agentFinal.get(c.id) ?? null });
  }
  return out;
}
