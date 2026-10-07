/**
 * Token prices for Claude Sonnet 5.5, USD per million tokens.
 * Source: https://platform.claude.com/docs/en/about-claude/models/overview (checked 6 Oct 2026).
 * Recheck at https://platform.claude.com/docs/en/about-claude/pricing before launch.
 */
export const PRICE_IN_PER_M = 2;
export const PRICE_OUT_PER_M = 10;

/**
 * Gemini 3.8 Flash list price (paid tier), USD per million tokens, through 31 Dec 2026.
 * Source: https://ai.google.dev/gemini-api/docs/pricing (checked 7 Oct 2026). The free tier costs nothing, so this is the most it can cost.
 */
export const GEMINI_PRICE_IN_PER_M = 0.75;
export const GEMINI_PRICE_OUT_PER_M = 3.75;

export function costUsd(tokensIn: number, tokensOut: number, model = ""): number {
  const gemini = model.startsWith("gemini");
  const pin = gemini ? GEMINI_PRICE_IN_PER_M : PRICE_IN_PER_M;
  const pout = gemini ? GEMINI_PRICE_OUT_PER_M : PRICE_OUT_PER_M;
  return (tokensIn * pin + tokensOut * pout) / 1_000_000;
}
