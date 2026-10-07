/** Input limits shared by the browser form and the server route. */
export const MAX_EVIDENCE_CHARS = 4000;
export const MAX_TITLE_CHARS = 80;
export const MAX_ADDED = 5;
export const MAX_POLICY_CHARS = 1000;
/** How the merchant says customers accept their terms (Agent setup). */
export const ACCEPTANCE_OPTIONS = [
  { value: "checkbox", label: "Checkbox at checkout" },
  { value: "email", label: "Confirmed by email" },
  { value: "footer", label: "Link in the website footer only" },
  { value: "unsure", label: "Not sure" },
] as const;
export type Acceptance = (typeof ACCEPTANCE_OPTIONS)[number]["value"];
export interface Policy {
  text: string;
  acceptance: Acceptance;
}

/** Bank's rebuttal asks for a short answer, so it gets a smaller output cap than the main check. */
export const DEFAULT_REBUTTAL_TOKENS = 1200;
