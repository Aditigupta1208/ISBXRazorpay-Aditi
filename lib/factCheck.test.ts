import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkFigures, recordText, unsupportedKeys } from "./factCheck.ts";

const docs = [
  { id: "E1", content: "Customer completed 14 of 20 lessons and downloaded a certificate on 3 Aug 2026." },
  { id: "E2", content: "Invoice USD 1,200.00 issued 1 May 2026. Renewal reminder sent two weeks ahead." },
];
const record = "Amount: USD 1,200. Dispute raised 7 Aug 2026. Payment captured on 20 Jun 2026.";

test("supported figures: amount, date and count found in a cited document or the record", () => {
  const f = checkFigures("The customer completed 14 lessons and downloaded a certificate on 3 August 2026. [E1] The invoice was USD 1,200 on 1 May. [E2]", docs, record);
  assert.ok(f.every((x) => x.supported), JSON.stringify(f.filter((x) => !x.supported)));
  assert.ok(f.some((x) => x.kind === "amount") && f.some((x) => x.kind === "date") && f.some((x) => x.kind === "count"));
});

test("an invented amount, date or count is not supported", () => {
  const f = checkFigures("The customer completed 18 lessons. [E1] The invoice was USD 1,500 on 2 May 2026. [E2]", docs, record);
  const bad = f.filter((x) => !x.supported).map((x) => x.text);
  assert.ok(bad.includes("18"), bad.join("|"));
  assert.ok(bad.some((t) => /1,500/.test(t)), bad.join("|"));
  assert.ok(bad.some((t) => /2 May 2026/.test(t)), bad.join("|"));
});

test("a figure that is in a document the sentence does not cite is flagged with where it is", () => {
  const f = checkFigures("The invoice was USD 1,200. [E1]", [docs[0], docs[1]], "No figures here.");
  assert.equal(f[0].supported, false);
  assert.deepEqual(f[0].foundElsewhere, ["E2"]);
});

test("number words, reason codes, 3-D Secure and the dispute record are handled", () => {
  const f = checkFigures("A reminder went out two weeks ahead. [E2] Visa 13.2 applies and the payment was 3-D Secure authenticated. [Razorpay] The dispute was raised on 7 Aug 2026. [Razorpay]", docs, record);
  assert.ok(f.every((x) => x.supported), JSON.stringify(f.filter((x) => !x.supported)));
});

test("confirmed figures stop counting as unsupported", () => {
  const f = checkFigures("The customer completed 18 lessons. [E1]", docs, record);
  assert.deepEqual(unsupportedKeys(f), ["count:18"]);
  assert.deepEqual(unsupportedKeys(f, ["count:18"]), []);
});

test("real cases: saved drafts are checked and none crashes", async () => {
  const { getDemoCases, getCheckView } = await import("./data.ts");
  for (const c of getDemoCases()) {
    const v = getCheckView(c.id);
    if (!v?.draft) continue;
    const f = checkFigures(v.draft, c.evidence, recordText(c));
    for (const x of f) assert.ok(x.text && x.key, c.id);
  }
});
