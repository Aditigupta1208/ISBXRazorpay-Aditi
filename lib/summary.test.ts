import test from "node:test";
import assert from "node:assert/strict";
import { buildSummary } from "./summary.ts";

const base = { disputeId: "disp_demoC04", merchant: "Ledgerly (Pune)", amountOriginal: "$1,200", amountInr: "₹1,05,600", reasonCode: "13.2", reasonDescription: "Cancelled Recurring Transaction", customerClaim: "I cancelled", timeLeft: "30h", call: "fight" as const, confidence: "High", reasonLine: "The customer kept using it.", gap: { label: "Decided by", text: "E3, E4" }, history: "2 earlier payments. No earlier disputes.", documents: [{ id: "E3", name: "Audit log" }] };

test("summary has the call, the gap, the documents and the disclaimer", () => {
  const t = buildSummary(base);
  assert.match(t, /Advisor's call: Fight, High confidence/);
  assert.match(t, /Decided by: E3, E4/);
  assert.match(t, /- E3: Audit log/);
  assert.match(t, /nothing has been sent/);
});

test("fraud summary has no confidence and no gap line", () => {
  const t = buildSummary({ ...base, call: "shield", gap: null, history: null, documents: [] });
  assert.match(t, /Chargeback Shield/);
  assert.ok(!/confidence/.test(t));
  assert.ok(!/Documents:/.test(t));
});
