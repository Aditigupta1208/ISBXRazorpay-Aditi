import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { customerHistory } from "./customerHistory.ts";
import { namedGap } from "./namedGap.ts";

test("customer history reads only what the facts say", () => {
  assert.deepEqual(customerHistory("Payment captured; first payment from this customer; no earlier disputes."), { payments: "First payment from this customer", disputes: "No earlier disputes", known: true });
  const c4 = customerHistory("Subscription charge captured; two earlier annual payments (May 2024, May 2025) with no disputes; no refunds.");
  assert.equal(c4.payments, "2 earlier payments (May 2024, May 2025)");
  assert.equal(c4.disputes, "No earlier disputes");
  assert.equal(customerHistory("Payment captured; 3-D Secure authenticated; no refunds.").known, false);
  assert.equal(customerHistory("Payment captured; 3-D Secure authenticated; no refunds.").disputes, "Earlier disputes: not stated");
  assert.equal(customerHistory("one earlier payment from the same card in 2025 with no dispute.").payments, "1 earlier payment (2025)");
  assert.equal(customerHistory("earlier annual payment on 31 Jul 2025 with no dispute.").payments, "1 earlier payment (31 Jul 2025)");
});

test("every case's facts give a sensible history line", () => {
  const cases = (JSON.parse(readFileSync("data/cases.json", "utf8")) as { cases: { id: string; razorpay_facts: string }[] }).cases;
  for (const c of cases) {
    const h = customerHistory(c.razorpay_facts);
    assert.ok(!/NaN|undefined/.test(h.payments + h.disputes), c.id);
  }
});

test("named gap leads with what is missing, else what decides", () => {
  assert.deepEqual(namedGap({ call: "escalate", getFirst: "Proof the voucher was delivered.", missingEvidence: [], uncoveredKeyNeeds: [], decidingEvidence: ["E1"] }), { label: "Missing", text: "Proof the voucher was delivered" });
  assert.deepEqual(namedGap({ call: "fight", missingEvidence: [], uncoveredKeyNeeds: ["When and how they cancelled"], decidingEvidence: ["E3"] }), { label: "Missing", text: "When and how they cancelled" });
  assert.deepEqual(namedGap({ call: "fight", missingEvidence: [], uncoveredKeyNeeds: [], decidingEvidence: ["E3", "Razorpay"] }), { label: "Decided by", text: "E3 and Razorpay's record" });
  assert.equal(namedGap({ call: "shield", missingEvidence: [], uncoveredKeyNeeds: [], decidingEvidence: [] }), null);
});
