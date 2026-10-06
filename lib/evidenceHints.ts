/** What usually decides each reason code, in the merchant's words. From the Visa rules in data/labels.json. */
const HINTS: Record<string, string> = {
  "13.1": "proof the service was delivered or used: a delivery confirmation, a login or usage log, emails showing it was received.",
  "13.2": "the terms the customer accepted, any cancellation request (and when), and login or usage after the cancel date.",
  "13.3": "what was sold (the signed scope, quote or description page), what was delivered, and the customer's messages about it.",
  "13.6": "proof a refund was issued (a refund ID or bank record), or the refund policy the customer accepted.",
  "13.7": "the cancellation policy, proof the customer agreed to it when they bought, and the cancellation request.",
};

export function evidenceHint(reasonCode: string): string | null {
  return HINTS[reasonCode] ?? null;
}
