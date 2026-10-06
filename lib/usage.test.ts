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

test("the backend is optional and needs both a Supabase URL and a server key", () => {
  assert.equal(backendFrom({}), null);
  assert.equal(backendFrom({ SUPABASE_URL: "https://x.supabase.co" }), null);
  assert.deepEqual(backendFrom({ SUPABASE_URL: "https://x.supabase.co/", SUPABASE_SERVICE_ROLE_KEY: "k" }), { url: "https://x.supabase.co", key: "k" });
  assert.deepEqual(backendFrom({ SUPABASE_URL: "https://x.supabase.co", SUPABASE_SECRET_KEY: "s" }), { url: "https://x.supabase.co", key: "s" });
  assert.equal(backendFrom({ SUPABASE_URL: "javascript:1", SUPABASE_SERVICE_ROLE_KEY: "k" }), null);
  assert.equal(backendFrom({ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "p", SUPABASE_URL: "https://x.supabase.co" }), null, "the public key must never be used as the server key");
});

const B = { url: "https://x.supabase.co", key: "secret" };

function fake() {
  const calls: { url: string; init: RequestInit }[] = [];
  const f = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    if (url.includes("/rpc/incr_usage")) return new Response(null, { status: 204 });
    return new Response(
      JSON.stringify([
        { day: "2026-10-06", event: "new_visitor", count: 3 },
        { day: "2026-10-05", event: "new_visitor", count: 1 },
        { day: "2026-10-06", event: "dispute_opened:C06", count: 2 },
        { day: "2026-09-01", event: "new_visitor", count: 7 },
      ]),
      { status: 200 },
    );
  }) as unknown as typeof fetch;
  return { f, calls };
}

test("record calls the increment function with only the event name, key in headers", async () => {
  const { f, calls } = fake();
  assert.equal(await record(f, B, "submit"), true);
  assert.equal(calls[0].url, "https://x.supabase.co/rest/v1/rpc/incr_usage");
  const h = calls[0].init.headers as Record<string, string>;
  assert.equal(h.apikey, "secret");
  assert.equal(h.Authorization, "Bearer secret");
  assert.deepEqual(JSON.parse(calls[0].init.body as string), { p_event: "submit" });
  assert.ok(!String(calls[0].init.body).includes("secret"), "key must not be in the body");
});

test("record never throws: network error or HTTP error gives false", async () => {
  const boom = (async () => { throw new Error("offline"); }) as unknown as typeof fetch;
  assert.equal(await record(boom, B, "fold"), false);
  const bad = (async () => new Response("no", { status: 401 })) as unknown as typeof fetch;
  assert.equal(await record(bad, B, "fold"), false);
});

test("readUsage totals every row and keeps only the last N days by day", async () => {
  const { f } = fake();
  const r = await readUsage(f, B, 2, new Date("2026-10-06T10:00:00Z"));
  assert.deepEqual(r!.total, { new_visitor: 11, "dispute_opened:C06": 2 });
  assert.deepEqual(Object.keys(r!.days).sort(), ["2026-10-05", "2026-10-06"]);
  assert.equal(r!.days["2026-10-06"].new_visitor, 3);
});

test("readUsage gives null on failure", async () => {
  const bad = (async () => new Response("no", { status: 500 })) as unknown as typeof fetch;
  assert.equal(await readUsage(bad, B), null);
  const boom = (async () => { throw new Error("x"); }) as unknown as typeof fetch;
  assert.equal(await readUsage(boom, B), null);
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
