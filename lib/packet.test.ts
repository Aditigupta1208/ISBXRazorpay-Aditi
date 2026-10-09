import test from "node:test";
import assert from "node:assert/strict";
import { exhibitMap, responseWithExhibits } from "./packet.ts";

const m = exhibitMap(["E1", "E3", "E4"]);

test("exhibits are numbered in order", () => {
  assert.equal(m.get("E1"), 1);
  assert.equal(m.get("E4"), 3);
});

test("citations become exhibit numbers", () => {
  assert.equal(responseWithExhibits("The customer cancelled. [E3] They kept using it. [E3, E4] Razorpay shows one payment. [Razorpay]", m), "The customer cancelled. [Exhibit 2] They kept using it. [Exhibits 2, 3] Razorpay shows one payment. [Razorpay record]");
  assert.equal(responseWithExhibits("Both. [E1, Razorpay]", m), "Both. [Exhibit 1, Razorpay record]");
});

test("a citation to a document that is not in the packet is left alone", () => {
  assert.equal(responseWithExhibits("Not attached. [E2]", m), "Not attached. [E2]");
});
