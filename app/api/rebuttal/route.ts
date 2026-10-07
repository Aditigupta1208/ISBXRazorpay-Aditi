import { NextResponse } from "next/server";
import { MAX_ADDED, MAX_EVIDENCE_CHARS, MAX_TITLE_CHARS, type AddedEvidence } from "@/lib/agent";
import { DEFAULT_MODEL, makeCallModel } from "@/lib/anthropic";
import { getCase, getRuleText } from "@/lib/data";
import { ACCEPTANCE_OPTIONS, MAX_POLICY_CHARS, type Policy } from "@/lib/limits";
import { loadRebuttalPrompt } from "@/lib/prompt";
import { allow } from "@/lib/ratelimit";
import { analyzeRebuttal, MAX_REBUTTAL_DRAFT_CHARS, type RebuttalDeps } from "@/lib/rebuttal";
import { getSavedRebuttal } from "@/lib/rebuttalData";
import { getRates } from "@/lib/fx";

export const runtime = "nodejs";
export const maxDuration = 60; // confirm Vercel's current limit for the plan

const cache: NonNullable<RebuttalDeps["cache"]> = new Map();

export async function POST(req: Request) {
  // Server only: the key is read here and never sent to the browser. Same per-IP limit as the main check, counted separately.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const limit = allow(`rebuttal:${ip}`);
  if (!limit.ok) {
    return NextResponse.json(
      { status: "unavailable", reason: "rate_limited", message: "That's a lot of checks. Try again in a while." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > 70_000) throw new Error("too big");
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ status: "rejected", code: "empty", message: "That request was not valid." }, { status: 400 });
  }

  const b = body as { caseId?: unknown; added?: unknown; draft?: unknown; demo?: unknown; policy?: { text?: unknown; acceptance?: unknown } };
  const c = typeof b.caseId === "string" ? getCase(b.caseId) : undefined;
  if (!c || !Array.isArray(b.added) || b.added.length > MAX_ADDED || typeof b.draft !== "string") {
    return NextResponse.json({ status: "rejected", code: "empty", message: "That request was not valid." }, { status: 400 });
  }

  // Added IDs are assigned here, never trusted from the browser.
  const added: AddedEvidence[] = [];
  for (const [i, a] of b.added.entries()) {
    const title = typeof a?.title === "string" ? a.title.slice(0, MAX_TITLE_CHARS + 1) : "";
    const content = typeof a?.content === "string" ? a.content.slice(0, MAX_EVIDENCE_CHARS + 1) : "";
    added.push({ id: `E${c.evidence.length + i + 1}`, title, content });
  }

  let policy: Policy | undefined;
  if (b.policy && typeof b.policy.text === "string" && b.policy.text.trim()) {
    const acc = ACCEPTANCE_OPTIONS.find((o) => o.value === b.policy?.acceptance)?.value ?? "unsure";
    policy = { text: b.policy.text.slice(0, MAX_POLICY_CHARS + 1), acceptance: acc };
  }

  let deps: RebuttalDeps;
  try {
    const prompt = loadRebuttalPrompt();
    deps = {
      // "demo" (used by the guided tour) can only ever pick the saved example. It cannot cause a model call.
      callModel: b.demo === true ? null : makeCallModel(process.env.ANTHROPIC_API_KEY),
      model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
      system: prompt.system,
      toolSchema: prompt.toolSchema,
      getSaved: getSavedRebuttal,
      ruleText: getRuleText,
      cache,
      inrPerUsd: (await getRates()).usd,
    };
  } catch {
    return NextResponse.json({ status: "unavailable", reason: "prompt_missing", message: "The practice run is off in this demo." });
  }

  const result = await analyzeRebuttal(c, added, b.draft.slice(0, MAX_REBUTTAL_DRAFT_CHARS + 1), deps, policy);
  return NextResponse.json(result, { status: result.status === "rejected" ? 400 : 200 });
}
