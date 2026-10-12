import file from "@/data/prerun/bank-rebuttal-examples.json";
import afterFile from "@/data/prerun/bank-rebuttal-after.json";
import { getCheckView } from "./data";
import { rebuttalSchema } from "./rebuttalCore";
import type { SavedRebuttal } from "./rebuttal";

const raw = file as unknown as { label: string; cases: Record<string, unknown> };

/** The saved example for a demo dispute. It is tied to the saved draft, so it is only used while that draft is unchanged. */
export function getSavedRebuttal(caseId: string): SavedRebuttal | undefined {
  const entry = raw.cases[caseId];
  const view = getCheckView(caseId);
  if (!entry || !view?.draft) return undefined;
  const parsed = rebuttalSchema.safeParse(entry);
  return parsed.success ? { output: parsed.data, forDraft: view.draft, label: (entry as { label?: string }).label ?? raw.label } : undefined;
}

const rawAfter = afterFile as unknown as { label: string; cases: Record<string, unknown> };

/** What the bank test says after the merchant uses the saved rewrite. Shown only when the draft on screen is exactly that rewrite. */
export function getSavedRebuttalAfter(caseId: string): { output: SavedRebuttal["output"]; label: string } | undefined {
  const entry = rawAfter.cases[caseId];
  if (!entry) return undefined;
  const parsed = rebuttalSchema.safeParse(entry);
  return parsed.success ? { output: parsed.data, label: rawAfter.label } : undefined;
}
