import { NextResponse } from "next/server";
import { analyze, MAX_ADDED, MAX_EVIDENCE_CHARS, MAX_TITLE_CHARS, type AddedEvidence, type Deps } from "@/lib/agent";
import { ACCEPTANCE_OPTIONS, MAX_POLICY_CHARS, type Policy } from "@/lib/limits";
import { DEFAULT_MODEL, makeCallModel } from "@/lib/anthropic";
import { getCase, getCheckView } from "@/lib/data";
import { loadPrompt } from "@/lib/prompt";
import { allow } from "@/lib/ratelimit";
import { getRates } from "@/lib/fx";

export const runtime = "nodejs";
export const maxDuration = 60; // confirm Vercel's current limit for the plan

const cache: NonNullable<Deps["cache"]> = new Map();

export async function POST(req: Request) {
  // Server only: the key is read here and never sent to the browser.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const limit = allow(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { status: "unavailable", reason: "rate_limited", message: "That's a lot of checks. Try again in a while." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > 60_000) throw new Error("too big");
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ status: "rejected", code: "empty", message: "That request was not valid." }, { status: 400 });
  }

  const b = body as { caseId?: unknown; added?: unknown; policy?: { text?: unknown; acceptance?: unknown } };
  const c = typeof b.caseId === "string" ? getCase(b.caseId) : undefined;
  if (!c || !Array.isArray(b.added) || b.added.length > MAX_ADDED) {
    return NextResponse.json({ status: "rejected", code: "empty", message: "That request was not valid." }, { status: 400 });
  }

  // Added IDs are assigned here, never trusted from the browser.
  const added: AddedEvidence[] = [];
  for (const [i, a] of b.added.entries()) {
    const title = typeof a?.title === "string" ? a.title.slice(0, MAX_TITLE_CHARS + 1) : "";
    const content = typeof a?.content === "string" ? a.content.slice(0, MAX_EVIDENCE_CHARS + 1) : "";
    added.push({ id: `E${c.evidence.length + i + 1}`, title, content });
  }

  // Optional merchant terms from Agent setup. Same caps as evidence; treated as data downstream.
  let policy: Policy | undefined;
  if (b.policy && typeof b.policy.text === "string" && b.policy.text.trim()) {
    const acc = ACCEPTANCE_OPTIONS.find((o) => o.value === b.policy?.acceptance)?.value ?? "unsure";
    policy = { text: b.policy.text.slice(0, MAX_POLICY_CHARS + 1), acceptance: acc };
  }

  let deps: Deps;
  try {
    const prompt = loadPrompt();
    deps = {
      callModel: makeCallModel(process.env.ANTHROPIC_API_KEY),
      model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
      system: prompt.system,
      toolSchema: prompt.toolSchema,
      getSaved: getCheckView,
      cache,
      inrPerUsd: (await getRates()).usd,
    };
  } catch {
    return NextResponse.json({ status: "saved", reason: "prompt_missing", message: "The live check is off in this demo, so you are seeing the saved result." });
  }

  const result = await analyze(c, added, deps, policy);
  return NextResponse.json(result, { status: result.status === "rejected" ? 400 : 200 });
}
