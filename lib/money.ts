/**
 * Money maths (docs/pm/03-prd.md section 7.4).
 * Fight is worth it when p * A > (1 - p) * F + E
 *   A = amount worth contesting, in INR at the demo rate
 *   p = AI estimate of winning (0 to 1)
 *   F = fees at risk if the dispute escalates and is lost (Visa arbitration fee, USD 600, converted)
 *   E = effort cost (default INR 500)
 * Sources, checked 5 Oct 2026: Razorpay international chargebacks guide
 * https://razorpay.com/blog/international-payment-chargebacks-for-indian-businesses-how-to-win-prevent-and-handle-them
 */
export const DEMO_RATE_INR_PER_USD = 88; // placeholder, labelled "demo rate" in the UI
const OTHER_RATES: Record<string, number> = { GBP: 115, EUR: 100 }; // demo rates, same label
export const VISA_ARBITRATION_FEE_USD = 600;
export const DEFAULT_EFFORT_COST_INR = 500;

export function rateFor(currency: string): number {
  return currency === "USD" ? DEMO_RATE_INR_PER_USD : OTHER_RATES[currency] ?? DEMO_RATE_INR_PER_USD;
}

export interface MoneyInput {
  amountSubunits: number; // full disputed amount
  currency: string;
  contestSubunits?: number; // part being contested; defaults to the full amount
  odds: number; // 0 to 1
  effortInr?: number;
}

export interface MoneyResult {
  atStakeInr: number; // lost if the merchant folds or loses
  contestInr: number;
  feesAtRiskInr: number;
  expectedGainInr: number; // p * A
  expectedCostInr: number; // (1 - p) * F + E
  worthFighting: boolean;
}

export function moneyCheck(i: MoneyInput): MoneyResult {
  const rate = rateFor(i.currency);
  const atStakeInr = (i.amountSubunits / 100) * rate;
  const contestSubunits = Math.min(i.contestSubunits ?? i.amountSubunits, i.amountSubunits);
  const contestInr = (contestSubunits / 100) * rate;
  const feesAtRiskInr = VISA_ARBITRATION_FEE_USD * DEMO_RATE_INR_PER_USD;
  const p = Math.max(0, Math.min(1, i.odds));
  const expectedGainInr = p * contestInr;
  const expectedCostInr = (1 - p) * feesAtRiskInr + (i.effortInr ?? DEFAULT_EFFORT_COST_INR);
  return {
    atStakeInr,
    contestInr,
    feesAtRiskInr,
    expectedGainInr,
    expectedCostInr,
    worthFighting: expectedGainInr > expectedCostInr,
  };
}
