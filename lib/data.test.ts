import test from "node:test";
import assert from "node:assert/strict";

test("saved Fold and Escalate calls do not show a high chance to win", async () => {
  const { savedOdds } = await import("./data.ts");
  assert.ok(savedOdds("fold", "High") < 0.3);
  assert.equal(savedOdds("escalate", "High"), 0.5);
  assert.equal(savedOdds("fight", "High"), 0.8);
});
