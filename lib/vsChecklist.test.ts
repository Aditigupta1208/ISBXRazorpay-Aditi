import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { compareWithChecklist } from "./vsChecklist.ts";
import type { CaseData } from "./types.ts";

const cases = (JSON.parse(readFileSync("data/cases.json", "utf8")) as { cases: CaseData[] }).cases;
const inp = (id: string) => {
  const c = cases.find((x) => x.id === id)!;
  return { reasonCode: c.dispute.reason_code, razorpayFacts: c.razorpay_facts, evidence: c.evidence };
};

test("agree when the checklist and the agent give the same advice", () => {
  const r = compareWithChecklist(inp("C10"), "fight")!;
  assert.equal(r.agree, true);
  assert.equal(r.checklist, "Fight");
});

test("a checklist Accept matches a Fold", () => {
  assert.equal(compareWithChecklist(inp("C11"), "fold")!.agree, true);
});

test("they differ when the agent folds where the checklist fights (C14: terms page but no acceptance)", () => {
  const r = compareWithChecklist(inp("C14"), "fold")!;
  assert.equal(r.agree, false);
  assert.equal(r.checklist, "Fight");
  assert.equal(r.agentWord, "Fold");
});

test("Escalate is never the same as the checklist's answer", () => {
  assert.equal(compareWithChecklist(inp("C15"), "escalate")!.agree, false);
  assert.equal(compareWithChecklist(inp("C11"), "escalate")!.agree, false);
});

test("fraud codes have no checklist", () => {
  assert.equal(compareWithChecklist(inp("C16"), "fold"), null);
});
