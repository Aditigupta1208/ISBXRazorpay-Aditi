import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { makeGeminiCallModel, toGeminiParts, toGeminiSchema } from "./gemini";
import { getLlm } from "./llm";
import { costUsd } from "./pricing";
import { loadPrompt, loadRebuttalPrompt } from "./prompt";
import { EXTRACT_SCHEMA } from "./extract";

const hasBadSchema = (n: unknown): boolean => {
  if (Array.isArray(n)) return n.some(hasBadSchema);
  if (n && typeof n === "object") {
    const o = n as Record<string, unknown>;
    return Array.isArray(o.type) || "additionalProperties" in o || Object.values(o).some(hasBadSchema);
  }
  return false;
};

test("every tool schema the app sends is turned into the subset Gemini accepts", () => {
  for (const s of [loadPrompt().toolSchema, loadRebuttalPrompt().toolSchema, EXTRACT_SCHEMA as Record<string, unknown>]) {
    assert.equal(hasBadSchema(toGeminiSchema(s)), false);
  }
});

test("a nullable type array becomes a type plus nullable, and enums and required are kept", () => {
  const out = toGeminiSchema({ type: "object", required: ["a"], additionalProperties: false, properties: { a: { type: ["string", "null"], description: "d" }, b: { type: "string", enum: ["x", "y"] }, c: { type: "array", items: { type: ["number", "null"] } } } }) as any;
  assert.equal(out.additionalProperties, undefined);
  assert.deepEqual(out.properties.a, { type: "string", nullable: true, description: "d" });
  assert.deepEqual(out.properties.b.enum, ["x", "y"]);
  assert.deepEqual(out.properties.c.items, { type: "number", nullable: true });
  assert.deepEqual(out.required, ["a"]);
});

test("text and uploaded files become Gemini parts", () => {
  assert.deepEqual(toGeminiParts("hi"), [{ text: "hi" }]);
  const parts = toGeminiParts([{ type: "document", source: { type: "base64", media_type: "application/pdf", data: "AAA" } }, { type: "text", text: "Read it" }]);
  assert.deepEqual(parts, [{ inlineData: { mimeType: "application/pdf", data: "AAA" } }, { text: "Read it" }]);
});

test("the request forces the tool, keeps the key out of the URL, and the reply adds thinking tokens to output", async () => {
  let seen: any;
  const server = createServer((req, res) => {
    let b = "";
    req.on("data", (c) => (b += c));
    req.on("end", () => {
      seen = { url: req.url, key: req.headers["x-goog-api-key"], body: JSON.parse(b) };
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ candidates: [{ content: { parts: [{ functionCall: { name: "t", args: { ok: 1 } } }] } }], usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 20, thoughtsTokenCount: 30 } }));
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1beta`;
  const call = makeGeminiCallModel("secret", base)!;
  const r = await call({ model: "gemini-x", system: "S", user: "U", toolName: "t", toolDescription: "d", toolSchema: { type: "object", properties: { a: { type: ["string", "null"] } } }, maxTokens: 500 });
  server.close();
  assert.deepEqual(r, { input: { ok: 1 }, tokensIn: 100, tokensOut: 50, model: "gemini-x" });
  assert.equal(seen.url, "/v1beta/models/gemini-x:generateContent");
  assert.ok(!seen.url.includes("secret"));
  assert.equal(seen.key, "secret");
  assert.deepEqual(seen.body.toolConfig.functionCallingConfig, { mode: "ANY", allowedFunctionNames: ["t"] });
  assert.equal(seen.body.systemInstruction.parts[0].text, "S");
  assert.ok(seen.body.generationConfig.maxOutputTokens > 500);
});

test("an HTTP error throws (so the app falls back to the saved result), and a reply with no function call is undefined input", async () => {
  let mode = "err";
  const server = createServer((_req, res) => {
    if (mode === "err") { res.statusCode = 429; res.end("{}"); return; }
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: "no tool" }] }, finishReason: "MAX_TOKENS" }] }));
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1beta`;
  const call = makeGeminiCallModel("k", base)!;
  const p = { model: "m", system: "s", user: "u", toolName: "t", toolDescription: "d", toolSchema: { type: "object" }, maxTokens: 10 };
  await assert.rejects(() => call(p));
  mode = "ok";
  assert.equal((await call(p)).input, undefined);
  server.close();
  assert.equal(makeGeminiCallModel(undefined), null);
});

