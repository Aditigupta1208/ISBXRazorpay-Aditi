/**
 * Anonymous usage counters, so the builder can see how reviewers used the demo.
 * Stores only counts per fixed event name (and per demo dispute ID), per day. No names, emails, IPs, cookies or evidence text.
 * Optional: with no database configured every call is a no-op and the app is unchanged.
 * Backend: Supabase (Postgres) over its REST API, called only from server code with the service-role key.
 * Setup SQL: docs/supabase-usage.sql
 */
export const EVENTS = [
  "new_visitor",
  "dispute_opened",
  "rerun",
  "upload",
  "submit",
  "fold",
  "outcome_won",
  "outcome_lost",
  "results_viewed",
  "evals_viewed",
  "how_it_works_viewed",
] as const;
export type UsageEvent = (typeof EVENTS)[number];

export interface Backend {
  url: string;
  key: string;
}

export function backendFrom(env: Record<string, string | undefined>): Backend | null {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;
  if (!url || !key || !/^https?:\/\//.test(url)) return null;
  return { url: url.replace(/\/$/, ""), key };
}

/** The counter field for an event, or null if the event or ID is not on the allowlist. */
export function fieldFor(event: unknown, id: unknown, validCaseIds: string[]): string | null {
  if (typeof event !== "string" || !(EVENTS as readonly string[]).includes(event)) return null;
  if (event === "dispute_opened") {
    return typeof id === "string" && validCaseIds.includes(id) ? `dispute_opened:${id}` : null;
  }
  return event;
}

function headers(b: Backend): Record<string, string> {
  return { apikey: b.key, Authorization: `Bearer ${b.key}`, "Content-Type": "application/json" };
}

/** Add one to today's count for this field (the database function stamps the UTC date). Never throws. */
export async function record(fetchFn: typeof fetch, b: Backend, field: string): Promise<boolean> {
  try {
    const res = await fetchFn(`${b.url}/rest/v1/rpc/incr_usage`, {
      method: "POST",
      headers: headers(b),
      body: JSON.stringify({ p_event: field }),
      signal: AbortSignal.timeout(2500),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export interface UsageReport {
  total: Record<string, number>;
  days: Record<string, Record<string, number>>;
}

export async function readUsage(fetchFn: typeof fetch, b: Backend, days = 14, now = new Date()): Promise<UsageReport | null> {
  try {
    const res = await fetchFn(`${b.url}/rest/v1/usage_counts?select=day,event,count&limit=10000`, {
      headers: headers(b),
      signal: AbortSignal.timeout(2500),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as { day?: string; event?: string; count?: number | string }[];
    if (!Array.isArray(rows)) return null;
    const since = new Date(now.getTime() - (days - 1) * 86_400_000).toISOString().slice(0, 10);
    const report: UsageReport = { total: {}, days: {} };
    for (const r of rows) {
      if (typeof r.day !== "string" || typeof r.event !== "string") continue;
      const n = Number(r.count) || 0;
      report.total[r.event] = (report.total[r.event] ?? 0) + n;
      if (r.day >= since) (report.days[r.day] ??= {})[r.event] = n;
    }
    return report;
  } catch {
    return null;
  }
}

/** Headline numbers for the report page. */
export function headline(total: Record<string, number>) {
  const opened = Object.entries(total).filter(([k]) => k.startsWith("dispute_opened:"));
  return {
    visitors: total.new_visitor ?? 0,
    disputesOpened: opened.reduce((s, [, n]) => s + n, 0),
    distinctDisputes: opened.length,
    reruns: total.rerun ?? 0,
    uploads: total.upload ?? 0,
    submits: total.submit ?? 0,
    folds: total.fold ?? 0,
    outcomes: (total.outcome_won ?? 0) + (total.outcome_lost ?? 0),
    resultsViews: total.results_viewed ?? 0,
    topDisputes: opened.map(([k, n]) => [k.slice("dispute_opened:".length), n] as const).sort((a, b) => b[1] - a[1]).slice(0, 5),
  };
}

/** Constant-time string compare for the admin token. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
