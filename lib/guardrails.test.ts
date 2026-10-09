import test from "node:test";
import assert from "node:assert/strict";
import { containsCardNumber, evaluateGuardrails, splitSentences, sentenceHasSource, type GuardrailInput } from "./guardrails.ts";

const base: GuardrailInput = {
  reasonCode: "13.2",
  call: "fight",
  confidence: "High",
  decidingEvidence: ["E3", "E4"],
  missingEvidence: [],
  evidenceIds: ["E1", "E2", "E3", "E4"],
  evidenceTexts: ["Login log: logged in on 5 May"],
  draft: "The customer cancelled after the charge. [E3] The customer kept using the service. [E4]",
  documentCount: 2,
  schemaOk: true,
};
const status = (r: ReturnType<typeof evaluateGuardrails>, id: string) => r.lines.find((l) => l.id === id)?.status;

test("clean Fight passes every rule", () => {
  const r = evaluateGuardrails(base);
  assert.equal(r.finalCall, "fight");
  assert.deepEqual(r.submitBlockers, []);
  for (const l of r.lines) assert.notEqual(l.status, "blocked");
});

test("R5: fraud code is routed to Chargeback Shield", () => {
  const r = evaluateGuardrails({ ...base, reasonCode: "10.4", call: "shield" });
  assert.equal(r.finalCall, "shield");
  assert.equal(status(r, "R5"), "changed");
});

test("R4: Fight with low confidence becomes Escalate", () => {
  const r = evaluateGuardrails({ ...base, confidence: "Low" });
  assert.equal(r.finalCall, "escalate");
  assert.equal(status(r, "R4"), "changed");
});

test("R4: Fight with missing evidence becomes Escalate", () => {
  const r = evaluateGuardrails({ ...base, missingEvidence: ["A signed contract"] });
  assert.equal(r.finalCall, "escalate");
  assert.match(r.changedReason ?? "", /complete evidence/);
});

test("R4 does not touch a Fold", () => {
  const r = evaluateGuardrails({ ...base, call: "fold", confidence: "Low" });
  assert.equal(r.finalCall, "fold");
});

test("R3: deciding evidence that does not exist becomes Escalate", () => {
  const r = evaluateGuardrails({ ...base, decidingEvidence: ["E9"] });
  assert.equal(r.finalCall, "escalate");
  assert.equal(status(r, "R3"), "changed");
});

test("R3: Razorpay's own record is a valid deciding source, and a made-up one still is not", () => {
  const ok = evaluateGuardrails({ ...base, decidingEvidence: ["E3", "Razorpay"] });
  assert.equal(ok.finalCall, "fight");
  assert.equal(status(ok, "R3"), "pass");
  const bad = evaluateGuardrails({ ...base, decidingEvidence: ["Razorpay", "E9"] });
  assert.equal(bad.finalCall, "escalate");
  assert.match(bad.changedReason ?? "", /E9/);
  assert.ok(!(bad.changedReason ?? "").includes("Razorpay,"));
});

test("R2: sentence without a source blocks submit", () => {
  const r = evaluateGuardrails({ ...base, draft: "The customer cancelled after the charge. [E3] They kept using it." });
  assert.equal(status(r, "R2"), "blocked");
  assert.ok(r.submitBlockers.includes("Every sentence needs a source"));
});

test("R2: citation to an unknown document blocks submit", () => {
  const r = evaluateGuardrails({ ...base, draft: "The customer kept using the service. [E8]" });
  assert.equal(status(r, "R2"), "blocked");
});

test("R2: citations after the full stop belong to the sentence", () => {
  assert.equal(splitSentences("It happened. [E3] [E4]").length, 1);
  assert.ok(sentenceHasSource("It happened. [E3] [E4]"));
  assert.ok(sentenceHasSource("It happened [Razorpay]."));
  assert.ok(!sentenceHasSource("It happened."));
});

