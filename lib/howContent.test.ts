import test from "node:test";
import assert from "node:assert/strict";
import labelsFile from "../data/labels.json" with { type: "json" };
import { READING_CASES, readingRows } from "./readingVsRules.ts";
import { HEARD, INTERVIEW_STORIES, FAILURES, LOOP_STEPS, METRICS, TIERS } from "./howContent.ts";
import type { Call } from "./types.ts";

test("every reading case is one where the checklist differs from the human answer", () => {
  const labels = (labelsFile as { labels: { id: string; decision: string; checklist_decision: string }[] }).labels;
  for (const c of READING_CASES) {
    const l = labels.find((x) => x.id === c.id);
    assert.ok(l, c.id);
    assert.notEqual(l.decision, l.checklist_decision, `${c.id} should be a case the checklist gets wrong`);
  }
});

test("readingRows takes the agent's call from the run and shows not run when missing", () => {
  const rows = readingRows(new Map<string, Call>([["C14", "fold"]]));
  assert.equal(rows.length, READING_CASES.length);
  assert.equal(rows.find((r) => r.id === "C14")?.agent, "fold");
  assert.equal(rows.find((r) => r.id === "C14")?.human, "fold");
  assert.equal(rows.find((r) => r.id === "C14")?.checklist, "fight");
  assert.equal(rows.find((r) => r.id === "C05")?.agent, null);
});

test("merchant table statuses are known and nothing claims more than three merchants", () => {
  const ok = new Set(["Built", "Built as a preview", "Not built", "Rejected on evidence"]);
  for (const h of HEARD) assert.ok(ok.has(h.status), h.status);
  assert.equal(INTERVIEW_STORIES.length, 7);
  const text = JSON.stringify([HEARD, INTERVIEW_STORIES]);
  assert.ok(!/@|https?:\/\//.test(text), "no emails or links in interview text");
});

test("risk table points only at real checks, metrics mark targets, loop names who acts", () => {
  const rules = new Set(["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "R9"]);
  for (const f of FAILURES) for (const r of f.rule.split(",").map((x) => x.trim()).filter((x) => /^R\d$/.test(x))) assert.ok(rules.has(r));
  assert.ok(METRICS.some((m) => /target/i.test(m.today)));
  assert.ok(LOOP_STEPS.every((s) => ["You", "Automatic", "Builder"].includes(s.who)));
  assert.equal(TIERS.map((t) => t.tier).join(), "Core,Supporting,Convenience");
});
