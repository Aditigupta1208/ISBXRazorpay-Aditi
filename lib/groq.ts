import type { ModelParams, ModelReply } from "./agent";
import { healthyFirst, markBad } from "./modelHealth";

/**
 * Groq through its OpenAI-compatible REST API (no SDK). Very fast inference, free plan with rate limits.
 * Same ModelParams in, same ModelReply out as the other providers.
 * Model IDs and prices: https://console.groq.com/docs/models (checked 7 Oct 2026).
 */
/**
 * The models to use, best first. The first is tried first; the next ones are used when it is busy, slow or gone.
 * Change the order here. (Environment variables GROQ_MODEL and GROQ_FALLBACK_MODELS still override it, but you should not need them.)
 * Checked against the models the key could use on 8 Oct 2026: llama-3.3-70b-versatile was no longer offered.
 */
export const GROQ_MODEL_ORDER = ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"];
export const GROQ_DEFAULT_MODEL = GROQ_MODEL_ORDER[0];
export const GROQ_FALLBACK_MODELS = GROQ_MODEL_ORDER.slice(1);
const BASE = "https://api.groq.com/openai/v1";
/** Three tries at 15 s stay inside the 60 s limit of the routes. */
/** The gpt-oss models reason before answering, and that counts against max_tokens. */
// Room for the model's hidden thinking on top of the answer. Higher thinking needs more, or the answer is cut off.
const REASONING_HEADROOM = { low: 2000, medium: 4000, high: 8000 } as const;
const TIMEOUT_MS = { low: 15_000, medium: 20_000, high: 28_000 } as const;
const FALLBACK_STATUSES = new Set([404, 408, 413, 429, 500, 502, 503, 504]);

/** A short, plain reason a model did not answer, for the "under the hood" panel. */
export function whyFailed(err: unknown, timeoutMs: number): string {
  if (err instanceof GroqHttpError) {
    if (err.status === 429) return "rate limit reached";
    if (err.status === 404) return "model not available";
    if (/tool_use_failed/i.test(err.message)) return "did not return a valid answer";
    return `error ${err.status}`;
  }
  if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) return `took longer than ${Math.round(timeoutMs / 1000)} s`;
  return "could not be reached";
}

class GroqHttpError extends Error {
  constructor(public status: number, message: string, public retryable: boolean) {
    super(message);
  }
}

/** Groq reads text only here. The app's uploaded files (PDF, image) are not sent: those need a model with vision. */
export function toGroqText(user: string | unknown[]): string {
  if (typeof user === "string") return user;
  const parts: string[] = [];
  for (const b of user as { type?: string; text?: string }[]) {
    if (b.type === "text") parts.push(b.text ?? "");
    else throw new Error("Groq: reading uploaded files is not supported, paste the text instead");
  }
  return parts.join("\n");
}

export function makeGroqCallModel(
  apiKey: string | undefined,
  baseUrl: string = BASE,
  fallbacks: string[] = GROQ_FALLBACK_MODELS,
  effort: "low" | "medium" | "high" = "medium",
): ((p: ModelParams) => Promise<ModelReply>) | null {
  if (!apiKey) return null;

  // gpt-oss and Qwen think before they answer, and that counts against max_tokens, so both get headroom.
  // Only gpt-oss takes a low/medium/high setting; Qwen's own setting uses different values, so it is left alone.
  const thinks = (model: string) => model.startsWith("openai/gpt-oss") || model.startsWith("qwen/");
  const once = async (p: ModelParams, model: string, sendEffort = model.startsWith("openai/gpt-oss")): Promise<ModelReply> => {
    const body = {
      model,
      temperature: 0,
      max_tokens: p.maxTokens + (thinks(model) ? REASONING_HEADROOM[effort] : 0),
      messages: [
        { role: "system", content: p.system },
        { role: "user", content: toGroqText(p.user) },
      ],
      tools: [{ type: "function", function: { name: p.toolName, description: p.toolDescription, parameters: p.toolSchema } }],
      tool_choice: { type: "function", function: { name: p.toolName } },
      ...(sendEffort ? { reasoning_effort: effort } : {}),
    };
    // The key goes in a header, never in the URL or the body.
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS[effort]),
    });
    if (!res.ok) {
      const raw = await res.text().catch(() => "");
      // A model that rejects the reasoning setting gets one more try without it.
      if (res.status === 400 && sendEffort && /reasoning/i.test(raw)) return once(p, model, false);
      const text = raw.replaceAll(apiKey, "[key]").replace(/\s+/g, " ").slice(0, 300);
      // "tool_use_failed" means the model wrote a malformed tool call: another model may do better.
      const retryable = FALLBACK_STATUSES.has(res.status) || /tool_use_failed/i.test(raw);
      throw new GroqHttpError(res.status, `Groq HTTP ${res.status} (${model}): ${text}`, retryable);
    }
    const data = (await res.json()) as {
      choices?: { message?: { tool_calls?: { function?: { name?: string; arguments?: string } }[] } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const call = data.choices?.[0]?.message?.tool_calls?.find((t) => t.function?.name === p.toolName)?.function;
    let input: unknown;
    if (call?.arguments) {
      try {
        input = JSON.parse(call.arguments);
      } catch {
        input = undefined; // not valid JSON: the app treats it as an invalid answer
      }
    }
    return { input, tokensIn: data.usage?.prompt_tokens ?? 0, tokensOut: data.usage?.completion_tokens ?? 0, model };
  };

  return async (p) => {
    const models = healthyFirst([p.model, ...fallbacks.filter((m) => m !== p.model)]);
    let last: unknown;
    const skipped: string[] = [];
    for (const m of models) {
      try {
        const r = await once(p, m);
        return skipped.length ? { ...r, skipped } : r;
      } catch (err) {
        last = err;
        skipped.push(`${m}: ${whyFailed(err, TIMEOUT_MS[effort])}`);
        const retryable = err instanceof GroqHttpError ? err.retryable : !(err instanceof Error && /not supported/.test(err.message)); // network errors and timeouts too
        if (retryable) markBad(m);
        console.error(`[llm] ${err instanceof Error ? err.message : String(err)}${retryable && m !== models[models.length - 1] ? " -> trying the next model" : ""}`);
        if (!retryable) break;
      }
    }
    throw last;
  };
}