test("R6: draft over 1,000 characters blocks submit", () => {
  const long = ("A fact about the case that is quite long. [E3] ").repeat(25);
  const r = evaluateGuardrails({ ...base, draft: long });
  assert.equal(status(r, "R6"), "blocked");
});

test("R7: Luhn-valid card number is blocked, order numbers are not", () => {
  assert.ok(containsCardNumber("card 4111 1111 1111 1111 on file"));
  assert.ok(!containsCardNumber("order 1234 5678 9012 3456"));
  assert.ok(!containsCardNumber("invoice INV-2026-041, USD 4,950"));
  const r = evaluateGuardrails({ ...base, evidenceTexts: ["Paid with 4111111111111111"] });
  assert.equal(status(r, "R7"), "blocked");
});

test("Submit needs a draft and at least one document", () => {
  const r = evaluateGuardrails({ ...base, draft: "", documentCount: 0 });
  assert.ok(r.submitBlockers.includes("Write a response"));
  assert.ok(r.submitBlockers.includes("Attach at least one document"));
});

test("checks summary says what happened to each check, not '5 of 7'", async () => {
  const { checksSummary, checksBadge } = await import("./guardrails");
  const lines = [{ status: "pass" }, { status: "pass" }, { status: "na" }, { status: "na" }];
  assert.equal(checksSummary(lines), "2 passed, 2 not needed yet");
  assert.equal(checksBadge(lines), "All clear");
  assert.equal(checksSummary([{ status: "pass" }, { status: "changed" }, { status: "blocked" }]), "1 passed, 1 changed the answer, 1 need your attention");
  assert.equal(checksBadge([{ status: "pass" }, { status: "changed" }]), "1 to look at");
});

test("dedupeSentences removes exact repeats and keeps everything else", async () => {
  const { dedupeSentences } = await import("./guardrails.ts");
  const a = "The customer accepted the terms on 3 May. [E1]";
  const b = "The audit log shows no cancel request. [E2]";
  assert.equal(dedupeSentences(`${a} ${b} ${a.toLowerCase()} ${a}`), `${a} ${b}`);
  assert.equal(dedupeSentences(`${a} ${b}`), `${a} ${b}`);
  assert.equal(dedupeSentences(""), "");
});

test("R8: a Fight with no key document cited becomes Escalate", () => {
  // 13.2 key slots include cancellation_proof and access_activity_log; here the cited E1 is only an explanation letter
  const r = evaluateGuardrails({ ...base, slots: [{ evidenceId: "E1", slot: "explanation_letter" }, { evidenceId: "E3", slot: "access_activity_log" }], draft: "We explained the charge. [E1]" });
  assert.equal(r.finalCall, "escalate");
  assert.equal(status(r, "R8"), "changed");
  assert.equal(r.changedReason, "Your evidence does not include the key document for this reason.");
});

test("R8: a Fight citing a key document passes", () => {
  const r = evaluateGuardrails({ ...base, slots: [{ evidenceId: "E3", slot: "access_activity_log" }] });
  assert.equal(r.finalCall, "fight");
  assert.equal(status(r, "R8"), "pass");
});

test("R8: never changes Accept or Escalate, and is not checked without slots", () => {
  const slots = [{ evidenceId: "E1", slot: "explanation_letter" }];
  assert.equal(evaluateGuardrails({ ...base, call: "fold", slots, draft: "x [E1]" }).finalCall, "fold");
  assert.equal(evaluateGuardrails({ ...base, call: "escalate", slots, draft: "x [E1]" }).finalCall, "escalate");
  assert.equal(status(evaluateGuardrails(base), "R8"), "na");
});

test("R8: for refund not processed (13.6), accepted terms count as the key document", () => {
  const r = evaluateGuardrails({ ...base, reasonCode: "13.6", slots: [{ evidenceId: "E1", slot: "term_and_conditions" }], draft: "The customer accepted the 14-day refund policy. [E1]" });
  assert.equal(r.finalCall, "fight");
  assert.equal(status(r, "R8"), "pass");
});
