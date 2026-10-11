import test from "node:test";
import assert from "node:assert/strict";
import { remapIds, remapText, remapView, renumberMap } from "./evidenceIds.ts";
import type { CheckView } from "./types.ts";

// 4 built-in documents; E5, E6, E7 were added; E5 is removed.
const map = renumberMap(4, ["E5", "E6", "E7"], "E5");

test("renumberMap: removed is null, later ones move up, none before the removed one change", () => {
  assert.equal(map.get("E5"), null);
  assert.equal(map.get("E6"), "E5");
  assert.equal(map.get("E7"), "E6");
  const later = renumberMap(4, ["E5", "E6", "E7"], "E7");
  assert.equal(later.get("E5"), "E5");
  assert.equal(later.get("E6"), "E6");
});

test("remapText: citations move, a removed citation vanishes, built-ins and Razorpay stay", () => {
  assert.equal(remapText("Used after the charge. [E4] Agreed. [E6] Billed. [Razorpay]", map), "Used after the charge. [E4] Agreed. [E5] Billed. [Razorpay]");
  assert.equal(remapText("The customer wrote in. [E5]", map), "The customer wrote in.");
  assert.equal(remapText("Both agree. [E1, E5, E7]", map), "Both agree. [E1, E6]");
  assert.equal(remapText("E6 conflicts with E2, and E5 is odd.", map), "E5 conflicts with E2, and a removed document is odd.");
});

test("remapText: nothing to do when no map or no match", () => {
  assert.equal(remapText("A. [E1]", new Map()), "A. [E1]");
  assert.equal(remapText("", map), "");
});

test("remapIds: no duplicates, removed dropped", () => {
  assert.deepEqual(remapIds(["E4", "E5", "E6", "E7"], map), ["E4", "E5", "E6"]);
});

test("remapView: draft, deciding, slots and flags all follow the new numbers", () => {
  const view = {
    caseId: "C06", call: "fight", confidence: "High", reason: "Seen in E7. [E7]", decidingEvidence: ["E5", "E6"],
    missingEvidence: [], contradictions: ["E6 conflicts with E2"], draft: "Yes. [E6] No. [E5]",
    slots: [{ evidenceId: "E5", slot: "others" }, { evidenceId: "E6", slot: "customer_communication" }],
    evidenceFlags: [{ evidenceId: "E5", flag: "instruction_like" }, { evidenceId: "E7", flag: "contradiction" }],
  } as unknown as CheckView;
  const v = remapView(view, map);
  assert.equal(v.draft, "Yes. [E5] No.");
  assert.deepEqual(v.decidingEvidence, ["E5"]);
  assert.deepEqual(v.slots, [{ evidenceId: "E5", slot: "customer_communication" }]);
  assert.deepEqual(v.evidenceFlags, [{ evidenceId: "E6", flag: "contradiction" }]);
  assert.equal(v.contradictions[0], "E5 conflicts with E2");
  assert.equal(v.reason, "Seen in E6. [E6]");
});
