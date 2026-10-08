import test from "node:test";
import assert from "node:assert/strict";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { GROQ_DEFAULT_MODEL, GROQ_FALLBACK_MODELS, GROQ_MODEL_ORDER, makeGroqCallModel, toGroqText } from "./groq";
import { getLlm } from "./llm";
import { healthyFirst, markBad, resetModelHealth } from "./modelHealth";
import { costUsd } from "./pricing";

type Handler = (req: IncomingMessage, body: any, res: ServerResponse) => void;
async function serve(h: Handler) {
  const seen: { url?: string; auth?: string; body: any }[] = [];
  const server = createServer((req, res) => {
    let b = "";
    req.on("data", (c) => (b += c));
    req.on("end", () => {
      const body = JSON.parse(b || "{}");
      seen.push({ url: req.url, auth: req.headers.authorization, body });
      h(req, body, res);
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  return { base: `http://127.0.0.1:${(server.address() as AddressInfo).port}/openai/v1`, seen, close: () => server.close() };
}
const ok = (res: ServerResponse, args: unknown, usage = { prompt_tokens: 10, completion_tokens: 5 }) => {
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ choices: [{ message: { tool_calls: [{ function: { name: "t", arguments: JSON.stringify(args) } }] } }], usage }));
};
const P = { system: "S", user: "U", toolName: "t", toolDescription: "d", toolSchema: { type: "object", properties: { a: { type: ["string", "null"] } } }, maxTokens: 100 };

test("the request forces the function, sends the key as a bearer header only, and parses string arguments", async () => {
  const s = await serve((_q, _b, res) => ok(res, { a: "x" }));
  const r = await makeGroqCallModel("gsk-secret-123", s.base, [])!({ ...P, model: "openai/gpt-oss-120b" });
  s.close();
  assert.deepEqual(r, { input: { a: "x" }, tokensIn: 10, tokensOut: 5, model: "openai/gpt-oss-120b" });
  const q = s.seen[0];
  assert.equal(q.url, "/openai/v1/chat/completions");
  assert.equal(q.auth, "Bearer gsk-secret-123");
  assert.ok(!JSON.stringify(q.body).includes("gsk-secret-123"));
  assert.deepEqual(q.body.tool_choice, { type: "function", function: { name: "t" } });
  assert.equal(q.body.messages[0].role, "system");
  assert.equal(q.body.reasoning_effort, "medium");
  assert.ok(q.body.max_tokens > 100);
});

test("a model that does not think gets no reasoning setting and no extra token headroom", async () => {
  const s = await serve((_q, _b, res) => ok(res, {}));
  await makeGroqCallModel("k-123456", s.base, [])!({ ...P, model: "allam-2-7b" });
  s.close();
  assert.equal(s.seen[0].body.reasoning_effort, undefined);
  assert.equal(s.seen[0].body.max_tokens, 100);
});

test("a Qwen model gets thinking headroom but no low/medium/high setting", async () => {
  const s = await serve((_q, _b, res) => ok(res, {}));
  await makeGroqCallModel("k-123456", s.base, [], "high")!({ ...P, model: "qwen/qwen3.8-27b" });
  s.close();
  assert.equal(s.seen[0].body.reasoning_effort, undefined);
  assert.equal(s.seen[0].body.max_tokens, 100 + 8000);
});

test("the order of models is set in code: the first is the main one, the rest are the backups in order", () => {
  assert.deepEqual(GROQ_MODEL_ORDER, ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"]);
  assert.equal(GROQ_DEFAULT_MODEL, GROQ_MODEL_ORDER[0]);
  assert.deepEqual(GROQ_FALLBACK_MODELS, GROQ_MODEL_ORDER.slice(1));
  const llm = getLlm({ GROQ_API_KEY: "g" });
  assert.equal(llm.model, "qwen/qwen3.8-27b");
  assert.deepEqual(llm.fallbacks, ["openai/gpt-oss-120b", "openai/gpt-oss-20b"]);
  // An environment override still works, and the main model never appears twice.
  assert.deepEqual(getLlm({ GROQ_API_KEY: "g", GROQ_MODEL: "openai/gpt-oss-20b" }).fallbacks, ["openai/gpt-oss-120b"]);
});

test("invalid JSON arguments or no tool call give an undefined input, not a crash", async () => {
  let mode = "badjson";
  const s = await serve((_q, _b, res) => {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(mode === "badjson" ? { choices: [{ message: { tool_calls: [{ function: { name: "t", arguments: "{oops" } }] } }] } : { choices: [{ message: { content: "hi" } }] }));
  });
  const call = makeGroqCallModel("k-123456", s.base, [])!;
  assert.equal((await call({ ...P, model: "m" })).input, undefined);
  mode = "none";
  assert.equal((await call({ ...P, model: "m" })).input, undefined);
  s.close();
});

test("overload, rate limit and a malformed tool call fall back to the next model; a bad key does not, and never leaks", async () => {
  resetModelHealth();
  const s = await serve((_q, body, res) => {
    if (body.model === "m1") { res.statusCode = 429; res.end(JSON.stringify({ error: { message: "rate limit" } })); return; }
    ok(res, { fine: true });
  });
  const r = await makeGroqCallModel("k-123456", s.base, ["m2"])!({ ...P, model: "m1" });
  assert.equal(r.model, "m2");
  s.close();

  resetModelHealth();
  const s2 = await serve((_q, body, res) => {
    if (body.model === "m1") { res.statusCode = 400; res.end(JSON.stringify({ error: { code: "tool_use_failed", message: "bad call" } })); return; }
    ok(res, {});
  });
  assert.equal((await makeGroqCallModel("k-123456", s2.base, ["m2"])!({ ...P, model: "m1" })).model, "m2");
  s2.close();

  resetModelHealth();
  const s3 = await serve((_q, _b, res) => { res.statusCode = 401; res.end(JSON.stringify({ error: { message: "Invalid API key SECRETKEY-987654" } })); });
  let msg = "";
  await makeGroqCallModel("SECRETKEY-987654", s3.base, ["m2"])!({ ...P, model: "m1" }).catch((e) => (msg = e.message));
  s3.close();
  assert.equal(s3.seen.length, 1);
  assert.match(msg, /401/);
  assert.ok(!msg.includes("SECRETKEY-987654"));
  resetModelHealth();
});

test("a rejected reasoning setting is retried once without it", async () => {
  const s = await serve((_q, body, res) => {
    if (body.reasoning_effort) { res.statusCode = 400; res.end(JSON.stringify({ error: { message: "reasoning_effort is not supported" } })); return; }
    ok(res, {});
  });
  const r = await makeGroqCallModel("k-123456", s.base, [])!({ ...P, model: "openai/gpt-oss-20b" });
  s.close();
  assert.equal(s.seen.length, 2);
  assert.equal(r.model, "openai/gpt-oss-20b");
});

test("uploaded files are refused in plain words, without trying other models", async () => {
  assert.equal(toGroqText("hello"), "hello");
  assert.equal(toGroqText([{ type: "text", text: "a" }, { type: "text", text: "b" }]), "a\nb");
  assert.throws(() => toGroqText([{ type: "document", source: {} }, { type: "text", text: "x" }]), /not supported/);
  const s = await serve((_q, _b, res) => ok(res, {}));
  await assert.rejects(() => makeGroqCallModel("k-123456", s.base, ["m2"])!({ ...P, model: "m1", user: [{ type: "image", source: {} }] }), /not supported/);
  s.close();
  assert.equal(s.seen.length, 0);
});

test("recently failed models are tried last, never dropped", () => {
  resetModelHealth();
  assert.deepEqual(healthyFirst(["a", "b", "c"]), ["a", "b", "c"]);
  markBad("a");
  assert.deepEqual(healthyFirst(["a", "b", "c"]), ["b", "c", "a"]);
  markBad("b");
  markBad("c");
  assert.deepEqual(healthyFirst(["a", "b", "c"]), ["a", "b", "c"]); // all recently failed: still all tried, original order
  assert.deepEqual(healthyFirst(["a", "b"], Date.now() + 61_000), ["a", "b"]);
  resetModelHealth();
});

test("provider choice with Groq: Anthropic wins, then Groq, then Gemini; LLM_PROVIDER forces", () => {
  assert.equal(getLlm({ GROQ_API_KEY: "g", GEMINI_API_KEY: "m" }).provider, "groq");
  assert.equal(getLlm({ ANTHROPIC_API_KEY: "a", GROQ_API_KEY: "g" }).provider, "anthropic");
  assert.equal(getLlm({ GEMINI_API_KEY: "m" }).provider, "gemini");
  assert.equal(getLlm({ GROQ_API_KEY: "g", GEMINI_API_KEY: "m", LLM_PROVIDER: "gemini" }).provider, "gemini");
  const g = getLlm({ GROQ_API_KEY: "g" });
  assert.equal(g.model, "qwen/qwen3.8-27b");
  assert.equal(getLlm({ GROQ_API_KEY: "g", GROQ_MODEL: "openai/gpt-oss-120b" }).model, "openai/gpt-oss-120b");
  assert.equal(getLlm({ LLM_PROVIDER: "groq" }).callModel, null);
});

test("cost: Groq models use the Groq list price", () => {
  assert.equal(costUsd(1_000_000, 0, "openai/gpt-oss-120b"), 0.15);
  assert.equal(costUsd(0, 1_000_000, "openai/gpt-oss-120b"), 0.6);
  assert.equal(costUsd(1_000_000, 0, "claude-sonnet-5-5"), 2);
});

test("a key pasted with spaces, a newline or quotes still counts as present; a blank one does not", async () => {
  const { cleanKey, getLlm } = await import("./llm.ts");
  assert.equal(cleanKey("  gsk_abc123\n"), "gsk_abc123");
  assert.equal(cleanKey('"gsk_abc123"'), "gsk_abc123");
  assert.equal(cleanKey("   "), undefined);
  assert.equal(cleanKey(undefined), undefined);
  assert.notEqual(getLlm({ LLM_PROVIDER: "groq", GROQ_API_KEY: " gsk_abc123\n" }).callModel, null);
  assert.equal(getLlm({ LLM_PROVIDER: "groq", GROQ_API_KEY: "  " }).callModel, null);
});

test("when a model is skipped, the answer says which one and why", async () => {
  resetModelHealth();
  const s = await serve((_q, body, res) => {
    if (body.model === "m1") { res.statusCode = 429; res.end(JSON.stringify({ error: { message: "rate" } })); return; }
    ok(res, {});
  });
  const r = await makeGroqCallModel("k-123456", s.base, ["m2"])!({ ...P, model: "m1" });
  s.close();
  assert.equal(r.model, "m2");
  assert.deepEqual(r.skipped, ["m1: rate limit reached"]);
  resetModelHealth();
  const s2 = await serve((_q, _b, res) => ok(res, {}));
  const r2 = await makeGroqCallModel("k-123456", s2.base, ["m2"])!({ ...P, model: "m1" });
  s2.close();
  assert.equal(r2.skipped, undefined);
  const { whyFailed } = await import("./groq");
  const te = new Error("x"); te.name = "TimeoutError";
  assert.equal(whyFailed(te, 28000), "took longer than 28 s");
  resetModelHealth();
});
