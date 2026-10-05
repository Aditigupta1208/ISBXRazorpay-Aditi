/**
 * Token prices for Claude Sonnet 5.5, USD per million tokens.
 * Source: https://platform.claude.com/docs/en/about-claude/models/overview (checked 6 Oct 2026).
 * Recheck at https://platform.claude.com/docs/en/about-claude/pricing before launch.
 */
export const PRICE_IN_PER_M = 2;
export const PRICE_OUT_PER_M = 10;

export function costUsd(tokensIn: number, tokensOut: number): number {
  return (tokensIn * PRICE_IN_PER_M + tokensOut * PRICE_OUT_PER_M) / 1_000_000;
}
