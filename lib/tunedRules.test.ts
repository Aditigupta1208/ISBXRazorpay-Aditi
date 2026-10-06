import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TUNED_RULES, tunedChecklist, tunedToCall } from "./tunedRules.ts";
import { fixedChecklist } from "./baseline.ts";
import type { CaseData } from "./types.ts";

const cases = (JSON.parse(readFileSync("data/cases.json", "utf8")) as { cases: CaseData[] }).cases;
const labels = (JSON.parse(readFileSync("data/labels.json", "utf8")) as { labels: { id: string; decision: string; case_type: string }[] }).labels;
const call = (d: string) => (d === "Fight" ? "fight" : d === "Accept" ? "fold" : d === "Escalate" ? "escalate" : "shield");
const input = (c: CaseData) => ({ reasonCode: c.dispute.reason_code, razorpayFacts: c.razorpay_facts, evidence: c.evidence });
const KNOWN = ["C01","C02","C03","C04","C05","C06","C07","C08","C09","C10","C11","C12","C13","C14","C15","C16","C17","C18","C19","C20"];

test("the tuned rules get all 20 known cases right (they were written from them)", () => {
  for (const id of KNOWN) {
    const c = cases.find((x) => x.id === id)!;
    const l = labels.find((x) => x.id === id)!;
    assert.equal(tunedToCall(tunedChecklist(input(c)).call), call(l.decision), id);
  }
});

test("it took 9 hand-written rules on top of the simple checklist", () => {
  assert.equal(TUNED_RULES.length, 9);
  assert.equal(new Set(TUNED_RULES.map((r) => r.id)).size, 9);
});

test("every rule is written for at least one known case, and each known trap is covered by a rule", () => {
  for (const r of TUNED_RULES) {
    for (const id of r.writtenFor.split(/,\s*/)) assert.ok(KNOWN.includes(id), `${r.id} -> ${id}`);
  }
  // cases the simple checklist gets wrong are the ones that needed an override
  for (const id of KNOWN) {
    const c = cases.find((x) => x.id === id)!;
    const l = labels.find((x) => x.id === id)!;
    const simple = fixedChecklist(input(c)).call;
    const simpleOk = (simple === "Fight" ? "fight" : simple === "Accept" ? "fold" : "x") === call(l.decision);
    const t = tunedChecklist(input(c));
    if (!simpleOk) assert.ok(t.rule, `${id} needed a rule`);
  }
});

test("rules do not fire on the easy cases the simple checklist already got right", () => {
  for (const id of ["C01", "C03", "C04", "C06", "C07", "C10", "C11", "C13", "C20"]) {
    const c = cases.find((x) => x.id === id)!;
    assert.equal(tunedChecklist(input(c)).rule, null, id);
  }
});
