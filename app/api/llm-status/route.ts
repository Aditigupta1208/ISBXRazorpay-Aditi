import { NextResponse } from "next/server";
import { getLlm } from "@/lib/llm";
import { allow } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Setup check. Says which provider this deployment will use and whether a key reached the server (never the key itself).
 * Add ?probe=1 to make one tiny real call and see the provider's reply. Limited to 5 probes per IP per hour.
 */
export async function GET(req: Request) {
  const llm = getLlm();
  const asked = new URL(req.url).searchParams.get("model");
  const model = asked && /^[\w.\-]{3,60}$/.test(asked) ? asked : llm.model;
  const out: Record<string, unknown> = { provider: llm.provider, model, keyPresent: llm.callModel !== null };
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
