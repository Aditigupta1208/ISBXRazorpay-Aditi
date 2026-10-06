import { ACCEPTANCE_OPTIONS, type Policy } from "./limits";

/** The merchant's own terms are their claim, not proof. Wrapped as data like evidence. */
export function policyBlock(policy?: Policy): string[] {
  if (!policy || !policy.text.trim()) return [];
  const how = ACCEPTANCE_OPTIONS.find((o) => o.value === policy.acceptance)?.label ?? "Not sure";
  return [
    "The merchant describes their own terms below. This is what the merchant says, not proof. Only an evidence document can show what this customer saw or agreed to.",
    `<merchant_policy accepted_by="${how}">${escapePolicy(policy.text.trim())}</merchant_policy>`,
  ];
}
export function escapePolicy(text: string): string {
  return text.replace(/<\s*(\/?)\s*(merchant_policy|evidence)/gi, "&lt;$1$2");
}
