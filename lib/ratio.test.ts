import test from "node:test";
import assert from "node:assert/strict";
import { dispRatio } from "./ratio.ts";

test("ratio is disputes over transactions, in percent", () => {
  const r = dispRatio(2000, 5);
  assert.equal(r.ratioPct, 0.25);
  assert.equal(r.band, "under");
});

test("bands follow the blog's marks", () => {
  assert.equal(dispRatio(1000, 5).band, "watch");
  assert.equal(dispRatio(1000, 8).band, "emergency");
  assert.equal(dispRatio(1000, 15).band, "visa");
});

test("room before each mark stays strictly under it", () => {
  const r = dispRatio(1000, 2);
  assert.equal(r.room[0].more, 2); // 4 disputes is 0.4%, 5 would be 0.5%
  assert.equal(r.room[1].more, 5); // 7 disputes is 0.7%
  assert.equal(r.room[2].more, 12); // 14 disputes is 1.4%
  assert.equal(dispRatio(1000, 6).room[0].more, null);
});

test("bad or empty input gives no ratio", () => {
  assert.equal(dispRatio(0, 3).ratioPct, null);
  assert.equal(dispRatio(Number.NaN, 3).ratioPct, null);
  assert.equal(dispRatio(100, -1).ratioPct, null);
});
