/** npm run eval: runs every case through the live agent and writes the results. Needs ANTHROPIC_API_KEY. */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DEFAULT_MODEL, makeCallModel } from "../lib/anthropic";
import { releaseGate, runAll, summarize, toMarkdown, type LabelRow } from "../lib/eval";
import { PROMPT_VERSION, loadPrompt } from "../lib/prompt";
import type { CaseData } from "../lib/types";

async function main() {
  const callModel = makeCallModel(process.env.ANTHROPIC_API_KEY);
  if (!callModel) {
    console.error("No ANTHROPIC_API_KEY. Put it in .env.local and run again. Nothing was written.");
    process.exit(1);
  }
  const cases = (JSON.parse(readFileSync("data/cases.json", "utf8")) as { cases: CaseData[] }).cases;
  const labels = (JSON.parse(readFileSync("data/labels.json", "utf8")) as { labels: LabelRow[] }).labels;
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  const prompt = loadPrompt();
  const date = new Date().toISOString().slice(0, 10);
  // EVAL_OUT_DIR lets a test run against a stand-in server write somewhere that is not eval/results.
  const dir = process.env.EVAL_OUT_DIR || "eval/results";

  console.log(`Running ${cases.length} cases: prompt ${PROMPT_VERSION}, model ${model}`);
  const rows = await runAll(
    cases,
    labels,
    { callModel, model, system: prompt.system, toolSchema: prompt.toolSchema, getSaved: () => undefined },
    4,
    (r) => console.log(`  ${r.id}: label ${r.label}, model ${r.raw ?? "none"}, final ${r.final ?? "none"}`),
  );
  const summary = summarize(rows);
  const run = { prompt: PROMPT_VERSION, model, date };
  mkdirSync(dir, { recursive: true });
  const base = path.join(dir, `${PROMPT_VERSION}-${model}-${date}`);
  writeFileSync(`${base}.json`, JSON.stringify({ run, summary, rows }, null, 2) + "\n");
  writeFileSync(`${base}.md`, toMarkdown(run, rows, summary));
  console.log(`Wrote ${base}.json and ${base}.md`);
  // Release gate: a prompt or model change ships only if nothing is below its launch bar. Use --gate to fail the command when it is.
  const gate = releaseGate(summary);
  console.log(gate.pass ? "Release gate: PASS" : "Release gate: FAIL");
  for (const l of gate.lines) console.log(`  ${l.ok ? "ok  " : "FAIL"} ${l.label}: ${l.value === null ? "no data" : Math.round(l.value * 100) + "%"}${l.tier ? ` (${l.tier})` : ""}`);
  if (!gate.pass && process.argv.includes("--gate")) process.exitCode = 2;
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
