import facts from "@/data/prerun/key-facts-examples.json";
import { getCase } from "./data";
import { keyFactsSchema, verifyKeyFacts } from "./assistCore";
import type { SavedKeyFacts } from "./assist";

const raw = facts as unknown as { label: string; cases: Record<string, unknown> };

/**
 * Saved key facts for a demo dispute. They go through the same word-for-word check as live ones,
 * so a saved fact that does not match its document is never shown.
 */
export function getSavedKeyFacts(caseId: string): SavedKeyFacts | undefined {
  const entry = raw.cases[caseId];
  const c = getCase(caseId);
  if (!entry || !c) return undefined;
  const parsed = keyFactsSchema.safeParse({ documents: entry });
  if (!parsed.success) return undefined;
  const { docs } = verifyKeyFacts(parsed.data, c.evidence.map((e) => ({ id: e.id, text: e.content })));
  return docs.length ? { label: raw.label, docs } : undefined;
}
