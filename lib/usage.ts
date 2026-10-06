/**
 * Anonymous usage counters, so the builder can see how reviewers used the demo.
 * Stores only counts per fixed event name (and per demo dispute ID). No names, emails, IPs, cookies or evidence text.
 * Optional: with no database configured every call is a no-op and the app is unchanged.
 * Backend: Upstash Redis over its REST API (free tier, from the Vercel Marketplace).
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
  token: string;
}

export function backendFrom(env: Record<string, string | undefined>): Backend | null {
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  if (!url || !token || !/^https?:\/\//.test(url)) return null;
  return { url: url.replace(/\/$/, ""), token };
}

/** The counter field for an event, or null if the event or ID is not on the allowlist. */
export function fieldFor(event: unknown, id: unknown, validCaseIds: string[]): string | null {
  if (typeof event !== "string" || !(EVENTS as readonly string[]).includes(event)) return null;
  if (event === "dispute_opened") {
    return typeof id === "string" && validCaseIds.includes(id) ? `dispute_opened:${id}` : null;
  }
  return event;
}

const TOTAL = "da:usage:total";
const dayKey = (d: Date) => `da:usage:day:${d.toISOString().slice(0, 10)}`;

async function pipeline(fetchFn: typeof fetch, b: Backend, commands: (string | number)[][]): Promise<unknown[] | null> {
  try {
    const res = await fetchFn(`${b.url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${b.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(commands),
      signal: AbortSignal.timeout(2500),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const out = (await res.json()) as { result?: unknown; error?: string }[];
    return Array.isArray(out) ? out.map((o) => o.result) : null;
  } catch {
    return null;
  }
}

/** Add one to the total and to today's count. Never throws. */
export async function record(fetchFn: typeof fetch, b: Backend, field: string, now = new Date()): Promise<boolean> {
  const day = dayKey(now);
  const r = await pipeline(fetchFn, b, [
    ["HINCRBY", TOTAL, field, 1],
    ["HINCRBY", day, field, 1],
    ["EXPIRE", day, 60 * 60 * 24 * 400],
  ]);
  return r !== null;
}

export interface UsageReport {
  total: Record<string, number>;
  days: Record<string, Record<string, number>>;
}

function toMap(flat: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!Array.isArray(flat)) return out;
  for (let i = 0; i + 1 < flat.length; i += 2) out[String(flat[i])] = Number(flat[i + 1]) || 0;
  return out;
}

export async function readUsage(fetchFn: typeof fetch, b: Backend, days = 14, now = new Date()): Promise<UsageReport | null> {
  const dates = Array.from({ length: days }, (_, i) => new Date(now.getTime() - i * 86_400_000));
  const r = await pipeline(fetchFn, b, [["HGETALL", TOTAL], ...dates.map((d) => ["HGETALL", dayKey(d)])]);
  if (!r) return null;
  const report: UsageReport = { total: toMap(r[0]), days: {} };
  dates.forEach((d, i) => {
    const m = toMap(r[i + 1]);
    if (Object.keys(m).length) report.days[d.toISOString().slice(0, 10)] = m;
  });
  return report;
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
