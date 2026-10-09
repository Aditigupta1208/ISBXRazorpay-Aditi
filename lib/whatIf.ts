/** "What if I get it?" for an Escalate call: a deadline check and what the answer could become. Pure pattern logic, no model call. */
export const WAIT_OPTIONS = [
  { key: "hours", label: "A few hours", hours: 4 },
  { key: "day", label: "About a day", hours: 24 },
  { key: "two", label: "About two days", hours: 48 },
  { key: "three", label: "Three days or more", hours: 72 },
  { key: "unsure", label: "Not sure", hours: null },
] as const;
export type WaitKey = (typeof WAIT_OPTIONS)[number]["key"];

/** Hours the merchant needs after the document arrives to add it, re-run the check and approve. */
export const REVIEW_BUFFER_HOURS = 4;

export type Verdict = "in_time" | "tight" | "too_late" | "unknown";

export function deadlineVerdict(hoursLeft: number, wait: WaitKey): { verdict: Verdict; text: string } {
  const opt = WAIT_OPTIONS.find((o) => o.key === wait)!;
  if (opt.hours === null) {
    return { verdict: "unknown", text: `You have ${hoursLeft}h. Ask now. If nothing has arrived with ${REVIEW_BUFFER_HOURS}h left, choose Fight or Fold with what you have.` };
  }
  const spare = hoursLeft - opt.hours - REVIEW_BUFFER_HOURS;
  if (spare >= 0 && spare < 12) return { verdict: "tight", text: `Tight. ${opt.label.toLowerCase()} leaves about ${Math.max(spare, 0)}h to add it and approve. Ask now.` };
  if (spare >= 12) return { verdict: "in_time", text: `In time. You have ${hoursLeft}h and it takes ${opt.label.toLowerCase()}, so about ${spare}h are left to add it and approve.` };
  return { verdict: "too_late", text: `Too late. You have ${hoursLeft}h and it takes ${opt.label.toLowerCase()}, plus about ${REVIEW_BUFFER_HOURS}h to add it and approve. Choose Fight or Fold now.` };
}

/** What each outcome would likely do to the call. A guide only: the real answer comes from re-running the check with the document added. */
export function whatItChanges(need: string): { supports: string; against: string } {
  return {
    supports: `If it shows ${need.charAt(0).toLowerCase()}${need.slice(1).replace(/\.$/, "")} in your favour, the key document is in and the check would likely move to Fight.`,
    against: "If it shows the customer is right, the check would likely move to Fold, and you would have saved the fee of fighting a dispute you would lose.",
  };
}
