/** File handling for the eval-candidate intake. Everything is relative to `root` so tests can use a temp folder. */
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DECISIONS, nextCaseId, parseCandidate, promote, type Candidate, type Decision } from "./candidate";

const j = (p: string) => JSON.parse(readFileSync(p, "utf8"));
const w = (p: string, v: unknown) => writeFileSync(p, JSON.stringify(v, null, 2) + "\n");

const dirs = (root: string) => ({
  pending: path.join(root, "data", "eval-candidates", "pending"),
  added: path.join(root, "data", "eval-candidates", "added"),
  cases: path.join(root, "data", "cases.json"),
  labels: path.join(root, "data", "labels.json"),
});

/** Step 1: validate a downloaded file and park it as pending. It does NOT touch cases.json or labels.json. */
export function addPending(root: string, file: string): { id: string; path: string; proposed: Decision } {
  const d = dirs(root);
  const parsed = parseCandidate(j(file));
  if (!parsed.ok) throw new Error("This file cannot be added yet:\n- " + parsed.problems.join("\n- "));
  mkdirSync(d.pending, { recursive: true });
  const existing = [
    ...(j(d.cases).cases as { id: string }[]).map((c) => c.id),
    ...(existsSync(d.pending) ? readdirSync(d.pending).map((f) => f.replace(/\.json$/, "")) : []),
  ];
  const id = nextCaseId(existing);
  const dest = path.join(d.pending, `${id}.json`);
  w(dest, parsed.candidate);
  return { id, path: dest, proposed: parsed.candidate.proposed_label };
}

export function listPending(root: string): string[] {
  const d = dirs(root);
  return existsSync(d.pending) ? readdirSync(d.pending).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")) : [];
}

/** Step 2: the builder confirms the label. Only now does the case join the eval set. */
export function confirmPending(root: string, id: string, label: string, deciding: string, extra: { amountUsd?: number; hoursLeft?: number; today?: string } = {}) {
  const d = dirs(root);
  const file = path.join(d.pending, `${id}.json`);
  if (!existsSync(file)) throw new Error(`No pending candidate ${id}. Run the list command to see what is waiting.`);
  if (!(DECISIONS as readonly string[]).includes(label)) throw new Error(`The label must be one of ${DECISIONS.join(", ")}. Yours: ${label}`);
  const cases = j(d.cases);
  if ((cases.cases as { id: string }[]).some((c) => c.id === id)) throw new Error(`${id} is already in the eval set.`);
  const cand = j(file) as Candidate;
  const { caseRow, labelRow } = promote(cand, { id, decision: label as Decision, deciding, ...extra });
  const labels = j(d.labels);
  cases.cases.push(caseRow);
  labels.labels.push(labelRow);
  w(d.cases, cases);
  w(d.labels, labels);
  mkdirSync(d.added, { recursive: true });
  renameSync(file, path.join(d.added, `${id}.json`));
  return { caseRow, labelRow };
}
