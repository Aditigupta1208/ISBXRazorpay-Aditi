/**
 * Free model APIs are often overloaded. When a model has just failed (overload, rate limit, timeout),
 * try the others first for a minute, so a visitor does not wait for the same busy model again.
 * Per server instance, in memory. Models are never dropped, only tried last.
 */
const BAD_FOR_MS = 60_000;
const bad = new Map<string, number>();

export function markBad(model: string, now = Date.now()) {
  bad.set(model, now + BAD_FOR_MS);
}

export function healthyFirst(models: string[], now = Date.now()): string[] {
  const ok = models.filter((m) => (bad.get(m) ?? 0) <= now);
  const recentlyBad = models.filter((m) => (bad.get(m) ?? 0) > now);
  return [...ok, ...recentlyBad];
}

export function resetModelHealth() {
  bad.clear();
}
