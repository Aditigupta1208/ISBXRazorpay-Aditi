import { NextResponse } from "next/server";
import { cleanKey, getLlm } from "@/lib/llm";
import { allow } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Setup check. Says which provider this deployment will use and whether a key reached the server (never the key itself).
 * Add ?probe=1 to make one tiny real call and see the provider's reply. Limited to 5 probes per IP per hour.
 */
export async function GET(req: Request) {
  const llm = getLlm();
  const asked = new URL(req.url).searchParams.get("model");
  const model = asked && /^[\w.\-]{3,60}$/.test(asked) ? asked : llm.model;
  const out: Record<string, unknown> = { provider: llm.provider, model, keyPresent: llm.callModel !== null };
  // Which deployment is answering, and what the key setting looks like. Never the key itself.
  out.deployment = { env: process.env.VERCEL_ENV ?? "local", branch: process.env.VERCEL_GIT_COMMIT_REF ?? null, commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null };
  const keyName = llm.provider === "groq" ? "GROQ_API_KEY" : llm.provider === "gemini" ? "GEMINI_API_KEY" : llm.provider === "anthropic" ? "ANTHROPIC_API_KEY" : null;
  if (keyName) {
    const raw = process.env[keyName];
    out.keyVariable = { name: keyName, state: raw === undefined ? "missing: not set for this deployment" : cleanKey(raw) ? (raw.trim() !== raw ? "set (stray spaces or a newline were ignored)" : "set") : "empty: the value is blank" };
  }
  if (llm.provider === "groq") out.thinking = ["low", "medium", "high"].includes(process.env.GROQ_REASONING ?? "") ? process.env.GROQ_REASONING : "medium";
  // ?models=1 lists the model names this key can use on Groq, so a "model not found" can be fixed by picking a real one.
  if (new URL(req.url).searchParams.get("models") === "1" && llm.provider === "groq") {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    if (!allow(`probe:${ip}`, Date.now(), 5).ok) return NextResponse.json({ ...out, models: "rate_limited" }, { status: 429 });
    const key = cleanKey(process.env.GROQ_API_KEY);
    const base = (process.env.GROQ_API_URL || "https://api.groq.com/openai/v1").replace(/\/$/, "");
    try {
      const res = await fetch(`${base}/models`, { headers: { authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10_000) });
      const body = (await res.json().catch(() => ({}))) as { data?: { id?: string }[] };
      out.models = res.ok ? (body.data ?? []).map((m) => m.id).filter((id): id is string => typeof id === "string").sort() : `error ${res.status}`;
    } catch {
      out.models = "could not reach Groq";
    }
    return NextResponse.json(out, { headers: { "Cache-Control": "no-store" } });
  }
  if (new URL(req.url).searchParams.get("probe") === "1") {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    if (!allow(`probe:${ip}`, Date.now(), 5).ok) return NextResponse.json({ ...out, probe: "rate_limited" }, { status: 429 });
    if (!llm.callModel) return NextResponse.json({ ...out, probe: "no_key" });
    const started = Date.now();
    try {
      const r = await llm.callModel({
        model,
        system: "Call the tool with ok set to true.",
        user: "ping",
        toolName: "record_ping",
        toolDescription: "Record that the call worked.",
        toolSchema: { type: "object", required: ["ok"], properties: { ok: { type: "boolean" } } },
        maxTokens: 50,
      });
      out.answeredBy = r.model ?? model;
      out.probe = (r.input as { ok?: boolean } | undefined)?.ok === true ? "ok" : "no_tool_call";
      out.tokens = { in: r.tokensIn, out: r.tokensOut };
    } catch (err) {
      out.probe = "error";
      out.error = err instanceof Error ? err.message.slice(0, 400) : "unknown error";
    }
    out.ms = Date.now() - started;
  }
  return NextResponse.json(out, { headers: { "Cache-Control": "no-store" } });
}
