/**
 * Eval candidates from recorded outcomes.
 *   npm run eval:add -- add <downloaded-file.json>
 *   npm run eval:add -- list
 *   npm run eval:add -- confirm C31 --label Accept --deciding "E1 + E2" [--amount 1200] [--hours 48]
 * "add" only parks the file as pending. A case joins the eval set when you run "confirm", because the label must be yours.
 */
import { addPending, confirmPending, listPending } from "../lib/candidateStore";

const [cmd, ...rest] = process.argv.slice(2);
const flag = (name: string) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : undefined;
};

try {
  if (cmd === "add" && rest[0]) {
    const r = addPending(process.cwd(), rest[0]);
    console.log(`Parked as pending ${r.id} (${r.path}). The advisor's assistant proposed: ${r.proposed}.`);
    console.log(`Read the case, decide the right call yourself, then run:\n  npm run eval:add -- confirm ${r.id} --label <Fight|Accept|Escalate> --deciding "E1 + E2"`);
  } else if (cmd === "list") {
    const p = listPending(process.cwd());
    console.log(p.length ? `Pending: ${p.join(", ")}` : "Nothing pending.");
  } else if (cmd === "confirm" && rest[0]) {
    const label = flag("label");
    const deciding = flag("deciding");
    if (!label || !deciding) throw new Error('confirm needs --label and --deciding, for example: --label Accept --deciding "E1 + E2"');
    const r = confirmPending(process.cwd(), rest[0], label, deciding, {
      amountUsd: flag("amount") ? Number(flag("amount")) : undefined,
      hoursLeft: flag("hours") ? Number(flag("hours")) : undefined,
    });
    console.log(`Added ${r.caseRow.id} to data/cases.json and data/labels.json with your label: ${r.labelRow.decision}. The next npm run eval will include it.`);
  } else {
    console.log("Usage:\n  npm run eval:add -- add <file.json>\n  npm run eval:add -- list\n  npm run eval:add -- confirm <id> --label <Fight|Accept|Escalate> --deciding \"E1 + E2\"");
    process.exitCode = 1;
  }
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
}
