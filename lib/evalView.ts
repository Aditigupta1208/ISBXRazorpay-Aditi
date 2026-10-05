/** Server-only: builds what the /evals page shows. Reads eval/results/*.json at request time. */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import labelsFile from "@/data/labels.json";
import claudeRun from "@/data/prerun/kill-test-v1-claude.json";
import { getCases, getSavedResult, toCall } from "./data";
import { citedIds, sentenceHasSource, splitSentences, type FinalCall } from "./guardrails";
import { summarize, type EvalRow, type LabelRow, type Summary } from "./eval";

const labels = (labelsFile as { labels: LabelRow[] }).labels;

export interface LatestRun {
  run: { prompt: string; model: string; date: string };
  summary: Summary;
  rows: EvalRow[];
}

/** Newest automated run in eval/results (by file name date), or null if there is none yet. */
export function loadLatestRun(dir = path.join(process.cwd(), "eval", "results")): LatestRun | null {
  try {
    const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
    const f = files[files.length - 1];
    return f ? (JSON.parse(readFileSync(path.join(dir, f), "utf8")) as LatestRun) : null;
  } catch {
    return null;
  }
}

/** Rows for the saved v1 ChatGPT run, so it is scored with the same code as the automated run. */
export function savedV1Rows(): EvalRow[] {
  const rows: EvalRow[] = [];
  for (const c of getCases()) {
    const l = labels.find((x) => x.id === c.id);
    const s = getSavedResult(c.id);
    if (!l || !s) continue;
    const draft = (s.draft ?? "").trim();
    const evIds = c.evidence.map((e) => e.id);
    rows.push({
      id: c.id,
      caseType: l.case_type,
      label: toCall(l.decision) as FinalCall,
      checklist: toCall(l.checklist_decision) as FinalCall,
      raw: s.call,
      final: s.call,
      status: s.call === "shield" ? "routed" : "live",
      confidence: s.confidence,
      decidingEvidence: s.decidingEvidence,
      labelEvidence: [...new Set((l.deciding_evidence.split(/missing:/i)[0].match(/E\d+/g) ?? []))],
      draftCited: draft ? splitSentences(draft).every(sentenceHasSource) && citedIds(draft).every((x) => x === "Razorpay" || evIds.includes(x)) : null,
      unsupportedCitations: draft ? citedIds(draft).filter((x) => x !== "Razorpay" && !evIds.includes(x)).length : 0,
      rulesTriggered: [],
      flaggedInstruction: false,
      tokensIn: 0,
      tokensOut: 0,
      ms: 0,
      costUsd: 0,
    });
  }
  return rows;
}

export function claudeEarlyCall(id: string): FinalCall | null {
  const r = (claudeRun as { results: { id: string; decision: string }[] }).results.find((x) => x.id === id);
  return r ? (toCall(r.decision) as FinalCall) : null;
}

export function evalLabels(): LabelRow[] {
  return labels;
}

export function savedV1Summary(): Summary {
  return summarize(savedV1Rows());
}
