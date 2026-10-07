import file from "@/data/prerun/bank-rebuttal-examples.json";
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
  return parsed.success ? { output: parsed.data, forDraft: view.draft, label: raw.label } : undefined;
}
