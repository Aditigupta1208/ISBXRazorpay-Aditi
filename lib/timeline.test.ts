import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTimeline, daysBetween, formatIso, parseDate } from "./timeline";
import casesFile from "../data/cases.json";

test("parses and formats full dates only", () => {
  assert.equal(parseDate("25 Aug 2026"), "2026-08-25");
  assert.equal(parseDate("3rd Aug 2025"), "2025-08-03");
  assert.equal(parseDate("31 Feb 2026"), null);
  assert.equal(parseDate("22 Jun"), null);
  assert.equal(formatIso("2026-07-29"), "29 Jul 2026");
  assert.equal(daysBetween("2026-07-29", "2026-08-25"), 27);
});

test("C06 timeline is in date order and ends with the dispute", () => {
  const c = (casesFile as { cases: { id: string; dispute: { raised_on: string }; evidence: { id: string; content: string }[] }[] }).cases.find((x) => x.id === "C06")!;
  const t = buildTimeline({ raisedOn: c.dispute.raised_on, evidence: c.evidence });
  assert.deepEqual(t.map((e) => e.iso), ["2025-08-03", "2026-07-28", "2026-07-29", "2026-08-25"]);
  assert.equal(t[0].evidenceId, "E1");
  assert.equal(t[t.length - 1].evidenceId, null);
});

test("partial dates are ignored and every case builds without throwing", () => {
  const all = (casesFile as { cases: { dispute: { raised_on: string }; evidence: { id: string; content: string }[] }[] }).cases;
  for (const c of all) {
    const t = buildTimeline({ raisedOn: c.dispute.raised_on, evidence: c.evidence });
    for (let i = 1; i < t.length; i++) assert.ok(t[i - 1].iso <= t[i].iso);
  }
  const t = buildTimeline({ raisedOn: "1 Aug 2026", evidence: [{ id: "E1", content: "Emailed on 22 Jun." }] });
  assert.equal(t.length, 1);
});

test("a dot inside an email address does not cut the snippet", () => {
  const ev = [{ id: "E2", content: "Email from mark@brightlinehealth.com, 20 Jun 2026: 'Approved milestone 2. All 12 screens look great.'" }];
  const t = buildTimeline({ raisedOn: "1 Aug 2026", evidence: ev });
  assert.ok(t[0].text.startsWith("Email from mark@brightlinehealth.com, 20 Jun 2026"), t[0].text);
});
