import type { ModelParams, ModelReply } from "./agent";
import { DEFAULT_MODEL, makeCallModel } from "./anthropic";
import { GEMINI_DEFAULT_MODEL, GEMINI_FALLBACK_MODELS, makeGeminiCallModel } from "./gemini";

export type Provider = "anthropic" | "gemini";
export interface Llm {
  provider: Provider | null; // null = no key, the app runs on saved results
  callModel: ((p: ModelParams) => Promise<ModelReply>) | null;
  model: string;
}

/**
 * Which model provider this deployment uses. LLM_PROVIDER=anthropic|gemini forces one.
 * Otherwise: an Anthropic key wins, else a Gemini key, else no key (saved results).
 * Keys are read only here, on the server.
 */
export function getLlm(env: Record<string, string | undefined> = process.env): Llm {
  const forced = env.LLM_PROVIDER?.trim().toLowerCase();
  const provider: Provider | null =
    forced === "gemini" ? "gemini" : forced === "anthropic" ? "anthropic" : env.ANTHROPIC_API_KEY ? "anthropic" : env.GEMINI_API_KEY ? "gemini" : null;
  if (provider === "gemini") {
    return { provider, callModel: makeGeminiCallModel(env.GEMINI_API_KEY, env.GEMINI_API_URL || undefined, env.GEMINI_FALLBACK_MODELS ? env.GEMINI_FALLBACK_MODELS.split(",").map((m) => m.trim()).filter(Boolean) : GEMINI_FALLBACK_MODELS, env.GEMINI_THINKING_LEVEL || undefined), model: env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL };
  }
  if (provider === "anthropic") {
    return { provider, callModel: makeCallModel(env.ANTHROPIC_API_KEY), model: env.ANTHROPIC_MODEL || DEFAULT_MODEL };
  }
  return { provider: null, callModel: null, model: env.ANTHROPIC_MODEL || DEFAULT_MODEL };
}
