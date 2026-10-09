import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fixedChecklist, hasRefundRecord } from "./baseline.ts";
import type { CaseData } from "./types.ts";

const cases = (JSON.parse(readFileSync("data/cases.json", "utf8")) as { cases: CaseData[] }).cases;
const labels = (JSON.parse(readFileSync("data/labels.json", "utf8")) as { labels: { id: string; decision: string; checklist_decision: string; case_type: string }[] }).labels;
const input = (c: CaseData) => ({ reasonCode: c.dispute.reason_code, razorpayFacts: c.razorpay_facts, evidence: c.evidence });

test("the coded checklist reproduces the stored checklist answer on every case", () => {
  assert.equal(cases.length, 40);
  for (const c of cases) {
    const l = labels.find((x) => x.id === c.id)!;
    assert.equal(fixedChecklist(input(c)).call, l.checklist_decision, `${c.id}`);
  }
});

test("the checklist never answers Escalate", () => {
  for (const c of cases) assert.notEqual(fixedChecklist(input(c)).call as string, "Escalate");
});

test("it only reads document kinds: a missing document type flips it, a lie in the text does not", () => {
  const base = { reasonCode: "13.3", razorpayFacts: "", evidence: [{ id: "E1", content: "Email from client: thanks." }] };
  assert.equal(fixedChecklist(base).call, "Accept");
  assert.equal(fixedChecklist({ ...base, evidence: [{ id: "E1", content: "Signed scope of work: 10 pages." }] }).call, "Fight");
  // same document type, but what it says would make a person accept: the checklist still fights
  const c08 = cases.find((c) => c.id === "C08")!;
  assert.equal(fixedChecklist(input(c08)).call, "Fight");
});

test("refund record needs a processed refund in Razorpay's facts", () => {
  assert.equal(hasRefundRecord("Full refund of USD 96 processed on 18 Jun 2026"), true);
  assert.equal(hasRefundRecord("Payment captured. No refund recorded."), false);
  assert.equal(hasRefundRecord("no refunds"), false);
});

test("where the checklist matches the human answer, by case type (the honest scoreboard)", () => {
  const by: Record<string, { n: number; ok: number }> = {};
  for (const c of cases) {
    const l = labels.find((x) => x.id === c.id)!;
    const t = (by[l.case_type] ??= { n: 0, ok: 0 });
    t.n++;
    if (fixedChecklist(input(c)).call === l.decision) t.ok++;
  }
  assert.equal(by["Checklist-friendly"].ok, by["Checklist-friendly"].n, "on checklist-friendly cases the checklist should tie the human");
  assert.ok(by["Needs judgment"].ok < by["Needs judgment"].n);
  assert.equal(by["Messy"].ok, 0);
});
