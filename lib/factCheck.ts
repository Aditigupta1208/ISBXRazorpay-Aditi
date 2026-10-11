/**
 * Number-and-date check (R9) and the "Check these before you approve" list.
 * Every amount, date and count in a draft must appear in a document the same sentence cites, or in the dispute record.
 * Plain pattern matching, no model. It can be wrong in both directions (a figure the merchant worked out themselves, or one written
 * in an unusual way), so the merchant can tick "I checked this" for any figure that is not found.
 */
import { citedIds, splitSentences } from "./guardrails";

export type FigureKind = "amount" | "date" | "count";
export interface Figure {
  key: string; // kind:text, the same figure repeated is one item
  kind: FigureKind;
  text: string; // as written in the draft
  sentence: string;
  supportedBy: string[]; // evidence ids, or "Razorpay record"
  foundElsewhere: string[]; // documents that hold it but this sentence does not cite
  supported: boolean;
}
export interface Doc {
  id: string;
  content: string;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MON = "(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
const DMY = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+${MON}\\b\\.?(?:,?\\s*(\\d{4}))?`, "gi");
const MDY = new RegExp(`\\b${MON}\\b\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b(?:,?\\s*(\\d{4}))?`, "gi");
const MY = new RegExp(`\\b${MON}\\b\\.?,?\\s+(\\d{4})\\b`, "gi");
const AMOUNT = /(?:USD|US\$|INR|EUR|GBP|Rs\.?|rupees?|₹|\$|€|£)\s?(\d[\d,]*(?:\.\d+)?)|(\d[\d,]*(?:\.\d+)?)\s?(?:USD|INR|EUR|GBP|rupees?)\b/gi;
// 07/08/2026, 7-8-2026, 7.8.2026 (day first or month first) and 2026-08-07
const NUMDATE = /\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\b/g;
const ISODATE = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
const TIME = /\b(\d{1,2}):(\d{2})(?::\d{2})?(?:\s?[ap]\.?m\b\.?)?/gi;
const PERCENT = /(\d+(?:\.\d+)?)\s?%/g;
const COUNT_NOUNS = "times|days|weeks|months|years|hours|minutes|sessions|logins|emails|messages|reminders|attempts|payments|invoices|calls|visits|downloads|refunds|installments|instalments|reports|tickets|requests";
const WORD_NUM: Record<string, string> = { one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9", ten: "10", eleven: "11", twelve: "12", fourteen: "14", fifteen: "15", twenty: "20", thirteen: "13", sixteen: "16", seventeen: "17", eighteen: "18", nineteen: "19", thirty: "30", forty: "40", fifty: "50", sixty: "60", ninety: "90", twice: "2" };
const WORDS_RE = "one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|ninety";
const WORD_COUNT = new RegExp(`\\b(${WORDS_RE})\\s+(?:more\\s+|separate\\s+|different\\s+)?(?:${COUNT_NOUNS})\\b|\\b(twice)\\b`, "gi");;

interface Dt {
  d?: number;
  m: number;
  y?: number;
  alt?: Dt; // a numeric date such as 07/08/2026 can be day-first or month-first
}
const mon = (s: string) => MONTHS.indexOf(s.slice(0, 3).toLowerCase());
const num = (s: string) => s.replace(/,/g, "").replace(/\.0+$/, "");

function datesIn(text: string): { raw: string; dt: Dt }[] {
  const out: { raw: string; dt: Dt }[] = [];
  const seen = new Set<number>();
  const take = (m: RegExpMatchArray, dt: Dt) => {
    const start = m.index ?? 0;
    if (seen.has(start)) return;
    for (let i = start; i < start + m[0].length; i++) seen.add(i);
    out.push({ raw: m[0].trim().replace(/\.$/, ""), dt });
  };
  for (const m of text.matchAll(ISODATE)) {
    const mo = Number(m[2]);
    const da = Number(m[3]);
    if (mo >= 1 && mo <= 12 && da >= 1 && da <= 31) take(m, { d: da, m: mo - 1, y: Number(m[1]) });
  }
  for (const m of text.matchAll(NUMDATE)) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    const y = Number(m[3]);
    if (a > 31 || b > 31 || a < 1 || b < 1) continue;
    if (a > 12 && b <= 12) take(m, { d: a, m: b - 1, y });
    else if (b > 12 && a <= 12) take(m, { d: b, m: a - 1, y });
    else if (a <= 12 && b <= 12) take(m, { d: a, m: b - 1, y, alt: { d: b, m: a - 1, y } });
  }
  for (const m of text.matchAll(DMY)) take(m, { d: Number(m[1]), m: mon(m[2]), y: m[3] ? Number(m[3]) : undefined });
  for (const m of text.matchAll(MY)) take(m, { m: mon(m[1]), y: Number(m[2]) });
  for (const m of text.matchAll(MDY)) take(m, { d: Number(m[2]), m: mon(m[1]), y: m[3] ? Number(m[3]) : undefined });
  return out;
}

function dateMatches(a: Dt, b: Dt): boolean {
  if (a.alt || b.alt) return [a, a.alt].some((x) => x && [b, b.alt].some((y) => y && sameDate(x, y)));
  return sameDate(a, b);
}

function sameDate(a: Dt, b: Dt): boolean {
  if (a.m !== b.m) return false;
  if (a.d !== undefined && b.d !== undefined && a.d !== b.d) return false;
  if (a.y !== undefined && b.y !== undefined && a.y !== b.y) return false;
  return true;
}

/** Every number written in a text as digits or a small number word, commas removed. */
function numbersIn(text: string): Set<string> {
  const s = new Set<string>();
  for (const m of text.matchAll(TIME)) s.add(`${Number(m[1])}:${m[2]}`);
  for (const m of text.matchAll(/\d[\d,]*(?:\.\d+)?/g)) s.add(num(m[0]));
  for (const m of text.toLowerCase().matchAll(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fourteen|fifteen|twenty|thirty)\b/g)) s.add(WORD_NUM[m[1]]);
  return s;
}

/** Figures in one sentence, with what was matched removed so nothing counts twice. */
function figuresIn(sentence: string): { kind: FigureKind; text: string; value?: string; dt?: Dt }[] {
  let t = sentence.replace(/\[[^\]]*\]/g, " ");
  const out: { kind: FigureKind; text: string; value?: string; dt?: Dt }[] = [];
  for (const m of t.matchAll(AMOUNT)) out.push({ kind: "amount", text: m[0].trim(), value: num(m[1] ?? m[2]) });
  t = t.replace(AMOUNT, " ");
  for (const dm of datesIn(t)) out.push({ kind: "date", text: dm.raw, dt: dm.dt });
  t = t.replace(ISODATE, " ").replace(NUMDATE, " ").replace(DMY, " ").replace(MY, " ").replace(MDY, " ");
  for (const m of t.matchAll(TIME)) out.push({ kind: "count", text: m[0].trim(), value: `${Number(m[1])}:${m[2]}` });
  t = t.replace(TIME, " ");
  for (const m of t.matchAll(PERCENT)) out.push({ kind: "count", text: m[0].trim(), value: num(m[1]) });
  t = t.replace(PERCENT, " ");
  for (const m of t.matchAll(WORD_COUNT)) out.push({ kind: "count", text: m[0].trim(), value: WORD_NUM[(m[1] ?? m[2]).toLowerCase()] });
  t = t.replace(WORD_COUNT, " ");
  t = t.replace(/\b\d+(?:\.\d+)+\b/g, " ") // reason codes like 13.2
    .replace(/\b3-D\b/gi, " ")
    .replace(/\b\d+(?:st|nd|rd|th)\b/gi, " ");
  for (const m of t.matchAll(/\b\d[\d,]*\b/g)) out.push({ kind: "count", text: m[0], value: num(m[0]) });
  return out;
}

/** The text of the dispute record: what Razorpay supplies. Cited as "Razorpay record". */
export function recordText(c: { dispute: { amount: number; currency: string; raised_on: string; reason_code: string }; dispute_summary: string; razorpay_facts: string; customer_claim: string }): string {
  const major = c.dispute.amount / 100;
  return [`${major}`, major.toLocaleString("en-US"), c.dispute.currency, c.dispute.raised_on, c.dispute_summary, c.razorpay_facts, c.customer_claim].join(" ");
}

export function checkFigures(draft: string, evidence: Doc[], record: string): Figure[] {
  const byId = new Map(evidence.map((e) => [e.id, e.content]));
  const recNums = numbersIn(record);
  const recDates = datesIn(record).map((x) => x.dt);
  const seen = new Map<string, Figure>();
  for (const sentence of splitSentences(draft)) {
    const cites = [...new Set(citedIds(sentence))].filter((id) => id !== "Razorpay" && byId.has(id));
    for (const f of figuresIn(sentence)) {
      const key = `${f.kind}:${f.text.toLowerCase()}`;
      const holds = (text: string) => (f.kind === "date" ? datesIn(text).some((x) => dateMatches(f.dt!, x.dt)) : numbersIn(text).has(f.value!));
      const supportedBy = cites.filter((id) => holds(byId.get(id)!));
      const inRecord = f.kind === "date" ? recDates.some((d) => dateMatches(f.dt!, d)) : recNums.has(f.value!);
      if (inRecord) supportedBy.push("Razorpay record");
      const foundElsewhere = supportedBy.length === 0 ? evidence.filter((e) => !cites.includes(e.id) && holds(e.content)).map((e) => e.id) : [];
      const fig: Figure = { key, kind: f.kind, text: f.text, sentence: sentence.replace(/\s*\[[^\]]*\]/g, "").trim(), supportedBy, foundElsewhere, supported: supportedBy.length > 0 };
      const prev = seen.get(key);
      if (!prev || (!prev.supported && fig.supported)) seen.set(key, fig); // a figure counts as found if any use of it is supported
    }
  }
  return [...seen.values()];
}

export function unsupportedKeys(figs: Figure[], confirmed: string[] = []): string[] {
  return figs.filter((f) => !f.supported && !confirmed.includes(f.key)).map((f) => f.key);
}
