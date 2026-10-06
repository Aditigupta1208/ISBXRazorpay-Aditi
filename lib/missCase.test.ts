import test from "node:test";
import assert from "node:assert/strict";
import { buildMissCase, missKind, redact } from "./missCase.ts";

test("a miss is a Fight that was lost or a Fold that would have won", () => {
  assert.equal(missKind({ call: "fight", action: "submit", outcome: "lost" }), "wrong_fight");
  assert.equal(missKind({ call: "fold", action: "submit", outcome: "won" }), "wrong_fold");
});

test("everything else is not a miss, and Escalate never is", () => {
  assert.equal(missKind({ call: "fight", action: "submit", outcome: "won" }), null);
  assert.equal(missKind({ call: "fold", action: "fold", outcome: undefined }), null);
  assert.equal(missKind({ call: "fold", action: "submit", outcome: "lost" }), null);
  assert.equal(missKind({ call: "escalate", action: "submit", outcome: "lost" }), null);
  assert.equal(missKind({ call: "escalate", action: "submit", outcome: "won" }), null);
  assert.equal(missKind({ call: "fight", action: "submit", outcome: undefined }), null);
  assert.equal(missKind({ call: "shield", action: undefined, outcome: undefined }), null);
});

test("redact masks emails and long numbers but keeps dates and amounts", () => {
  const r = redact("Email from mark@brightlinehealth.com on 20 Jun 2026 for USD 1,200. Card 4111 1111 1111 1111, call +91 98765 43210.");
  assert.ok(!r.includes("mark@"), r);
  assert.ok(r.includes("[email]"));
  assert.ok(!r.includes("4111"), r);
  assert.ok(!r.includes("98765"), r);
  assert.ok(r.includes("20 Jun 2026"));
  assert.ok(r.includes("USD 1,200"));
});

const base = {
  caseId: "C06", reasonCode: "13.2", reasonDescription: "Cancelled Recurring Transaction", currency: "USD",
  customerClaim: "I cancelled. Contact j.doe@example.com", razorpayFacts: "Payment captured.",
  evidence: [{ id: "E1", content: "Terms accepted by tom@northfieldco.com" }, { id: "E5", title: "Chat with a@b.io", content: "hello" }],
  confidence: "High", decidingEvidence: ["E1"], reason: "Terms accepted.",
};

test("buildMissCase proposes the opposite call, masks text and warns that a person must confirm", () => {
  const f = buildMissCase({ ...base, call: "fight", action: "submit", outcome: "lost" }, new Date("2026-10-06T00:00:00Z"))!;
  assert.equal(f.proposed_label, "Accept");
  assert.equal(f.created, "2026-10-06");
  assert.match(f.status, /NEEDS HUMAN REVIEW/);
  const text = JSON.stringify(f);
  assert.ok(!text.includes("tom@") && !text.includes("j.doe@") && !text.includes("a@b.io"), text);
  const w = buildMissCase({ ...base, call: "fold", action: "submit", outcome: "won" })!;
  assert.equal(w.proposed_label, "Fight");
});

test("buildMissCase returns null when there is no miss", () => {
  assert.equal(buildMissCase({ ...base, call: "fight", action: "submit", outcome: "won" }), null);
});
