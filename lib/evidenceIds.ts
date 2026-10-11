import type { CheckView } from "./types";

/**
 * Added documents are numbered after the built-in ones (E5, E6, ...) and renumbered when one is removed.
 * An older result on screen still cites the old numbers, so these helpers rewrite them: a citation of the
 * removed document disappears, and later ones move up. Built-in documents never change.
 */
export type IdMap = Map<string, string | null>;

/** old id -> new id (null = removed) for the documents added after the built-in ones. */
export function renumberMap(baseCount: number, addedIds: string[], removeId: string): IdMap {
  const map: IdMap = new Map();
  let next = baseCount + 1;
  for (const id of addedIds) {
    if (id === removeId) map.set(id, null);
    else map.set(id, `E${next++}`);
  }
  return map;
}

// One pass over the text, so an id that has already been rewritten is never rewritten again.
const TOKEN = /\[\s*((?:E\d+|Razorpay)(?:\s*,\s*(?:E\d+|Razorpay))*)\s*\]|\bE\d+\b/g;

/** Rewrite citations like [E5] or [E4, E6], and bare mentions such as "E6 conflicts with E2". */
export function remapText(text: string, map: IdMap): string {
  if (!text || map.size === 0) return text;
  const look = (id: string): string | null => (map.has(id) ? (map.get(id) ?? null) : id);
  const out = text.replace(TOKEN, (m: string, inner: string | undefined) => {
    if (inner === undefined) return look(m) ?? "a removed document";
    const kept = inner
      .split(/\s*,\s*/)
      .map(look)
      .filter((p): p is string => p !== null);
    return kept.length ? `[${kept.join(", ")}]` : "";
  });
  return out.replace(/ +([.,;!?])/g, "$1").replace(/ {2,}/g, " ").trim();
}

export function remapIds(ids: string[], map: IdMap): string[] {
  const out: string[] = [];
  for (const id of ids) {
    const n = map.has(id) ? map.get(id) : id;
    if (n && !out.includes(n)) out.push(n);
  }
  return out;
}

export function remapView(view: CheckView, map: IdMap): CheckView {
  if (map.size === 0) return view;
  return {
    ...view,
    reason: remapText(view.reason, map),
    draft: remapText(view.draft, map),
    decidingEvidence: remapIds(view.decidingEvidence, map),
    contradictions: view.contradictions.map((c) => remapText(c, map)),
    missingEvidence: view.missingEvidence.map((m) => remapText(m, map)),
    slots: view.slots.flatMap((s) => {
      const n = map.has(s.evidenceId) ? map.get(s.evidenceId) : s.evidenceId;
      return n ? [{ ...s, evidenceId: n }] : [];
    }),
    evidenceFlags: view.evidenceFlags?.flatMap((f) => {
      const n = map.has(f.evidenceId) ? map.get(f.evidenceId) : f.evidenceId;
      return n ? [{ ...f, evidenceId: n }] : [];
    }),
  };
}
