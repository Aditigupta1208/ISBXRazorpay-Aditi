/**
 * "Tuned rules": the best fixed-rule system we could write by reading the 20 known cases.
 * It starts from the simple checklist (lib/baseline.ts) and adds hand-written overrides, one per trap we found.
 * Each override says which case it was written for. The point of the comparison is not that these rules are bad:
 * it is that they had to be written one trap at a time, and then must be tested on cases they have never seen.
 * Still no AI, no reading of meaning: only keywords, dates and email addresses.
 */
import { fixedChecklist, kindsPresent, type BaselineInput } from "./baseline";

export type TunedCall = "Fight" | "Accept" | "Escalate" | "Fraud";

export interface TunedRule {
  id: string;
  code: string;
  summary: string;
  /** The known case this rule was written for. */
  writtenFor: string;
}

export const TUNED_RULES: TunedRule[] = [
  { id: "T1", code: "10.x", summary: "Fraud reason codes go to Chargeback Shield.", writtenFor: "C16" },
  { id: "T2", code: "13.1", summary: "Only the merchant's own message says it was delivered, nobody replied, and no usage or customer record exists: Escalate.", writtenFor: "C02" },
  { id: "T3", code: "13.2", summary: "The customer asked to cancel before the renewal date (date compared with the charge date): Accept.", writtenFor: "C05, C17" },
  { id: "T4", code: "13.3", summary: "Work was delivered in part ('will follow', 'not started') and the client accepted the part: Escalate.", writtenFor: "C18" },
  { id: "T5", code: "13.3", summary: "A delivery record shows zero held, delivered or completed: Accept.", writtenFor: "C08" },
  { id: "T6", code: "13.3", summary: "A promised size ('1,500 words each') and delivered sizes where some fall 10% or more short: Accept.", writtenFor: "C09" },
  { id: "T7", code: "13.6", summary: "Refund request came after the accepted refund window (days after purchase greater than the N-day policy): Fight.", writtenFor: "C12" },
  { id: "T8", code: "13.7", summary: "A cancellation policy exists but was only in the footer, with no acceptance: Accept.", writtenFor: "C14, C19" },
  { id: "T9", code: "13.7", summary: "The email that accepted the policy differs from the email that cancelled: Escalate.", writtenFor: "C15" },
];

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const monthIndex = (s: string) => MONTHS.indexOf(s.slice(0, 3).toLowerCase());

/** All "5 May 2026" style dates in a text, as timestamps. */
function datesIn(text: string): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(/\b(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* (\d{4})\b/g)) {
    out.push(Date.UTC(Number(m[3]), monthIndex(m[2]), Number(m[1])));
  }
  return out;
}

/** The charge date: "captured on 1 Jun 2026", else one year after the last earlier annual payment, on the 1st. */
function chargeDate(facts: string): number | null {
  const direct = facts.match(/captured on (\d{1,2} \w+ \d{4})/i);
  if (direct) return datesIn(direct[1])[0] ?? null;
  const earlier = facts.match(/earlier annual payments?\s*\(([^)]*)\)/i);
  if (!earlier) return null;
  const all = [...earlier[1].matchAll(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* (\d{4})/g)];
  const last = all[all.length - 1];
  return last ? Date.UTC(Number(last[2]) + 1, monthIndex(last[1]), 1) : null;
}

const emails = (s: string) => (s.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) ?? []).map((e) => e.toLowerCase());

export interface TunedResult {
  call: TunedCall;
  /** The override that fired, or null if the simple checklist's answer stood. */
  rule: TunedRule | null;
  reason: string;
}

export function tunedChecklist(i: BaselineInput): TunedResult {
  const rule = (id: string) => TUNED_RULES.find((r) => r.id === id)!;
  const fire = (id: string, call: TunedCall): TunedResult => ({ call, rule: rule(id), reason: rule(id).summary });
  const text = i.evidence.map((e) => e.content);
  const any = (re: RegExp) => text.some((t) => re.test(t));

  if (i.reasonCode.startsWith("10.")) return fire("T1", "Fraud");

  if (i.reasonCode === "13.1") {
    const customerSide = /(from the guest|signed '|signed by|check-in register|logged in|login log|access log|usage (log|summary)|acknowledg|approved|thanks)/i;
    if (any(/no reply/i) && !any(customerSide)) return fire("T2", "Escalate");
  }

  if (i.reasonCode === "13.2") {
    const charge = chargeDate(i.razorpayFacts);
    const cancelAsk = i.evidence.find((e) => /(please cancel|cancel our|cancel the plan|moving to another)/i.test(e.content) && !/thinking of cancel/i.test(e.content));
    const askDate = cancelAsk ? datesIn(cancelAsk.content)[0] : undefined;
    if (charge !== null && askDate !== undefined && askDate < charge) return fire("T3", "Accept");
  }

  if (i.reasonCode === "13.3") {
    if (any(/will follow|to follow/i) && any(/\b\d+ pages\b/i) && any(/not started|in progress/i)) return fire("T4", "Escalate");
    if (any(/\b(held|delivered|completed|published):?\s*0\b/i)) return fire("T5", "Accept");
    const promised = text.map((t) => t.match(/(\d[\d,]*) words each/i)).find(Boolean);
    const sizes = text.map((t) => t.match(/word counts:\s*([\d,\s/]+)/i)).find(Boolean);
    if (promised && sizes) {
      const p = Number(promised[1].replace(/,/g, ""));
      const counts = sizes[1].split("/").map((n) => Number(n.replace(/[,\s]/g, ""))).filter((n) => n > 0);
      if (counts.some((n) => n < p * 0.9)) return fire("T6", "Accept");
    }
  }

  if (i.reasonCode === "13.6" && /no refund recorded/i.test(i.razorpayFacts)) {
    const policy = text.map((t) => t.match(/(\d+)-day/i)).find(Boolean);
    const since = text.map((t) => t.match(/(\d+) days after purchase/i)).find(Boolean);
    if (policy && since && any(/ticked/i) && Number(since[1]) > Number(policy[1])) return fire("T7", "Fight");
  }

  if (i.reasonCode === "13.7") {
    const kinds = kindsPresent(i);
    if (kinds.includes("cancellation_policy") && !kinds.includes("terms_record") && any(/(no acceptance|never agreed|footer)/i)) return fire("T8", "Accept");
    const accepted = i.evidence.find((e) => /ticked/i.test(e.content));
    const cancelMail = i.evidence.find((e) => /^cancellation email from/i.test(e.content));
    if (accepted && cancelMail) {
      const a = emails(accepted.content);
      const c = emails(cancelMail.content);
      if (a.length && c.length && !c.some((x) => a.includes(x))) return fire("T9", "Escalate");
    }
  }

  const base = fixedChecklist(i);
  return { call: base.call === "n/a" ? "Accept" : base.call, rule: null, reason: base.reason };
}

/** Map to the app's call words so it can be scored against the answer key. */
export function tunedToCall(c: TunedCall): "fight" | "fold" | "escalate" | "shield" {
  return c === "Fight" ? "fight" : c === "Accept" ? "fold" : c === "Escalate" ? "escalate" : "shield";
}
