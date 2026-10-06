import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildMissCase } from "./missCase.ts";
import { nextCaseId, parseCandidate, promote } from "./candidate.ts";
import { addPending, confirmPending, listPending } from "./candidateStore.ts";

const miss = () =>
  buildMissCase(
    {
      call: "fight", action: "submit", outcome: "lost",
      caseId: "C06", reasonCode: "13.2", reasonDescription: "Cancelled Recurring Transaction", currency: "USD",
      customerClaim: "I cancelled this.", razorpayFacts: "Subscription charge captured; one earlier annual payment (Aug 2025); no refunds.",
      evidence: [
        { id: "E1", content: "Terms acceptance record: [email] ticked 'I agree' on 3 Aug 2025." },
        { id: "E2", content: "Support chat, 29 Jul 2026. Customer: 'Thinking of cancelling.'" },
        { id: "E3", title: "Login log", content: "Last login 28 Jul 2026." },
      ],
      confidence: "High", decidingEvidence: ["E1"], reason: "Terms accepted.",
    },
    new Date("2026-10-06T00:00:00Z"),
  )!;

test("a file made by the app's miss download is accepted as a candidate", () => {
  const r = parseCandidate(JSON.parse(JSON.stringify(miss())));
  assert.equal(r.ok, true);
});

test("a hand-edited file with an email address or a long number is refused", () => {
  const m = JSON.parse(JSON.stringify(miss()));
  m.case.evidence[0].content += " Contact tom@northfieldco.com";
  const a = parseCandidate(m);
  assert.equal(a.ok, false);
  assert.match((a as { problems: string[] }).problems.join(" "), /email/);
  const n = JSON.parse(JSON.stringify(miss()));
  n.case.evidence[1].content += " Card 4111 1111 1111 1111";
  assert.equal(parseCandidate(n).ok, false);
});

test("a malformed file or an unknown reason code is refused with plain reasons", () => {
  assert.equal(parseCandidate({ hello: "world" }).ok, false);
  const m = JSON.parse(JSON.stringify(miss()));
  m.case.dispute.reason_code = "10.4";
  const r = parseCandidate(m);
  assert.equal(r.ok, false);
  assert.match((r as { problems: string[] }).problems.join(" "), /10\.4/);
});

test("next case id continues the numbering", () => {
  assert.equal(nextCaseId(["C01", "C30"]), "C31");
  assert.equal(nextCaseId([]), "C01");
  assert.equal(nextCaseId(["C09"]), "C10");
});

test("promote needs a valid label and real evidence ids", () => {
  const c = (parseCandidate(JSON.parse(JSON.stringify(miss()))) as { candidate: Parameters<typeof promote>[0] }).candidate;
  assert.throws(() => promote(c, { id: "C31", decision: "Maybe" as never, deciding: "E1" }), /label/);
  assert.throws(() => promote(c, { id: "C31", decision: "Accept", deciding: "none" }), /deciding/);
  assert.throws(() => promote(c, { id: "C31", decision: "Accept", deciding: "E9" }), /E9/);
  const ok = promote(c, { id: "C31", decision: "Accept", deciding: "E1 + E3", today: "2026-10-07" });
  assert.equal(ok.labelRow.case_type, "From outcome");
  assert.match(ok.labelRow.label_status, /confirmed by the builder/);
  assert.ok(["Fight", "Accept"].includes(ok.labelRow.checklist_decision), "checklist answer comes from code");
  assert.equal(ok.caseRow.dispute.reason_code, "13.2");
  assert.equal(ok.caseRow.evidence[2].content, "Login log: Last login 28 Jul 2026.");
  assert.match(ok.caseRow.dispute_summary, /placeholder/);
});

function sandbox() {
  const root = mkdtempSync(path.join(tmpdir(), "cand-"));
  mkdirSync(path.join(root, "data"), { recursive: true });
  copyFileSync("data/cases.json", path.join(root, "data", "cases.json"));
  copyFileSync("data/labels.json", path.join(root, "data", "labels.json"));
  const file = path.join(root, "download.json");
  writeFileSync(file, JSON.stringify(miss()));
  return { root, file };
}
const count = (p: string, k: string) => (JSON.parse(readFileSync(p, "utf8"))[k] as unknown[]).length;

test("add parks the file as pending and changes nothing in the eval set", () => {
  const { root, file } = sandbox();
  const r = addPending(root, file);
  assert.equal(r.id, "C31");
  assert.equal(r.proposed, "Accept");
  assert.deepEqual(listPending(root), ["C31"]);
  assert.equal(count(path.join(root, "data", "cases.json"), "cases"), 30);
  assert.equal(count(path.join(root, "data", "labels.json"), "labels"), 30);
});

test("a second add gets the next number", () => {
  const { root, file } = sandbox();
  addPending(root, file);
  assert.equal(addPending(root, file).id, "C32");
});

test("confirm adds the case and label, moves the file, and cannot be repeated", () => {
  const { root, file } = sandbox();
  addPending(root, file);
  confirmPending(root, "C31", "Accept", "E1 + E3", { amountUsd: 1200, today: "2026-10-07" });
  assert.equal(count(path.join(root, "data", "cases.json"), "cases"), 31);
  assert.equal(count(path.join(root, "data", "labels.json"), "labels"), 31);
  assert.deepEqual(listPending(root), []);
  assert.ok(existsSync(path.join(root, "data", "eval-candidates", "added", "C31.json")));
  assert.throws(() => confirmPending(root, "C31", "Accept", "E1"), /No pending/);
});

test("confirm refuses a bad label or an unknown candidate, and leaves the files alone", () => {
  const { root, file } = sandbox();
  addPending(root, file);
  assert.throws(() => confirmPending(root, "C31", "Win", "E1"), /label must be/);
  assert.throws(() => confirmPending(root, "C99", "Accept", "E1"), /No pending/);
  assert.equal(count(path.join(root, "data", "cases.json"), "cases"), 30);
});

test("add refuses a file that still has an email in it", () => {
  const { root } = sandbox();
  const m = JSON.parse(JSON.stringify(miss()));
  m.case.evidence[0].content += " tom@northfieldco.com";
  const f = path.join(root, "bad.json");
  writeFileSync(f, JSON.stringify(m));
  assert.throws(() => addPending(root, f), /email/);
  assert.deepEqual(listPending(root), []);
});
