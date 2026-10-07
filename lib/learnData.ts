import file from "@/data/prerun/learning-example.json";
import { checkLearning, learnSchema, type LearnStats } from "./assistCore";
import type { SavedLearning } from "./assist";

const raw = file as unknown as { label: string; forStats: LearnStats; output: unknown };

/** The saved suggestion for the sample history. It is checked against its own counts, so a wrong number is never shown. */
export function getSavedLearning(): SavedLearning | undefined {
  const parsed = learnSchema.safeParse(raw.output);
  if (!parsed.success || checkLearning(parsed.data, raw.forStats) !== null) return undefined;
  return { label: raw.label, forStats: raw.forStats, output: parsed.data };
}
