import test from "node:test";
import assert from "node:assert/strict";
import { buildPatterns } from "./patterns.ts";

const rows = [
  { code: "13.2", reason: "Cancelled recurring", inr: 100, call: "fight" as const },
  { code: "13.2", reason: "Cancelled recurring", inr: 50, call: "fold" as const },
  { code: "13.1", reason: "Not received", inr: 400, call: "escalate" as const },
  { code: "10.4", reason: "Fraud", inr: 9999, call: "shield" as const },
  { code: "13.6", reason: "Credit not processed", inr: 40, call: null },
];

test("groups by reason code with counts, rupees and calls, biggest first", () => {
  const p = buildPatterns(rows);
  assert.deepEqual(p.map((x) => x.code), ["13.1", "13.2", "13.6"]);
  assert.equal(p[1].count, 2);
  assert.equal(p[1].inr, 150);
  assert.deepEqual(p[1].calls, { fight: 1, fold: 1, escalate: 0 });
});

test("fraud cases are left out, and a missing call is counted but not as a call", () => {
  const p = buildPatterns(rows);
  assert.ok(!p.some((x) => x.code === "10.4"));
  assert.equal(p[2].count, 1);
  assert.deepEqual(p[2].calls, { fight: 0, fold: 0, escalate: 0 });
});

test("empty input gives no patterns", () => assert.deepEqual(buildPatterns([]), []));
