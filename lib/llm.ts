import type { ModelParams, ModelReply } from "./agent";
import { DEFAULT_MODEL, makeCallModel } from "./anthropic";
import { GEMINI_DEFAULT_MODEL, GEMINI_FALLBACK_MODELS, makeGeminiCallModel } from "./gemini";
import { GROQ_DEFAULT_MODEL, GROQ_FALLBACK_MODELS, makeGroqCallModel } from "./groq";

export type Provider = "anthropic" | "gemini" | "groq";
export interface Llm {
  provider: Provider | null; // null = no key, the app runs on saved results
  callModel: ((p: ModelParams) => Promise<ModelReply>) | null;
  model: string;
}

/**
 * Which model provider this deployment uses. LLM_PROVIDER=anthropic|gemini|groq forces one.
 * Otherwise: an Anthropic key wins, then Groq (fastest), then Gemini, else no key (saved results).
 * Keys are read only here, on the server.
 */
/** A key as pasted into a settings page: a stray space, newline or pair of quotes is removed. */
export function cleanKey(v: string | undefined): string | undefined {
  const k = v?.trim().replace(/^["']|["']$/g, "").trim();
  return k ? k : undefined;
}

export function getLlm(raw: Record<string, string | undefined> = process.env): Llm {
  const env: Record<string, string | undefined> = { ...raw, ANTHROPIC_API_KEY: cleanKey(raw.ANTHROPIC_API_KEY), GROQ_API_KEY: cleanKey(raw.GROQ_API_KEY), GEMINI_API_KEY: cleanKey(raw.GEMINI_API_KEY) };
  const forced = env.LLM_PROVIDER?.trim().toLowerCase();
  const provider: Provider | null =
    forced === "gemini" || forced === "groq" || forced === "anthropic"
      ? forced
      : env.ANTHROPIC_API_KEY ? "anthropic" : env.GROQ_API_KEY ? "groq" : env.GEMINI_API_KEY ? "gemini" : null;
  if (provider === "groq") {
    return {
      provider,
      callModel: makeGroqCallModel(env.GROQ_API_KEY, env.GROQ_API_URL || undefined, env.GROQ_FALLBACK_MODELS ? env.GROQ_FALLBACK_MODELS.split(",").map((m) => m.trim()).filter(Boolean) : GROQ_FALLBACK_MODELS, (["low", "medium", "high"] as const).find((e) => e === env.GROQ_REASONING) ?? "medium"),
      model: env.GROQ_MODEL || GROQ_DEFAULT_MODEL,
    };
  }
  if (provider === "gemini") {
    return { provider, callModel: makeGeminiCallModel(env.GEMINI_API_KEY, env.GEMINI_API_URL || undefined, env.GEMINI_FALLBACK_MODELS ? env.GEMINI_FALLBACK_MODELS.split(",").map((m) => m.trim()).filter(Boolean) : GEMINI_FALLBACK_MODELS, env.GEMINI_THINKING_LEVEL || undefined), model: env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL };
  }
  if (provider === "anthropic") {
    return { provider, callModel: makeCallModel(env.ANTHROPIC_API_KEY), model: env.ANTHROPIC_MODEL || DEFAULT_MODEL };
  }
  return { provider: null, callModel: null, model: env.ANTHROPIC_MODEL || DEFAULT_MODEL };
}
