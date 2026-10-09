import test from "node:test";
import assert from "node:assert/strict";
import { deadlineVerdict, whatItChanges } from "./whatIf.ts";

test("deadline check: in time, tight, too late, unknown", () => {
  assert.equal(deadlineVerdict(60, "day").verdict, "in_time");
  assert.equal(deadlineVerdict(30, "day").verdict, "tight");
  assert.equal(deadlineVerdict(18, "day").verdict, "too_late");
  assert.equal(deadlineVerdict(18, "unsure").verdict, "unknown");
  assert.equal(deadlineVerdict(8, "hours").verdict, "tight");
  assert.equal(deadlineVerdict(6, "hours").verdict, "too_late");
});

test("what-if text names the missing document and never promises a result", () => {
  const w = whatItChanges("Proof the booking reached the supplier.");
  assert.match(w.supports, /proof the booking reached the supplier in your favour/);
  assert.match(w.supports, /would likely/);
  assert.match(w.against, /would likely move to Fold/);
});
