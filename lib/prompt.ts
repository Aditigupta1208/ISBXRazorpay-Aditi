import { readFileSync } from "node:fs";
import path from "node:path";

export const PROMPT_VERSION = "v2.2";
const FILE = "prompts/dispute-agent-v2.2.md";

export interface PromptParts {
  system: string;
  toolSchema: Record<string, unknown>;
}

/** The prompt file is the single source of truth: the system prompt and the tool schema are read from it. */
export function parsePrompt(md: string): PromptParts {
  const sys = md.split("## System prompt")[1]?.match(/```text\n([\s\S]*?)\n```/);
  const tool = md.split("## Tool: record_dispute_decision")[1]?.match(/```json\n([\s\S]*?)\n```/);
  if (!sys || !tool) throw new Error("Prompt file is missing the system prompt or the tool schema");
  return { system: sys[1], toolSchema: JSON.parse(tool[1]) };
}

let cached: PromptParts | undefined;
export function loadPrompt(): PromptParts {
  if (!cached) cached = parsePrompt(readFileSync(path.join(process.cwd(), FILE), "utf8"));
  return cached;
}

/** Bank's rebuttal: a second prompt file with its own system prompt and tool. */
export const REBUTTAL_PROMPT_VERSION = "v1";
export const REBUTTAL_TOOL = "record_bank_rebuttal";
const REBUTTAL_FILE = "prompts/bank-rebuttal-v1.md";

export function parseRebuttalPrompt(md: string): PromptParts {
  const sys = md.split("## System prompt")[1]?.match(/```text\n([\s\S]*?)\n```/);
  const tool = md.split(`## Tool: ${REBUTTAL_TOOL}`)[1]?.match(/```json\n([\s\S]*?)\n```/);
  if (!sys || !tool) throw new Error("Rebuttal prompt file is missing the system prompt or the tool schema");
  return { system: sys[1], toolSchema: JSON.parse(tool[1]) };
}

let cachedRebuttal: PromptParts | undefined;
export function loadRebuttalPrompt(): PromptParts {
  if (!cachedRebuttal) cachedRebuttal = parseRebuttalPrompt(readFileSync(path.join(process.cwd(), REBUTTAL_FILE), "utf8"));
  return cachedRebuttal;
}
