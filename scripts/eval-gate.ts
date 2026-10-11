// Keyless release gate: reads the latest saved run in eval/results and prints PASS or FAIL. Exits 2 on FAIL.
import path from "node:path";
import { loadLatestRun } from "../lib/evalView";
import { releaseGate } from "../lib/eval";

const latest = loadLatestRun(path.join(process.cwd(), "eval", "results"));
if (!latest) {
  console.log("No saved run in eval/results. Run npm run eval first.");
  process.exit(1);
}
const gate = releaseGate(latest.summary);
console.log(`${gate.pass ? "Release gate: PASS" : "Release gate: FAIL"} (prompt ${latest.run.prompt}, ${latest.run.date})`);
for (const l of gate.lines) console.log(`  ${l.ok ? "ok  " : "FAIL"} ${l.label}: ${l.value === null ? "no data" : Math.round(l.value * 100) + "%"}${l.tier ? ` (${l.tier})` : ""}`);
if (!gate.pass) process.exitCode = 2;
