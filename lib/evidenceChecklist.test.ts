import test from "node:test";
import assert from "node:assert/strict";
import { CHECKLISTS, SLOT_INFO, SOURCES, checklistFor } from "./evidenceChecklist.ts";
import prompt from "../data/labels.json" with { type: "json" };

const RAZORPAY_SLOTS = ["shipping_proof", "billing_proof", "cancellation_proof", "customer_communication", "proof_of_service", "explanation_letter", "refund_confirmation", "access_activity_log", "refund_cancellation_policy", "term_and_conditions", "others"];

test("slot info covers exactly Razorpay's 11 contest slots", () => {
  assert.deepEqual(Object.keys(SLOT_INFO).sort(), [...RAZORPAY_SLOTS].sort());
});

test("every slot named in a checklist is a real Razorpay slot", () => {
  for (const [code, c] of Object.entries(CHECKLISTS)) {
    for (const r of [...c.key, ...c.helpful]) for (const s of r.slots) assert.ok(RAZORPAY_SLOTS.includes(s), `${code}: ${s}`);
  }
});

test("every in-scope reason code has a checklist, and fraud has none", () => {
  const codes = Object.keys((prompt as { visa_rules: Record<string, string> }).visa_rules).filter((c) => c.startsWith("13."));
  assert.deepEqual(Object.keys(CHECKLISTS).sort(), codes.sort());
  assert.equal(checklistFor("10.4", new Map()), null);
});

test("the prompt's slot list matches the checklist's slots", async () => {
  const { readFileSync } = await import("node:fs");
  const text = readFileSync(new URL("../prompts/dispute-agent-v2.2.md", import.meta.url), "utf8");
  for (const s of RAZORPAY_SLOTS) assert.ok(text.includes(`"${s}"`), s);
});

test("a requirement is covered when any of its slots has a document", () => {
  const r = checklistFor("13.2", new Map([["access_activity_log", ["E3"]], ["term_and_conditions", ["E1"]]]))!;
  assert.equal(r.keyTotal, 3);
  assert.equal(r.keyCovered, 2);
  const used = r.key.find((x) => x.need.startsWith("They kept using"))!;
  assert.deepEqual(used.evidenceIds, ["E3"]);
  assert.ok(!r.key.find((x) => x.need.startsWith("When and how"))!.covered);
});

test("an empty locker covers nothing; a document in two matching slots is listed once", () => {
  assert.equal(checklistFor("13.7", new Map())!.keyCovered, 0);
  const r = checklistFor("13.2", new Map([["access_activity_log", ["E3"]], ["proof_of_service", ["E3"]]]))!;
  assert.deepEqual(r.key[2].evidenceIds, ["E3"]);
});

test("sources are real links", () => {
  for (const s of Object.values(SOURCES)) assert.match(s.url, /^https:\/\//);
});
