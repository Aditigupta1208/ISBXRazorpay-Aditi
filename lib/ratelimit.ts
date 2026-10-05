/**
 * Per-IP limit: 20 checks per hour.
 * Best effort only: on serverless platforms each instance has its own memory, so this slows casual abuse
 * but is not a guarantee. The real cap on spend is the spend limit set in the Claude Console.
 */
export const LIMIT = 20;
export const WINDOW_MS = 60 * 60 * 1000;

const hits = new Map<string, number[]>();

export function allow(ip: string, now = Date.now(), limit = LIMIT): { ok: boolean; retryAfterSec: number } {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= limit) {
    hits.set(ip, recent);
    return { ok: false, retryAfterSec: Math.ceil((WINDOW_MS - (now - recent[0])) / 1000) };
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  return { ok: true, retryAfterSec: 0 };
}

export function resetRateLimit() {
  hits.clear();
}
