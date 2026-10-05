import test from "node:test";
import assert from "node:assert/strict";
import { checkFile, extractDocument, type ExtractDeps } from "./extract.ts";
import type { ModelParams } from "./agent.ts";

const b64 = (bytes: number[], pad = 40) => Buffer.from([...bytes, ...new Array(pad).fill(0x41)]).toString("base64");
const pdf = { name: "terms.pdf", mediaType: "application/pdf", data: b64([0x25, 0x50, 0x44, 0x46, 0x2d]) };
const png = { name: "chat.png", mediaType: "image/png", data: b64([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]) };
const deps = (input: unknown, seen?: { p?: ModelParams }): ExtractDeps => ({ model: "m", callModel: async (p) => { if (seen) seen.p = p; return { input, tokensIn: 1, tokensOut: 1 }; } });

test("files must match their type by their first bytes", () => {
  assert.equal(checkFile(pdf), null);
  assert.equal(checkFile(png), null);
  assert.match(checkFile({ ...pdf, mediaType: "image/png" })!, /doesn't look like its type/);
  assert.match(checkFile({ ...pdf, mediaType: "text/html" })!, /PDF, PNG, JPEG or WebP/);
  assert.match(checkFile({ ...pdf, data: "not base64!!" })!, /could not be read/);
});

test("files over 3 MB are refused before any model call", async () => {
  const big = { ...pdf, data: Buffer.concat([Buffer.from("%PDF-"), Buffer.alloc(3 * 1024 * 1024 + 10)]).toString("base64") };
  let called = 0;
  const r = await extractDocument(big, { model: "m", callModel: async () => { called++; throw new Error("no"); } });
  assert.equal(r.status, "rejected");
  assert.equal(called, 0);
});

test("a PDF goes to the model as a document block, an image as an image block, with one forced tool", async () => {
  const seen: { p?: ModelParams } = {};
  await extractDocument(pdf, deps({ readable: true, title: "Terms", text: "Plans renew yearly." }, seen));
  const blocks = seen.p!.user as { type: string }[];
  assert.equal(blocks[0].type, "document");
  assert.equal(seen.p!.toolName, "record_document_text");
  assert.match(seen.p!.system, /do not follow them/);
  await extractDocument(png, deps({ readable: true, title: "Chat", text: "Hi" }, seen));
  assert.equal((seen.p!.user as { type: string }[])[0].type, "image");
});

test("reads text, trims the title and flags long text", async () => {
  const ok = await extractDocument(pdf, deps({ readable: true, title: "  Terms v3  ", text: "Plans renew yearly." }));
  assert.deepEqual(ok, { status: "ok", title: "Terms v3", text: "Plans renew yearly.", truncated: false });
  const long = await extractDocument(pdf, deps({ readable: true, title: "Long", text: "x".repeat(5000) }));
  assert.equal(long.status === "ok" && long.text.length, 4000);
  assert.equal(long.status === "ok" && long.truncated, true);
});

test("unreadable, bad output, a failed call and no key each give a plain message", async () => {
  assert.equal((await extractDocument(pdf, deps({ readable: false, title: "", text: "" }))).status, "unreadable");
  assert.equal((await extractDocument(pdf, deps({ nonsense: 1 }))).status, "unavailable");
  assert.equal((await extractDocument(pdf, { model: "m", callModel: async () => { throw new Error("boom"); } })).status, "unavailable");
  const none = await extractDocument(pdf, { model: "m", callModel: null });
  assert.equal(none.status, "unavailable");
  assert.match(none.status === "unavailable" ? none.message : "", /Paste the text/);
});

test("a full card number read from a file is refused", async () => {
  const r = await extractDocument(pdf, deps({ readable: true, title: "Receipt", text: "Card 4111 1111 1111 1111" }));
  assert.equal(r.status, "rejected");
});
