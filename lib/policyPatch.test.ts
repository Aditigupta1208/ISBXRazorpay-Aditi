import test from "node:test";
import assert from "node:assert/strict";
import { POLICY_PATCH, policyPatchFor } from "./policyPatch.ts";

test("every covered reason code has checkout wording, an email and a record to keep", () => {
  for (const code of ["13.1", "13.2", "13.3", "13.6", "13.7"]) {
    const kinds = new Set((policyPatchFor(code) ?? []).map((b) => b.kind));
    assert.ok(kinds.has("Checkout wording") && kinds.has("Email to send") && kinds.has("Keep this record"), code);
  }
});

test("templates use blanks and never promise a win", () => {
  for (const [code, blocks] of Object.entries(POLICY_PATCH)) {
    for (const b of blocks.filter((x) => x.kind !== "Keep this record")) assert.match(b.text, /\[/, `${code} ${b.title}`);
    for (const b of blocks) assert.ok(!/guarantee|always win|will win/i.test(b.text), `${code} ${b.title}`);
  }
  assert.equal(policyPatchFor("10.4"), null);
});
