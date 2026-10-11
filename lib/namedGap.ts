/** The one line that leads every call: what is missing, or which documents decide it. Plain words, from the app's own data. */
export interface GapInput {
  call: "fight" | "fold" | "escalate" | "shield";
  getFirst?: string | null;
  missingEvidence: string[];
  uncoveredKeyNeeds: string[]; // key documents for the reason code that the evidence does not cover
  decidingEvidence: string[];
}
export interface NamedGap {
  label: "Missing" | "Decided by";
  text: string;
}

export function namedGap(i: GapInput): NamedGap | null {
  if (i.call === "shield") return null;
  const missing = (i.call === "escalate" ? i.getFirst : null) || i.missingEvidence[0] || i.uncoveredKeyNeeds[0];
  if (missing) return { label: "Missing", text: missing.replace(/\.$/, "") };
  const ids = i.decidingEvidence.filter((x) => x !== "Razorpay");
  if (ids.length > 0) return { label: "Decided by", text: ids.join(", ") + (i.decidingEvidence.includes("Razorpay") ? " and Razorpay's record" : "") };
  return null;
}

export interface WhyNotFoldInput {
  call: "fight" | "fold" | "escalate" | "shield";
  reasonCode: string;
  keyCovered: number;
  keyTotal: number;
  contradictions: number;
}

/** One line on a Fight call: why not just accept it. Built from counts the app already has; no model call. */
export function whyNotFold(i: WhyNotFoldInput): string | null {
  if (i.call !== "fight" || i.keyTotal <= 0) return null;
  const docs = `${i.keyCovered} of ${i.keyTotal} key documents for ${i.reasonCode} are in place`;
  if (i.contradictions > 0) {
    return `${docs}, but ${i.contradictions} ${i.contradictions === 1 ? "document conflicts" : "documents conflict"} with them. Check that before you submit.`;
  }
  if (i.keyCovered < i.keyTotal) return `${docs}, and nothing in your evidence contradicts them.`;
  return `All ${i.keyTotal} key documents for ${i.reasonCode} are in place, and nothing in your evidence contradicts them.`;
}
