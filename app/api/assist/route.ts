import { NextResponse } from "next/server";
import { MAX_ADDED, MAX_EVIDENCE_CHARS, MAX_TITLE_CHARS, type AddedEvidence } from "@/lib/agent";
import { readKeyFacts, shortenDraft, suggestChange, type AssistDeps, type SavedLearning } from "@/lib/assist";
import { getSavedKeyFacts } from "@/lib/assistData";
import { learnStatsSchema } from "@/lib/assistCore";
import { getCase } from "@/lib/data";
import { getLlm } from "@/lib/llm";
import { ACCEPTANCE_OPTIONS, MAX_POLICY_CHARS, type Policy } from "@/lib/limits";
import { allow } from "@/lib/ratelimit";
import { getSavedLearning } from "@/lib/learnData";

export const runtime = "nodejs";
export const maxDuration = 60; // confirm Vercel's current limit for the plan

const cache: NonNullable<AssistDeps["cache"]> = new Map();

/** Three small helpers behind one route: shorten a draft, read key facts, suggest a change. Same server-only key and per-IP limit as the main check, counted separately. */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const limit = allow(`assist:${ip}`);
  if (!limit.ok) {
    return NextResponse.json({ status: "unavailable", message: "That's a lot of requests. Try again in a while." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } });
  }
  let b: { kind?: unknown; caseId?: unknown; added?: unknown; draft?: unknown; policy?: { text?: unknown; acceptance?: unknown }; stats?: unknown; policyText?: unknown };
  try {
    const text = await req.text();
    if (text.length > 70_000) throw new Error("too big");
    b = JSON.parse(text);
  } catch {
    return NextResponse.json({ status: "rejected", message: "That request was not valid." }, { status: 400 });
  }

  const llm = getLlm();
  const deps: AssistDeps = { callModel: llm.callModel, model: llm.model, cache };

  if (b.kind === "learn") {
    const stats = learnStatsSchema.safeParse(b.stats);
    if (!stats.success) return NextResponse.json({ status: "rejected", message: "That request was not valid." }, { status: 400 });
    const policyText = typeof b.policyText === "string" ? b.policyText.slice(0, MAX_POLICY_CHARS + 1) : "";
    if (policyText.length > MAX_POLICY_CHARS) return NextResponse.json({ status: "rejected", message: `Keep your terms under ${MAX_POLICY_CHARS.toLocaleString()} characters.` }, { status: 400 });
    const result = await suggestChange(stats.data, policyText, deps, getSavedLearning() as SavedLearning | undefined);
    return NextResponse.json(result, { status: result.status === "rejected" ? 400 : 200 });
  }

  const c = typeof b.caseId === "string" ? getCase(b.caseId) : undefined;
  if (!c || !Array.isArray(b.added) || b.added.length > MAX_ADDED || (b.kind !== "shorten" && b.kind !== "keyfacts")) {
    return NextResponse.json({ status: "rejected", message: "That request was not valid." }, { status: 400 });
  }
  // Added IDs are assigned here, never trusted from the browser.
  const added: AddedEvidence[] = b.added.map((a: { title?: unknown; content?: unknown }, i: number) => ({
    id: `E${c.evidence.length + i + 1}`,
    title: typeof a?.title === "string" ? a.title.slice(0, MAX_TITLE_CHARS + 1) : "",
    content: typeof a?.content === "string" ? a.content.slice(0, MAX_EVIDENCE_CHARS + 1) : "",
  }));

  if (b.kind === "keyfacts") {
    const result = await readKeyFacts(c, added, deps, getSavedKeyFacts);
    return NextResponse.json(result, { status: result.status === "rejected" ? 400 : 200 });
  }

  if (typeof b.draft !== "string") return NextResponse.json({ status: "rejected", message: "That request was not valid." }, { status: 400 });
  let policy: Policy | undefined;
  if (b.policy && typeof b.policy.text === "string" && b.policy.text.trim()) {
    const acc = ACCEPTANCE_OPTIONS.find((o) => o.value === b.policy?.acceptance)?.value ?? "unsure";
    policy = { text: b.policy.text.slice(0, MAX_POLICY_CHARS + 1), acceptance: acc };
  }
  const result = await shortenDraft(c, added, b.draft.slice(0, 2001), deps, policy);
  return NextResponse.json(result, { status: result.status === "rejected" ? 400 : 200 });
}
