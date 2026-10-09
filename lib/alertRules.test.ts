import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_RULES, alertText, decide, digestText, type AlertRow } from "./alertRules.ts";

const row = (o: Partial<AlertRow> = {}): AlertRow => ({ id: "C04", disputeId: "disp_demoC04", merchant: "Ledgerly", amountText: "$1,200", inr: 105600, inrText: "₹1,05,600", reasonCode: "13.2", reason: "Cancelled Recurring Transaction", hours: 30, timeText: "30h", call: "fight", odds: 0.85, gap: "Decided by: E3, E4", ...o });

test("amount, urgency and chosen reasons trigger an alert; the rest go to the digest", () => {
  assert.equal(decide(row(), DEFAULT_RULES).route, "alert"); // big amount
  assert.equal(decide(row({ inr: 2000 }), DEFAULT_RULES).route, "digest");
  assert.equal(decide(row({ inr: 2000, hours: 10 }), DEFAULT_RULES).route, "alert");
  assert.equal(decide(row({ inr: 2000 }), { ...DEFAULT_RULES, alwaysReasons: ["13.2"] }).route, "alert");
  assert.equal(decide(row({ inr: 2000 }), { ...DEFAULT_RULES, digest: false }).route, "app");
  assert.equal(decide(row({ inr: 2000, hours: 10 }), { ...DEFAULT_RULES, urgentHours: null }).route, "digest");
});

test("fraud is not covered and never alerts", () => {
  assert.equal(decide(row({ call: "shield", hours: 5 }), DEFAULT_RULES).route, "not_covered");
});

test("fold suggestion comes from a Fold call or low odds, and says it accepts nothing", () => {
  assert.equal(decide(row({ odds: 0.1 }), DEFAULT_RULES).suggestFold, true);
  assert.equal(decide(row({ odds: 0.5 }), DEFAULT_RULES).suggestFold, false);
  assert.equal(decide(row({ call: "fold", odds: 0.9 }), DEFAULT_RULES).suggestFold, true);
  assert.equal(decide(row({ odds: 0.1 }), { ...DEFAULT_RULES, foldBelowPct: null }).suggestFold, false);
  const t = alertText(row({ odds: 0.1 }), decide(row({ odds: 0.1 }), DEFAULT_RULES));
  assert.match(t, /nothing is accepted for you/);
  assert.match(t, /Nothing is sent without your approval/);
});

test("digest lists each dispute", () => {
  assert.match(digestText([row(), row({ disputeId: "disp_demoC05" })]), /2 disputes/);
  assert.equal(digestText([]), "No disputes in today's digest.");
});
