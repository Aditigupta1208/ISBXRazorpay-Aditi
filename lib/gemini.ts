import type { ModelParams, ModelReply } from "./agent";

/** Google Gemini through plain REST (no SDK), so the app can run on a free-tier key. Same ModelParams in, same ModelReply out. */
export const GEMINI_DEFAULT_MODEL = "gemini-3.8-flash"; // free tier per Google's pricing page, checked 7 Oct 2026
export const GEMINI_TIMEOUT_MS = 45_000;
const BASE = "https://generativelanguage.googleapis.com/v1beta";
/** Thinking models count their private reasoning against the output cap, so leave room or the answer is cut off. */
const THINKING_HEADROOM = 4000;

type Json = Record<string, unknown>;

/** Gemini accepts a subset of JSON Schema: no type arrays, no additionalProperties. ["string","null"] becomes type string plus nullable. */
export function toGeminiSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(toGeminiSchema);
  if (!node || typeof node !== "object") return node;
  const src = node as Json;
  const out: Json = {};
  for (const [k, v] of Object.entries(src)) {
    if (k === "additionalProperties" || k === "$schema" || k === "default") continue;
    if (k === "type" && Array.isArray(v)) {
      const types = v.filter((t) => t !== "null");
      out.type = types[0] ?? "string";
      if (v.includes("null")) out.nullable = true;
      continue;
    }
    if (k === "properties" && v && typeof v === "object") {
      out.properties = Object.fromEntries(Object.entries(v as Json).map(([pk, pv]) => [pk, toGeminiSchema(pv)]));
      continue;
    }
    out[k] = k === "items" ? toGeminiSchema(v) : v;
  }
  return out;
}

/** The app's content blocks (Anthropic-style document and image blocks, plus text) as Gemini parts. */
export function toGeminiParts(user: string | unknown[]): Json[] {
  if (typeof user === "string") return [{ text: user }];
  return user.map((b) => {
    const blk = b as { type?: string; text?: string; source?: { media_type?: string; data?: string } };
    if (blk.type === "text") return { text: blk.text ?? "" };
    if ((blk.type === "document" || blk.type === "image") && blk.source?.data) return { inlineData: { mimeType: blk.source.media_type, data: blk.source.data } };
    return { text: String(blk.text ?? "") };
  });
}

/** Overload and outage responses worth trying another model for. Config errors (400, 401, 403) are not: a second model would fail the same way. */
const FALLBACK_STATUSES = new Set([404, 429, 500, 502, 503, 504]);
export const GEMINI_FALLBACK_MODELS = ["gemini-3.5-flash"]; // also free tier per Google's pricing page, 7 Oct 2026
const PER_MODEL_TIMEOUT_MS = 25_000;

export function makeGeminiCallModel(
  apiKey: string | undefined,
  baseUrl: string = BASE,
  fallbacks: string[] = GEMINI_FALLBACK_MODELS,
): ((p: ModelParams) => Promise<ModelReply>) | null {
  if (!apiKey) return null;

  const once = async (p: ModelParams, model: string): Promise<ModelReply> => {
    const body = {
      systemInstruction: { parts: [{ text: p.system }] },
      contents: [{ role: "user", parts: toGeminiParts(p.user) }],
      tools: [{ functionDeclarations: [{ name: p.toolName, description: p.toolDescription, parameters: toGeminiSchema(p.toolSchema) }] }],
      toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: [p.toolName] } },
      generationConfig: { maxOutputTokens: p.maxTokens + THINKING_HEADROOM, temperature: 0 },
    };
    // The key goes in a header, never in the URL, so it cannot end up in logs.
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(PER_MODEL_TIMEOUT_MS),
    });
    if (!res.ok) {
      const text = (await res.text().catch(() => "")).replaceAll(apiKey, "[key]").replace(/\s+/g, " ").slice(0, 300);
      throw new GeminiHttpError(res.status, `Gemini HTTP ${res.status} (${model}): ${text}`);
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { functionCall?: { name?: string; args?: unknown } }[] } }[];
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };
    };
    const call = data.candidates?.[0]?.content?.parts?.find((x) => x.functionCall && x.functionCall.name === p.toolName)?.functionCall;
    const u = data.usageMetadata ?? {};
    return { input: call?.args, tokensIn: u.promptTokenCount ?? 0, tokensOut: (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0), model };
  };

  return async (p) => {
    const models = [p.model, ...fallbacks.filter((m) => m !== p.model)];
    let last: unknown;
    for (const m of models) {
      try {
        return await once(p, m);
      } catch (err) {
        last = err;
        const retryable = err instanceof GeminiHttpError ? FALLBACK_STATUSES.has(err.status) : true; // network errors and timeouts too
        console.error(`[llm] ${err instanceof Error ? err.message : String(err)}${retryable && m !== models[models.length - 1] ? " -> trying the next model" : ""}`);
        if (!retryable) break;
      }
    }
    throw last;
  };
}

class GeminiHttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
