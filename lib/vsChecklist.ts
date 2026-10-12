/** "Why AI, not a fixed rule", shown on every dispute: the coded checklist's answer next to the agent's. */
import { fixedChecklist, type BaselineInput } from "./baseline";

export type AgentCall = "fight" | "fold" | "escalate";

export interface Comparison {
  checklist: "Fight" | "Accept";
  agree: boolean;
  /** What the checklist looked at, in plain words. */
  basis: string;
}

const word = (c: AgentCall) => (c === "fight" ? "Fight" : c === "fold" ? "Accept" : "Get a document");

/** Null for reason codes outside the five non-fraud ones: there is no checklist to compare with. */
export function compareWithChecklist(input: BaselineInput, agentCall: AgentCall): (Comparison & { agentWord: string }) | null {
  const r = fixedChecklist(input);
  if (r.call === "n/a") return null;
  const agentFights = agentCall === "fight";
  // The checklist can only say Fight or Accept; "Accept" is the same advice as Fold.
  const agree = (r.call === "Fight") === agentFights && agentCall !== "escalate";
  return { checklist: r.call, agree, basis: r.reason, agentWord: word(agentCall) };
}

/** How often the fixed checklist matched the builder's answer key, on the scored practice cases (fraud-routed ones have no checklist). */
export function checklistTrackRecord(labels: { decision: string; checklist_decision: string | null }[]): { scored: number; matched: number } {
  const rows = labels.filter((l) => l.decision !== "route_to_fraud_cover" && l.checklist_decision && l.checklist_decision !== "n/a");
  return { scored: rows.length, matched: rows.filter((l) => l.decision.toLowerCase() === l.checklist_decision!.toLowerCase()).length };
}

/** The same count, fixed here so the screen does not ship the whole answer key. A test checks it against data/labels.json. */
export const CHECKLIST_TRACK_RECORD = { scored: 38, matched: 23 } as const;