test("provider choice: no key is saved results, an Anthropic key wins, a Gemini key works alone, LLM_PROVIDER forces one", () => {
  assert.equal(getLlm({}).callModel, null);
  assert.equal(getLlm({}).provider, null);
  assert.equal(getLlm({ ANTHROPIC_API_KEY: "a", GEMINI_API_KEY: "g" }).provider, "anthropic");
  const g = getLlm({ GEMINI_API_KEY: "g" });
  assert.equal(g.provider, "gemini");
  assert.match(g.model, /^gemini/);
  assert.equal(getLlm({ ANTHROPIC_API_KEY: "a", GEMINI_API_KEY: "g", LLM_PROVIDER: "gemini" }).provider, "gemini");
  assert.equal(getLlm({ GEMINI_API_KEY: "g", GEMINI_MODEL: "gemini-custom" }).model, "gemini-custom");
  assert.equal(getLlm({ LLM_PROVIDER: "gemini" }).callModel, null); // forced but no key: still saved results
});

test("cost uses the model's own price list", () => {
  assert.equal(costUsd(1_000_000, 0, "claude-sonnet-5-5"), 2);
  assert.equal(costUsd(1_000_000, 0, "gemini-3.8-flash"), 0.75);
  assert.equal(costUsd(0, 1_000_000, "gemini-3.8-flash"), 3.75);
});

test("an overloaded model (503) falls back to the next model and the reply says which one answered", async () => {
  const urls: string[] = [];
  const server = createServer((req, res) => {
    urls.push(req.url ?? "");
    req.resume();
    req.on("end", () => {
      if ((req.url ?? "").includes("/models/m1:")) { res.statusCode = 503; res.end(JSON.stringify({ error: { message: "high demand" } })); return; }
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ candidates: [{ content: { parts: [{ functionCall: { name: "t", args: { ok: 1 } } }] } }], usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 5 } }));
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1beta`;
  const call = makeGeminiCallModel("k", base, ["m2"])!;
  const r = await call({ model: "m1", system: "s", user: "u", toolName: "t", toolDescription: "d", toolSchema: { type: "object" }, maxTokens: 10 });
  server.close();
  assert.equal(r.model, "m2");
  assert.deepEqual(r.input, { ok: 1 });
  assert.equal(urls.length, 2);
  assert.ok(urls[0].includes("m1") && urls[1].includes("m2"));
});

test("a configuration error (403) does not try other models, and the error text never contains the key", async () => {
  let hits = 0;
  const server = createServer((req, res) => {
    hits++;
    req.resume();
    req.on("end", () => { res.statusCode = 403; res.end(JSON.stringify({ error: { message: "API key SECRETKEY123 is not allowed" } })); });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1beta`;
  const call = makeGeminiCallModel("SECRETKEY123", base, ["m2"])!;
  let message = "";
  await call({ model: "m1", system: "s", user: "u", toolName: "t", toolDescription: "d", toolSchema: { type: "object" }, maxTokens: 10 }).catch((e) => (message = e.message));
  server.close();
  assert.equal(hits, 1);
  assert.match(message, /403/);
  assert.ok(!message.includes("SECRETKEY123"));
});

test("Gemini 3 models are asked to think at a low level, older models are not, and a rejected thinking setting is retried without it", async () => {
  const bodies: any[] = [];
  let rejectThinking = false;
  const server = createServer((req, res) => {
    let b = "";
    req.on("data", (c) => (b += c));
    req.on("end", () => {
      const body = JSON.parse(b);
      bodies.push({ url: req.url, gc: body.generationConfig });
      if (rejectThinking && body.generationConfig.thinkingConfig) { res.statusCode = 400; res.end(JSON.stringify({ error: { message: "Unknown field thinkingConfig" } })); return; }
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ candidates: [{ content: { parts: [{ functionCall: { name: "t", args: {} } }] } }], usageMetadata: {} }));
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1beta`;
  const call = makeGeminiCallModel("test-key-123456", base, [])!;
  const p = { system: "s", user: "u", toolName: "t", toolDescription: "d", toolSchema: { type: "object" }, maxTokens: 10 };
  await call({ ...p, model: "gemini-3.8-flash" });
  await call({ ...p, model: "gemini-2.5-flash" });
  rejectThinking = true;
  await call({ ...p, model: "gemini-3.5-flash" });
  server.close();
  assert.deepEqual(bodies[0].gc.thinkingConfig, { thinkingLevel: "low" });
  assert.equal(bodies[1].gc.thinkingConfig, undefined);
  assert.equal(bodies.length, 4); // the third call was sent twice: with thinking, rejected, then without
  assert.equal(bodies[3].gc.thinkingConfig, undefined);
});
