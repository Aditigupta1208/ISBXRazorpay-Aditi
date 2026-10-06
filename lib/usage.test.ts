import test from "node:test";
import assert from "node:assert/strict";
import { EVENTS, backendFrom, fieldFor, headline, readUsage, record, safeEqual } from "./usage.ts";

const ids = ["C01", "C06"];

test("only allowlisted events map to a field", () => {
  for (const e of EVENTS.filter((x) => x !== "dispute_opened")) assert.equal(fieldFor(e, undefined, ids), e);
  assert.equal(fieldFor("drop_table", undefined, ids), null);
  assert.equal(fieldFor(42, undefined, ids), null);
  assert.equal(fieldFor(undefined, undefined, ids), null);
});

test("dispute_opened needs a known demo case ID", () => {
  assert.equal(fieldFor("dispute_opened", "C06", ids), "dispute_opened:C06");
  assert.equal(fieldFor("dispute_opened", "C99", ids), null);
  assert.equal(fieldFor("dispute_opened", "C06; DEL x", ids), null);
  assert.equal(fieldFor("dispute_opened", undefined, ids), null);
});

test("the backend is optional and accepts both Upstash and Vercel KV names", () => {
  assert.equal(backendFrom({}), null);
  assert.equal(backendFrom({ UPSTASH_REDIS_REST_URL: "https://x.upstash.io" }), null);
  assert.deepEqual(backendFrom({ UPSTASH_REDIS_REST_URL: "https://x.upstash.io/", UPSTASH_REDIS_REST_TOKEN: "t" }), { url: "https://x.upstash.io", token: "t" });
  assert.deepEqual(backendFrom({ KV_REST_API_URL: "https://k.io", KV_REST_API_TOKEN: "k" }), { url: "https://k.io", token: "k" });
  assert.equal(backendFrom({ UPSTASH_REDIS_REST_URL: "javascript:1", UPSTASH_REDIS_REST_TOKEN: "t" }), null);
});

function fake() {
  const calls: { url: string; init: RequestInit }[] = [];
  const f = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const cmds = JSON.parse(init.body as string) as (string | number)[][];
    const out = cmds.map((c) => (c[0] === "HGETALL" ? { result: ["new_visitor", "3", "dispute_opened:C06", "2"] } : { result: 1 }));
    return new Response(JSON.stringify(out), { status: 200 });
  }) as unknown as typeof fetch;
  return { f, calls };
}

test("record increments the total and today's counter and sets an expiry, with the token in a header", async () => {
  const { f, calls } = fake();
  const ok = await record(f, { url: "https://x.io", token: "secret" }, "submit", new Date("2026-10-06T10:00:00Z"));
  assert.equal(ok, true);
  assert.equal(calls[0].url, "https://x.io/pipeline");
  assert.equal((calls[0].init.headers as Record<string, string>).Authorization, "Bearer secret");
  const cmds = JSON.parse(calls[0].init.body as string);
  assert.deepEqual(cmds[0], ["HINCRBY", "da:usage:total", "submit", 1]);
  assert.deepEqual(cmds[1], ["HINCRBY", "da:usage:day:2026-10-06", "submit", 1]);
  assert.equal(cmds[2][0], "EXPIRE");
  assert.ok(!calls[0].init.body!.toString().includes("secret"), "token must not be in the body");
});

test("record never throws: network error or HTTP error gives false", async () => {
  const boom = (async () => { throw new Error("offline"); }) as unknown as typeof fetch;
  assert.equal(await record(boom, { url: "https://x.io", token: "t" }, "fold"), false);
  const bad = (async () => new Response("no", { status: 500 })) as unknown as typeof fetch;
  assert.equal(await record(bad, { url: "https://x.io", token: "t" }, "fold"), false);
});

test("readUsage turns Redis hashes into numbers by day", async () => {
  const { f } = fake();
  const r = await readUsage(f, { url: "https://x.io", token: "t" }, 2, new Date("2026-10-06T10:00:00Z"));
  assert.deepEqual(r!.total, { new_visitor: 3, "dispute_opened:C06": 2 });
  assert.deepEqual(Object.keys(r!.days).sort(), ["2026-10-05", "2026-10-06"]);
});

test("headline sums disputes opened and ranks the top ones", () => {
  const h = headline({ new_visitor: 5, "dispute_opened:C06": 4, "dispute_opened:C15": 6, submit: 2, outcome_won: 1, outcome_lost: 2 });
  assert.equal(h.visitors, 5);
  assert.equal(h.disputesOpened, 10);
  assert.equal(h.distinctDisputes, 2);
  assert.deepEqual(h.topDisputes[0], ["C15", 6]);
  assert.equal(h.outcomes, 3);
});

test("safeEqual compares tokens", () => {
  assert.ok(safeEqual("abc", "abc"));
  assert.ok(!safeEqual("abc", "abd"));
  assert.ok(!safeEqual("abc", "ab"));
});
