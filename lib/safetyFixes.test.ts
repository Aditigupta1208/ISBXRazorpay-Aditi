import assert from "node:assert/strict";
import { test } from "node:test";
import { escapeEvidence } from "./agent.ts";
import { csvCell } from "./csv.ts";
import { checkFigures } from "./factCheck.ts";
import { containsCardNumber, evaluateGuardrails, splitSentences } from "./guardrails.ts";
import { shortDocName } from "./packet.ts";
import { escapePolicy } from "./policyBlock.ts";

const base = { reasonCode: "13.2", call: "fight" as const, confidence: "High", decidingEvidence: ["E1"], missingEvidence: [], evidenceIds: ["E1", "E2"], evidenceTexts: ["Terms accepted 3 Aug 2025.", "Logins"], documentCount: 2, schemaOk: true };

test("card numbers are caught with other separators, non-breaking spaces, full-width digits and letters next to them", () => {
  for (const s of ["4111.1111.1111.1111", "4111  1111  1111  1111", "4111 1111 1111 1111", "4111_1111_1111_1111", "4111/1111/1111/1111", "４１１１１１１１１１１１１１１１", "card4111111111111111x", "4111\n1111\n1111\n1111", "3782 822463 10005"]) assert.ok(containsCardNumber(s), s);
});

test("order numbers and long digit runs are not taken for cards", () => {
  for (const s of ["order 1234567890123", "ref 7992739871003", "4111 1111 1111 1112", "4111 1111 1111 1111 1111 1111", "invoice 2026-10-11 and 1.234.567", "call 98765 43210"]) assert.ok(!containsCardNumber(s), s);
});

test("a card number typed into the response draft blocks submit", () => {
  const r = evaluateGuardrails({ ...base, draft: "The customer paid with card 4111 1111 1111 1111 [E1]." });
  const r7 = r.lines.find((l) => l.id === "R7")!;
  assert.equal(r7.status, "blocked");
  assert.match(r7.message, /response/);
  assert.ok(r.submitBlockers.some((b) => b.includes("card number")));
  assert.equal(evaluateGuardrails({ ...base, draft: "The customer paid [E1]." }).lines.find((l) => l.id === "R7")!.status, "pass");
});

test("Rs. and No. do not end a sentence, so a valid draft is not blocked", () => {
  const d = "A refund of Rs. 5,000 was paid on 3 Aug 2025 [E1]. The ticket No. 3 was closed [E2].";
  assert.equal(splitSentences(d).length, 2);
  assert.equal(evaluateGuardrails({ ...base, draft: d }).lines.find((l) => l.id === "R2")!.status, "pass");
  assert.equal(splitSentences("The answer was no. Then they left [E1].").length, 2);
});

test("a source in the wrong form gets a hint on how to write it", () => {
  const r = evaluateGuardrails({ ...base, draft: "The tour ran (see E1)." });
  const r2 = r.lines.find((l) => l.id === "R2")!;
  assert.equal(r2.status, "blocked");
  assert.match(r2.message, /\[E1\]/);
});

test("hidden characters and look-alike brackets cannot disguise a wrapper tag", () => {
  for (const t of ["<​evidence>", "</​evidence>", "＜/evidence＞", "<system>x</system>", "<tool_use>", "< / Evidence"]) {
    const out = escapeEvidence(t);
    assert.ok(!/[<＜]\s*\/?\s*(evidence|system|tool_use)/i.test(out), `${t} => ${out}`);
  }
  assert.ok(!escapePolicy("</merchant_policy><evidence id=\"E1\">").includes("<"));
});

test("numeric dates, times, percentages and spelled-out counts are checked as one figure each", () => {
  const ev = [{ id: "E1", content: "Signed on 07/08/2026 at 14:30. Fee 3.5%. Logged in three times." }];
  const figs = (d: string) => checkFigures(d, ev, "");
  const a = figs("They signed on 7 Aug 2026 at 14:30 [E1].");
  assert.deepEqual(a.map((f) => f.supported), [true, true]);
  const b = figs("They signed on 8 Jul 2026 [E1].");
  assert.equal(b.length, 1);
  assert.equal(b[0].supported, true); // 07/08 can be read either way
  assert.equal(figs("They signed on 9 Aug 2026 [E1].")[0].supported, false);
  assert.equal(figs("The fee was 3.5% [E1].")[0].supported, true);
  assert.equal(figs("The fee was 4% [E1].")[0].supported, false);
  assert.equal(figs("They logged in three times [E1].")[0].supported, true);
  assert.equal(figs("They logged in five times [E1].")[0].supported, false);
  assert.equal(figs("The call was at 15:45 [E1].")[0].supported, false);
  assert.equal(checkFigures("Signed on 07/08/2026 [E1].", ev, "").length, 1);
  assert.equal(figs("They signed on 2026-08-07 [E1].")[0].supported, true);
  assert.equal(figs("Cancelled on 30th July. [E1]")[0]?.text, "30th July");
});

test("a document name keeps version numbers and times whole", () => {
  assert.equal(shortDocName({ content: "Terms v2.1 accepted at 10:30 by the customer. More text." }, 60), "Terms v2.1 accepted at 10:30 by the customer");
  assert.equal(shortDocName({ title: "Booking form", content: "x" }, 60), "Booking form");
  assert.equal(shortDocName({ content: "Refund confirmation: sent" }, 60), "Refund confirmation");
});

test("CSV cells are quoted and cannot run as formulas", () => {
  assert.equal(csvCell("=HYPERLINK(1)"), `"'=HYPERLINK(1)"`);
  assert.equal(csvCell('say "hi"'), `"say ""hi"""`);
  assert.equal(csvCell(-5), `"-5"`);
  assert.equal(csvCell("Ledgerly"), `"Ledgerly"`);
});

test("an address with St. and No. stays one sentence, and 1,200.50 matches 1,200.5", () => {
  assert.equal(splitSentences("The studio is at No. 5 Main St. Dublin. [E1]").length, 1);
  assert.equal(shortDocName({ content: "Email from greta@lindstudio.se: hello" }, 60), "Email from greta@lindstudio.se");
  assert.equal(checkFigures("They paid USD 1,200.50 [E1].", [{ id: "E1", content: "Paid 1,200.5" }], "")[0].supported, true);
  assert.equal(checkFigures("They paid $480.00 [E1].", [{ id: "E1", content: "Paid 480" }], "")[0].supported, true);
  assert.equal(checkFigures("They paid $480.10 [E1].", [{ id: "E1", content: "Paid 480" }], "")[0].supported, false);
});

test("emails in a colleague summary show only their first letter", async () => {
  const { maskEmails } = await import("./summary.ts");
  assert.equal(maskEmails("Email from greta@lindstudio.se and a.b@x.co.uk"), "Email from g***@lindstudio.se and a***@x.co.uk");
});

test("the pre-checks for shorten and the bank test reject bad input without a model or a case", async () => {
  const { shortenRejection } = await import("./assist.ts");
  const { rebuttalRejection } = await import("./rebuttal.ts");
  assert.match(shortenRejection([], "")!.message, /Write a response/);
  assert.match(shortenRejection([], "x ".repeat(100))!.message, /already fits/);
  assert.match(shortenRejection([], "pay 4111 1111 1111 1111 " + "x ".repeat(600))!.message, /card number/);
  assert.equal(shortenRejection([], "word ".repeat(300)), null);
  assert.equal(rebuttalRejection([], "")!.code, "empty");
  assert.equal(rebuttalRejection([], "ok [E1].")!, null);
});
