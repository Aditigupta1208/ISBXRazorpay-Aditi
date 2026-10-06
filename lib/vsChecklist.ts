/** "Why AI, not a fixed rule", shown on every dispute: the coded checklist's answer next to the agent's. */
import { fixedChecklist, type BaselineInput } from "./baseline";

export type AgentCall = "fight" | "fold" | "escalate";

export interface Comparison {
  checklist: "Fight" | "Accept";
  agree: boolean;
  /** What the checklist looked at, in plain words. */
  basis: string;
}

const word = (c: AgentCall) => (c === "fight" ? "Fight" : c === "fold" ? "Fold" : "Escalate");

/** Null for reason codes outside the five non-fraud ones: there is no checklist to compare with. */
export function compareWithChecklist(input: BaselineInput, agentCall: AgentCall): (Comparison & { agentWord: string }) | null {
  const r = fixedChecklist(input);
  if (r.call === "n/a") return null;
  const agentFights = agentCall === "fight";
  // The checklist can only say Fight or Accept; "Accept" is the same advice as Fold.
  const agree = (r.call === "Fight") === agentFights && agentCall !== "escalate";
  return { checklist: r.call, agree, basis: r.reason, agentWord: word(agentCall) };
}
