import Anthropic from "@anthropic-ai/sdk";
import type { ModelParams, ModelReply } from "./agent";

export const DEFAULT_MODEL = "claude-sonnet-5-5"; // confirmed on the models page, 6 Oct 2026
export const TIMEOUT_MS = 45_000;

/** Returns null when there is no API key: the app then runs on saved results. */
export function makeCallModel(apiKey: string | undefined): ((p: ModelParams) => Promise<ModelReply>) | null {
  if (!apiKey) return null;
  // One retry for invalid output is handled in agent.ts; no hidden SDK retries, so cost and time stay predictable.
  const client = new Anthropic({ apiKey, timeout: TIMEOUT_MS, maxRetries: 0 });
  return async (p) => {
    const res = await client.messages.create({
      model: p.model,
      max_tokens: p.maxTokens,
      system: p.system,
      tools: [{ name: p.toolName, description: p.toolDescription, input_schema: p.toolSchema as Anthropic.Tool.InputSchema }],
      tool_choice: { type: "tool", name: p.toolName },
      messages: [{ role: "user", content: p.user }],
    });
    const block = res.content.find((b) => b.type === "tool_use");
    return {
      input: block && block.type === "tool_use" ? block.input : undefined,
      tokensIn: res.usage.input_tokens,
      tokensOut: res.usage.output_tokens,
    };
  };
}
