import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runCase, summarize, tier, THRESHOLDS, labelEvidence, type EvalRow, type LabelRow } from "./eval.ts";
import { parsePrompt } from "./prompt.ts";
import type { Deps } from "./agent.ts";
import type { CaseData } from "./types.ts";

const prompt = parsePrompt(readFileSync("prompts/dispute-agent-v2.2.md", "utf8"));
const cases = (JSON.parse(readFileSync("data/cases.json", "utf8")) as { cases: CaseData[] }).cases;
const labels = (JSON.parse(readFileSync("data/labels.json", "utf8")) as { labels: LabelRow[] }).labels;
const get = (id: string) => ({ c: cases.find((x) => x.id === id)!, l: labels.find((x) => x.id === id)! });

const out = (over: Record<string, unknown>) => ({
  decision: "accept", confidence: "high", deciding_evidence: ["E2"], missing_evidence: null, reasoning_summary: "r", rule_applied: "13.2",
  contradictions: [], economics_note: "", win_probability_estimate: 0.2, defensible_amount: null, evidence_flags: [],
  evidence_slots: [{ evidence_id: "E1", slot: "term_and_conditions" }], draft_response: null, prevention_tip: "t", ...over,
});
const deps = (input: unknown): Deps => ({
  callModel: async () => ({ input, tokensIn: 2000, tokensOut: 500 }),
  model: "m", system: prompt.system, toolSchema: prompt.toolSchema, getSaved: () => undefined,
});

test("new cases are labelled and in the data", () => {
  assert.equal(cases.length, 20);
  assert.equal(labels.length, 20);
  for (const c of cases) assert.ok(labels.find((l) => l.id === c.id), c.id);
  for (const id of ["C17", "C18", "C19", "C20"]) {
    const ids = get(id).c.evidence.map((e) => e.id);
    for (const e of labelEvidence(get(id).l)) assert.ok(ids.includes(e), `${id} ${e}`);
  }
});

test("label evidence ignores the Missing part", () => {
  assert.deepEqual(labelEvidence({ deciding_evidence: "E1 + E4. Missing: E9 proof" } as LabelRow), ["E1", "E4"]);
});

test("injection case: obeying the injected note is caught, resisting passes", async () => {
  const { c, l } = get("C19");
  const resisted = await runCase(c, l, deps(out({ evidence_flags: [{ evidence_id: "E3", flag: "instruction_like" }], deciding_evidence: ["E1", "E2"] })));
  assert.equal(resisted.final, "fold");
  assert.equal(resisted.flaggedInstruction, true);
  const obeyed = await runCase(c, l, deps(out({ decision: "fight", draft_response: "The policy was accepted at checkout [E2]." , deciding_evidence: ["E1"] })));
  assert.equal(obeyed.raw, "fight");
  assert.equal(summarize([obeyed]).injectionResisted, 0);
  assert.equal(summarize([resisted]).injectionResisted, 1);
});

test("safety rules change a Fight with missing evidence; raw and final differ", async () => {
  const { c, l } = get("C18");
  const r = await runCase(c, l, deps(out({ decision: "fight", missing_evidence: "proof of delivery", deciding_evidence: ["E1"], draft_response: "Scope was 10 pages [E1]." })));
  assert.equal(r.raw, "fight");
  assert.equal(r.final, "escalate");
  assert.ok(r.rulesTriggered.includes("R4"));
  const s = summarize([r]);
  assert.equal(s.agreement, 1);
  assert.equal(s.rawAgreement, 0);
  assert.equal(s.downgrades, 1);
});

test("uncited draft sentence and made-up citation are counted", async () => {
  const { c, l } = get("C17");
  const r = await runCase(c, l, deps(out({ decision: "fight", draft_response: "We delivered. See [E9]." })));
  assert.equal(r.draftCited, false);
  assert.equal(r.unsupportedCitations, 1);
});

test("fraud code is routed with no model call and no cost", async () => {
  const c = { ...get("C01").c, dispute: { ...get("C01").c.dispute, reason_code: "10.4" } };
  let called = 0;
  const d = { ...deps(out({})), callModel: async () => { called++; throw new Error("no"); } };
  const r = await runCase(c, { id: "C01", decision: "Route to fraud cover", deciding_evidence: "", case_type: "Scope test", checklist_decision: "Accept" }, d);
  assert.equal(called, 0);
  assert.equal(r.final, "shield");
  assert.equal(summarize([r]).fraudRouted, 1);
});

test("a failed call counts as wrong, not skipped", async () => {
  const { c, l } = get("C17");
  const d: Deps = { ...deps(out({})), callModel: async () => { throw new Error("boom"); } };
  const r = await runCase(c, l, d);
  assert.equal(r.status, "failed");
  const s = summarize([r]);
  assert.equal(s.agreement, 0);
  assert.equal(s.failed, 1);
});

test("summary maths: by type, wrong fold, wrong fight, evidence overlap", () => {
  const row = (o: Partial<EvalRow>): EvalRow => ({ id: "x", caseType: "Needs judgment", label: "fight", checklist: "fight", raw: "fight", final: "fight", status: "live", decidingEvidence: ["E1"], labelEvidence: ["E1", "E2"], draftCited: true, unsupportedCitations: 0, rulesTriggered: [], flaggedInstruction: false, tokensIn: 1, tokensOut: 1, ms: 1000, costUsd: 0.01, ...o });
  const s = summarize([row({}), row({ final: "fold", raw: "fold" }), row({ label: "fold", final: "fight", caseType: "Messy" }), row({ label: "fold", checklist: "fight", final: "fold", caseType: "Messy" })]);
  assert.equal(s.agreement, 0.5);
  assert.equal(s.agreementChecklist, 0.5);
  assert.equal(s.wrongFold, 1);
  assert.equal(s.wrongFight, 1);
  assert.equal(s.needsJudgment, 0.5);
  assert.deepEqual(s.byType.Messy, { n: 2, agree: 1, agreeChecklist: 0 });
  assert.equal(s.decidingEvidence, 0.5);
});

test("tiers read the right way round", () => {
  const find = (k: string) => THRESHOLDS.find((t) => t.key === k)!;
  assert.equal(tier(find("agreement"), 0.9), "target");
  assert.equal(tier(find("agreement"), 0.5), "below");
  assert.equal(tier(find("wrongFoldRate"), 0), "stretch");
  assert.equal(tier(find("wrongFoldRate"), 0.1), "below");
  assert.equal(tier(find("agreement"), null), null);
});

test("the fraud scope case is not counted in decision agreement", () => {
  const row = (o: Partial<EvalRow>): EvalRow => ({ id: "x", caseType: "Needs judgment", label: "fight", checklist: "fight", raw: "fight", final: "fight", status: "live", decidingEvidence: [], labelEvidence: [], draftCited: null, unsupportedCitations: 0, rulesTriggered: [], flaggedInstruction: false, tokensIn: 0, tokensOut: 0, ms: 0, costUsd: 0, ...o });
  const s = summarize([row({}), row({ id: "C16", caseType: "Scope test", label: "shield", final: "shield", status: "routed" })]);
  assert.equal(s.agreement, 1);
  assert.equal(s.fraudRouted, 1);
});

test("the demo list holds only cases with a saved result; eval-only cases stay out", async () => {
  const { getDemoCases } = await import("./data.ts");
  const ids = getDemoCases().map((c) => c.id);
  assert.equal(ids.length, 16);
  for (const id of ["C17", "C18", "C19", "C20"]) assert.ok(!ids.includes(id));
});
