import test from "node:test";
import assert from "node:assert/strict";
import { DEMO_RATE_INR_PER_USD, moneyCheck } from "./money.ts";

test("USD amount converts at the demo rate", () => {
  const m = moneyCheck({ amountSubunits: 120000, currency: "USD", odds: 0.8 });
  assert.equal(m.atStakeInr, 1200 * DEMO_RATE_INR_PER_USD);
});

test("Fight is worth it on a large dispute with good odds", () => {
  const m = moneyCheck({ amountSubunits: 120000, currency: "USD", odds: 0.8 });
  assert.ok(m.worthFighting);
});

test("Fight is not worth it on a very small dispute (fees at risk dominate)", () => {
  const m = moneyCheck({ amountSubunits: 9600, currency: "USD", odds: 0.8 });
  assert.equal(m.worthFighting, false);
});

test("Partial contest uses only the contested part, capped at the full amount", () => {
  const m = moneyCheck({ amountSubunits: 320000, currency: "USD", contestSubunits: 160000, odds: 0.55 });
  assert.equal(m.contestInr, 1600 * DEMO_RATE_INR_PER_USD);
  assert.equal(m.atStakeInr, 3200 * DEMO_RATE_INR_PER_USD);
  const capped = moneyCheck({ amountSubunits: 1000, currency: "USD", contestSubunits: 5000, odds: 0.5 });
  assert.equal(capped.contestInr, 10 * DEMO_RATE_INR_PER_USD);
});

test("Odds are clamped to 0..1", () => {
  const m = moneyCheck({ amountSubunits: 100000, currency: "USD", odds: 3 });
  assert.equal(m.expectedGainInr, 1000 * DEMO_RATE_INR_PER_USD);
});
