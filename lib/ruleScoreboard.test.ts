import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { scoreRules, type KeyRow } from "./ruleScoreboard.ts";
import type { CaseData } from "./types.ts";

const cases = (JSON.parse(readFileSync("data/cases.json", "utf8")) as { cases: CaseData[] }).cases;
const key = (JSON.parse(readFileSync("data/labels.json", "utf8")) as { labels: KeyRow[] }).labels;

test("known cases: the tuned rules get every one, the simple checklist 9 of 20", () => {
  const s = scoreRules(cases, key);
  assert.equal(s.known.n, 20);
  assert.equal(s.known.tuned, 20);
  assert.equal(s.known.simple, 9);
  assert.equal(s.rulesAdded, 9);
});

test("unseen cases C21 to C30 were scored once with the frozen rules: simple 7 of 10, tuned 6 of 10", () => {
  const s = scoreRules(cases, key);
  assert.equal(s.unseen.n, 10);
  assert.equal(s.unseen.simple, 7);
  assert.equal(s.unseen.tuned, 6);
  assert.deepEqual(s.unseen.simpleMisses, ["C23", "C24", "C30"]);
  assert.deepEqual(s.unseen.tunedMisses.map((m) => m.id), ["C22", "C23", "C24", "C30"]);
  assert.equal(s.unseen.tunedMisses.find((m) => m.id === "C22")!.rule, "T2", "a rule written for C02 broke C22");
});

test("the labels for the unseen cases are marked as not yet confirmed", () => {
  assert.equal(scoreRules(cases, key).unseen.unconfirmed, 10);
});
