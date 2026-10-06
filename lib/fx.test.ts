import test from "node:test";
import assert from "node:assert/strict";
import { applyPin, getRates, parseRates } from "./fx.ts";
import { FALLBACK_RATES, rateNote, rateWord } from "./rates.ts";
import { moneyCheck } from "./money.ts";

const ok = { date: "2026-10-05", rates: { EUR: 0.89254, GBP: 0.75616, INR: 96.3 } };
const resp = (body: unknown, status = 200) => (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

test("parses the ECB response and derives INR per GBP and EUR", () => {
  const r = parseRates(ok)!;
  assert.equal(r.usd, 96.3);
  assert.ok(Math.abs(r.gbp - 96.3 / 0.75616) < 1e-9);
  assert.ok(Math.abs(r.eur - 96.3 / 0.89254) < 1e-9);
  assert.equal(r.source, "live");
  assert.equal(r.asOf, "2026-10-05");
});

test("refuses missing, zero, text and out-of-band rates", () => {
  assert.equal(parseRates(null), null);
  assert.equal(parseRates({ rates: { INR: 96, GBP: 0.7 } }), null);
  assert.equal(parseRates({ rates: { INR: 0, GBP: 0.7, EUR: 0.9 } }), null);
  assert.equal(parseRates({ rates: { INR: "abc", GBP: 0.7, EUR: 0.9 } }), null);
  assert.equal(parseRates({ rates: { INR: 9630, GBP: 0.7, EUR: 0.9 } }), null);
});

test("a bad date is dropped, not shown", () => {
  assert.equal(parseRates({ ...ok, date: "yesterday" })!.asOf, null);
});

test("getRates returns live rates on success", async () => {
  const r = await getRates(resp(ok), undefined);
  assert.equal(r.source, "live");
  assert.equal(r.usd, 96.3);
});

test("getRates falls back on HTTP error, bad JSON shape, and network failure", async () => {
  assert.deepEqual(await getRates(resp({}, 500), undefined), FALLBACK_RATES);
  assert.deepEqual(await getRates(resp({ rates: {} }), undefined), FALLBACK_RATES);
  const boom = (async () => { throw new Error("offline"); }) as unknown as typeof fetch;
  assert.deepEqual(await getRates(boom, undefined), FALLBACK_RATES);
});

test("the pin overrides USD, also when live data is missing", async () => {
  const live = await getRates(resp(ok), "95.5");
  assert.equal(live.source, "pinned");
  assert.equal(live.usd, 95.5);
  assert.ok(Math.abs(live.gbp - 96.3 / 0.75616) < 1e-9);
  const off = await getRates((async () => { throw new Error("x"); }) as unknown as typeof fetch, "95.5");
  assert.equal(off.usd, 95.5);
});

test("a nonsense pin is ignored", () => {
  assert.equal(applyPin(FALLBACK_RATES, "abc"), FALLBACK_RATES);
  assert.equal(applyPin(FALLBACK_RATES, "5"), FALLBACK_RATES);
  assert.equal(applyPin(FALLBACK_RATES, undefined), FALLBACK_RATES);
});

test("labels say where the rate comes from", () => {
  const live = parseRates(ok)!;
  assert.equal(rateWord(live), "live rate");
  assert.match(rateNote(live), /₹96\.30 per USD.*5 Oct 2026.*Indicative/);
  assert.equal(rateWord({ ...live, source: "pinned" }), "fixed rate");
  assert.match(rateNote({ ...live, source: "pinned" }), /fixed by the builder/);
  assert.equal(rateWord(FALLBACK_RATES), "demo rate");
  assert.match(rateNote(FALLBACK_RATES), /demo value/);
});

test("money maths uses the rates it is given, including for the arbitration fee", () => {
  const live = parseRates(ok)!;
  const m = moneyCheck({ amountSubunits: 120000, currency: "USD", odds: 0.8 }, live);
  assert.equal(m.atStakeInr, 1200 * 96.3);
  assert.equal(m.feesAtRiskInr, 600 * 96.3);
  const gbp = moneyCheck({ amountSubunits: 10000, currency: "GBP", odds: 0.5 }, live);
  assert.ok(Math.abs(gbp.atStakeInr - 100 * (96.3 / 0.75616)) < 1e-6);
});
