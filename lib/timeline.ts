/**
 * Dates found in the evidence text, in order, with the dispute date. Only full dates
 * (day, month and year) count, so nothing is guessed. Used for the case timeline.
 */
export interface TimelineEvent {
  /** ISO date, e.g. 2026-07-29 */
  iso: string;
  label: string;
  /** Evidence id, or null for the dispute itself. */
  evidenceId: string | null;
  text: string;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const DATE_RE = /\b(\d{1,2})(?:st|nd|rd|th)? ([A-Z][a-z]{2,8}) (\d{4})\b/g;

function toIso(day: string, month: string, year: string): string | null {
  const m = MONTHS.indexOf(month.slice(0, 3).toLowerCase());
  const d = Number(day);
  if (m < 0 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(Number(year), m, d));
  if (dt.getUTCMonth() !== m) return null; // 31 Feb and the like
  return dt.toISOString().slice(0, 10);
}

export function parseDate(s: string): string | null {
  const re = new RegExp(DATE_RE.source);
  const m = re.exec(s);
  return m ? toIso(m[1], m[2], m[3]) : null;
}

export function formatIso(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1][0].toUpperCase()}${MONTHS[m - 1].slice(1)} ${y}`;
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

function snippet(text: string, at: number): string {
  const start = Math.max(0, text.lastIndexOf(".", at - 2) + 1);
  let end = text.indexOf(". ", at);
  if (end < 0) end = text.length;
  let s = text.slice(start, end + 1).trim();
  if (s.length > 90) s = `${s.slice(0, 87).trimEnd()}…`;
  return s;
}

export function buildTimeline(input: {
  raisedOn: string;
  evidence: { id: string; content: string }[];
}): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  for (const e of input.evidence) {
    const seen = new Set<string>();
    for (const m of e.content.matchAll(DATE_RE)) {
      const iso = toIso(m[1], m[2], m[3]);
      if (!iso || seen.has(iso)) continue;
      seen.add(iso);
      events.push({ iso, label: formatIso(iso), evidenceId: e.id, text: snippet(e.content, m.index ?? 0) });
    }
  }
  const raised = parseDate(input.raisedOn);
  if (raised) events.push({ iso: raised, label: formatIso(raised), evidenceId: null, text: "Dispute raised" });
  // Stable: by date, then dispute last on the same day, then evidence order.
  return events
    .map((e, i) => ({ e, i }))
    .sort((a, b) => a.e.iso.localeCompare(b.e.iso) || a.i - b.i)
    .map((x) => x.e);
}
