/**
 * Evidence is data. Neutralise anything that could close or open our wrapper tags, or pose as a system or tool message.
 * Zero-width characters are removed first and full-width brackets are treated as plain ones, so a tag cannot be disguised.
 */
const TAGS = "evidence|merchant_policy|draft|system|assistant|tool_use|tool_result|function_calls|instructions|user";
export function escapeEvidence(text: string): string {
  const plain = text.replace(/[\u200b-\u200f\u2060\ufeff\u00ad]/g, "");
  return plain.replace(new RegExp(`[<\\uFF1C\\uFE64]\\s*(/?)\\s*(${TAGS})`, "gi"), (_m, slash: string, tag: string) => `&lt;${slash}${tag.toLowerCase()}`);
}
