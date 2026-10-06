import test from "node:test";
import assert from "node:assert/strict";
import supp from "../data/prerun/demo-supplements.json" with { type: "json" };
import { FALLBACK_RATES } from "./rates.ts";
import { ODDS_BY_CONFIDENCE, SAMPLE_COUNT, fromAction, historyFor, sampleRecords, summarize, weakestCode, type Rec } from "./results.ts";

const rec = (o: Partial<Rec>): Rec => ({ id: "x", source: "you", code: "13.2", amountInr: 1000, contestInr: 1000, call: "fight", confidence: "High", action: "fight", outcome: "won", onTime: true, ...o });

test("odds by confidence match the supplement file the saved results use", () => {
  assert.deepEqual(ODDS_BY_CONFIDENCE, (supp as { odds_from_confidence: unknown }).odds_from_confidence);
});

test("sample history has 24 records, labelled as sample", () => {
  const s = sampleRecords(FALLBACK_RATES);
  assert.equal(s.length, SAMPLE_COUNT);
  assert.equal(SAMPLE_COUNT, 24);
  assert.ok(s.every((r) => r.source === "sample" && r.outcome !== null));
});

test("headline numbers on the sample history", () => {
  const m = summarize(sampleRecords(FALLBACK_RATES));
  assert.equal(m.settled, 24);
  assert.equal(m.fights, 17);
  assert.equal(m.won, 13);
  assert.ok(Math.abs(m.winRate! - 13 / 17) < 1e-9);
  assert.ok(Math.abs(m.onTimeRate! - 23 / 24) < 1e-9);
  assert.equal(m.fightCalls.n, 14);
  assert.equal(m.foldCalls.n, 8);
  assert.equal(m.foldCalls.wrong, 1);
  assert.deepEqual(m.escalated, { n: 2, fought: 2, won: 1 });
});

test("recovered plus lost equals disputed; net is recovered over disputed", () => {
  const m = summarize(sampleRecords(FALLBACK_RATES));
  assert.ok(Math.abs(m.recoveredInr + m.lostInr - m.disputedInr) < 1e-6);
  assert.ok(Math.abs(m.netRecovered! - m.recoveredInr / m.disputedInr) < 1e-12);
});

test("a partial contest recovers only the part contested", () => {
  const m = summarize([rec({ amountInr: 3200, contestInr: 1600, outcome: "won" })]);
  assert.equal(m.recoveredInr, 1600);
  assert.equal(m.lostInr, 1600);
});

test("pending records are counted but not scored", () => {
  const m = summarize([rec({ outcome: null }), rec({ outcome: "won" })]);
  assert.equal(m.pending, 1);
  assert.equal(m.settled, 1);
  assert.equal(m.winRate, 1);
});

test("empty input gives nulls, not NaN", () => {
  const m = summarize([]);
  assert.equal(m.netRecovered, null);
  assert.equal(m.winRate, null);
  assert.equal(m.onTimeRate, null);
  assert.deepEqual(m.byCode, []);
});

test("calibration is only for Fight calls, split by confidence", () => {
  const m = summarize([
    rec({ call: "fight", confidence: "High", outcome: "won" }),
    rec({ call: "fight", confidence: "High", outcome: "lost" }),
    rec({ call: "fight", confidence: "Medium", outcome: "lost" }),
    rec({ call: "fold", confidence: "High", action: "fold", outcome: "lost" }),
  ]);
  assert.deepEqual(m.byConfidence.map((r) => [r.confidence, r.n, r.won]), [["High", 2, 1], ["Medium", 1, 0]]);
});

test("historyFor counts fights and wins on one reason code", () => {
  const h = historyFor([rec({}), rec({ outcome: "lost" }), rec({ code: "13.3" }), rec({ outcome: null }), rec({ action: "fold", outcome: "lost" })], "13.2");
  assert.deepEqual(h, { fights: 2, won: 1 });
});

test("weakest code needs enough fights", () => {
  const rows = [
    { code: "13.1", disputes: 5, fights: 4, won: 3, recoveredInr: 0, disputedInr: 0 },
    { code: "13.3", disputes: 5, fights: 3, won: 1, recoveredInr: 0, disputedInr: 0 },
    { code: "13.7", disputes: 1, fights: 1, won: 0, recoveredInr: 0, disputedInr: 0 },
  ];
  assert.equal(weakestCode(rows)!.code, "13.3");
  assert.equal(weakestCode([rows[2]]), null);
});

test("fromAction: a Fold is final and loses the whole amount; a submit waits", () => {
  const base = { id: "C05", code: "13.2", atStakeInr: 500, contestInr: 500, call: "fold" as const, confidence: "High" };
  const f = fromAction({ ...base, actionType: "fold", outcome: null });
  assert.equal(f.outcome, "lost");
  assert.equal(f.action, "fold");
  assert.equal(f.contestInr, 0);
  const s = fromAction({ ...base, call: "fight", actionType: "submit", outcome: null });
  assert.equal(s.outcome, null);
  assert.equal(s.action, "fight");
});

import { adjustOdds } from "./results.ts";
const fightRec = (id: string, conf: "High" | "Medium" | "Low", outcome: "won" | "lost" | null, over: Partial<Rec> = {}): Rec => ({
  id, source: "you", code: "13.2", amountInr: 1000, contestInr: 1000, call: "fight", confidence: conf, action: "fight", outcome, onTime: true, ...over,
});

test("adjustOdds: no record means no change", () => {
  const a = adjustOdds(0.8, "High", []);
  assert.deepEqual([a.odds, a.adjusted, a.n], [0.8, false, 0]);
});

test("adjustOdds: a few results move the odds a little, many take over", () => {
  const few = adjustOdds(0.8, "High", [fightRec("a", "High", "lost"), fightRec("b", "High", "lost")]);
  assert.ok(few.adjusted && few.odds < 0.8 && few.odds > 0.6, `few ${few.odds}`);
  const many = adjustOdds(0.8, "High", Array.from({ length: 90 }, (_, i) => fightRec(`m${i}`, "High", "lost")));
  assert.ok(many.odds < 0.1, `many ${many.odds}`);
});

test("adjustOdds: only settled Fight calls at the same confidence count", () => {
  const recs = [
    fightRec("a", "High", null), // waiting for the result
    fightRec("b", "Medium", "lost"), // other confidence
    fightRec("c", "High", "lost", { call: "fold" }), // advisor said fold
    fightRec("d", "High", "won", { action: "fold" }), // merchant folded
  ];
  const a = adjustOdds(0.8, "High", recs);
  assert.equal(a.n, 0);
  assert.equal(a.adjusted, false);
  assert.equal(adjustOdds(0.8, null, [fightRec("x", "High", "lost")]).adjusted, false);
});

test("adjustOdds: the sample history barely moves the saved High and Medium estimates", () => {
  const recs = sampleRecords(FALLBACK_RATES);
  const hi = adjustOdds(0.8, "High", recs);
  const med = adjustOdds(0.55, "Medium", recs);
  assert.ok(hi.odds >= 0.8 && hi.odds <= 0.9, `${hi.odds}`);
  assert.ok(Math.abs(med.odds - 0.55) < 0.05, `${med.odds}`);
  assert.ok(hi.odds >= 0 && hi.odds <= 1);
});
