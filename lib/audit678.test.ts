import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_RULES, MAX_MIN_INR, sanitizeRules } from "./alertRules.ts";
import { dispRatio, parseCount } from "./ratio.ts";
import { summarize, type Rec } from "./results.ts";
import { DEFAULT_PROFILE, policyProblem, sanitizeProfile, usablePolicy } from "./useProfile.ts";

test("ratio inputs accept commas and spaces, and refuse exponents, decimals and negatives", () => {
  assert.equal(parseCount("1,200"), 1200);
  assert.equal(parseCount(" 1200 "), 1200);
  assert.equal(parseCount(""), null);
  for (const bad of ["1e3", "6.5", "-5", "abc", "0x10", "12345678901"]) assert.equal(parseCount(bad), "bad", bad);
});

test("more disputes than payments is not a ratio", () => {
  const r = dispRatio(1200, 1500);
  assert.equal(r.ratioPct, null);
  assert.match(r.note, /cannot be more/);
  assert.equal(dispRatio(1200, 6)!.ratioPct, 0.5);
});

test("damaged alert rules fall back to the defaults one by one", () => {
  assert.deepEqual(sanitizeRules(null), DEFAULT_RULES);
  assert.deepEqual(sanitizeRules("x"), DEFAULT_RULES);
  const r = sanitizeRules({ minInr: "abc", alwaysReasons: null, urgentHours: "x", digest: 1, channel: "fax", foldBelowPct: 99 });
  assert.deepEqual(r, DEFAULT_RULES);
  const ok = sanitizeRules({ minInr: 1e30, alwaysReasons: ["13.1", "bad", 5], urgentHours: null, digest: false, channel: "slack", foldBelowPct: null });
  assert.equal(ok.minInr, MAX_MIN_INR);
  assert.deepEqual(ok.alwaysReasons, ["13.1"]);
  assert.equal(ok.urgentHours, null);
  assert.equal(ok.digest, false);
  assert.equal(ok.channel, "slack");
  assert.equal(ok.foldBelowPct, null);
});

test("a damaged agent setup falls back field by field, and unusable terms are not sent", () => {
  assert.deepEqual(sanitizeProfile(null), DEFAULT_PROFILE);
  const p = sanitizeProfile({ enabled: "yes", policy: 5, acceptance: "nope" });
  assert.deepEqual(p, DEFAULT_PROFILE);
  assert.equal(usablePolicy({ ...DEFAULT_PROFILE, policy: "" }), undefined);
  assert.equal(usablePolicy({ ...DEFAULT_PROFILE, policy: "Refunds within 14 days." })?.text, "Refunds within 14 days.");
  const card = { ...DEFAULT_PROFILE, policy: "Pay with 4111 1111 1111 1111" };
  assert.equal(usablePolicy(card), undefined);
  assert.equal(policyProblem(card), true);
  assert.equal(policyProblem({ ...DEFAULT_PROFILE, policy: "x ".repeat(2000) }), true);
  assert.equal(policyProblem(DEFAULT_PROFILE), false);
});

test("a Fight call the merchant folded is not counted as a lost fight in the expected-versus-won bars", () => {
  const base: Rec = { id: "a", source: "you", code: "13.1", amountInr: 100, contestInr: 100, call: "fight", confidence: "High", action: "fight", outcome: "won", onTime: true };
  const s = summarize([base, { ...base, id: "b", action: "fold", contestInr: 0, outcome: "lost" }, { ...base, id: "c", outcome: "lost" }]);
  assert.deepEqual(s.byConfidence.map((r) => [r.n, r.won]), [[2, 1]]);
});
