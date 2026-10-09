/** npm run eval: runs every case through the live agent and writes the results. Needs ANTHROPIC_API_KEY, GROQ_API_KEY or GEMINI_API_KEY.
 * On Groq it runs one case at a time with a pause (EVAL_CONCURRENCY and EVAL_PAUSE_MS override), so the free plan's per-minute limit is not hit. */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getLlm } from "../lib/llm";
import { releaseGate, runAll, summarize, toMarkdown, type LabelRow } from "../lib/eval";
import { PROMPT_VERSION, loadPrompt } from "../lib/prompt";
import type { CaseData } from "../lib/types";

async function main() {
  const { callModel, model, provider } = getLlm();
  if (!callModel) {
    console.error("No API key. Put ANTHROPIC_API_KEY, GROQ_API_KEY or GEMINI_API_KEY in .env.local and run again. Nothing was written.");
    process.exit(1);
  }
  const cases = (JSON.parse(readFileSync("data/cases.json", "utf8")) as { cases: CaseData[] }).cases;
  const labels = (JSON.parse(readFileSync("data/labels.json", "utf8")) as { labels: LabelRow[] }).labels;
  const prompt = loadPrompt();
  const date = new Date().toISOString().slice(0, 10);
  // EVAL_OUT_DIR lets a test run against a stand-in server write somewhere that is not eval/results.
  const dir = process.env.EVAL_OUT_DIR || "eval/results";

  const slow = provider === "groq" || provider === "gemini";
  const concurrency = Math.max(1, Number(process.env.EVAL_CONCURRENCY) || (slow ? 1 : 4));
  const pauseMs = Number.isFinite(Number(process.env.EVAL_PAUSE_MS)) && process.env.EVAL_PAUSE_MS ? Number(process.env.EVAL_PAUSE_MS) : slow ? 45_000 : 0;
  console.log(`Running ${cases.length} cases: prompt ${PROMPT_VERSION}, model ${model}${slow ? `, one at a time with a ${pauseMs / 1000} s pause (about ${Math.round((cases.length * (pauseMs / 1000 + 10)) / 60)} minutes)` : ""}`);
  const rows = await runAll(
    cases,
    labels,
    { callModel, model, system: prompt.system, toolSchema: prompt.toolSchema, getSaved: () => undefined },
    concurrency,
    (r) => console.log(`  ${r.id}: label ${r.label}, model said ${r.raw ?? "none"}, final ${r.final ?? "none"}${r.answeredBy && r.answeredBy !== model ? ` (answered by backup ${r.answeredBy})` : ""}`),
    pauseMs,
  );
  // Free plans run out of tokens partway through a long run. Cases with no answer are tried again after a wait,
  // and a run that still has blanks is NOT written as a result, so a partial run can never pass as a score.
  const retryRounds = Number.isFinite(Number(process.env.EVAL_RETRY_ROUNDS)) && process.env.EVAL_RETRY_ROUNDS ? Number(process.env.EVAL_RETRY_ROUNDS) : slow ? 5 : 0;
  const retryWaitMs = Number.isFinite(Number(process.env.EVAL_RETRY_WAIT_MS)) && process.env.EVAL_RETRY_WAIT_MS ? Number(process.env.EVAL_RETRY_WAIT_MS) : 8 * 60_000;
  for (let round = 1; round <= retryRounds; round++) {
    const blank = rows.map((r, i) => (r.status === "failed" ? i : -1)).filter((i) => i >= 0);
    if (blank.length === 0) break;
    console.log(`Round ${round}: ${blank.length} case(s) got no answer (${blank.map((i) => rows[i].id).join(", ")}). Waiting ${Math.round(retryWaitMs / 60000)} min, then trying them again.`);
    await new Promise((r) => setTimeout(r, retryWaitMs));
    const again = await runAll(
      blank.map((i) => cases[i]),
      labels,
      { callModel, model, system: prompt.system, toolSchema: prompt.toolSchema, getSaved: () => undefined },
      concurrency,
      (r) => console.log(`  retry ${r.id}: label ${r.label}, model said ${r.raw ?? "none"}, final ${r.final ?? "none"}${r.answeredBy && r.answeredBy !== model ? ` (answered by backup ${r.answeredBy})` : ""}`),
      pauseMs,
    );
    blank.forEach((i, k) => (rows[i] = again[k]));
  }
  const stillBlank = rows.filter((r) => r.status === "failed").map((r) => r.id);
  const summary = summarize(rows);
  const run = { prompt: PROMPT_VERSION, model, date };
  // An incomplete run goes beside the results, never into them: the Evals page and the gate read eval/results only.
  const outDir = stillBlank.length > 0 ? path.join(path.dirname(dir), "incomplete") : dir;
  mkdirSync(outDir, { recursive: true });
  const base = path.join(outDir, `${PROMPT_VERSION}-${model.replace(/[^A-Za-z0-9._-]/g, "-")}-${date}`); // model ids can contain "/"
  writeFileSync(`${base}.json`, JSON.stringify({ run, summary, rows }, null, 2) + "\n");
  writeFileSync(`${base}.md`, toMarkdown(run, rows, summary));
  console.log(`Wrote ${base}.json and ${base}.md`);
  if (stillBlank.length > 0) {
    console.log(`INCOMPLETE: ${stillBlank.length} of ${rows.length} cases still have no answer (${stillBlank.join(", ")}). Saved to ${outDir}, not to ${dir}. This is not a score.`);
    process.exitCode = 3;
    return;
  }
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
