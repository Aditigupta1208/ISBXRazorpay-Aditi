/**
 * What a contest needs, by reason code, in plain words, mapped to Razorpay's evidence slots.
 * Sources: Visa "Dispute Management Guidelines for Visa Merchants" (June 2024), pages 37 to 47, and Razorpay's
 * contest-dispute API (the 11 slots and what each one is for). This is a checklist, not a guarantee.
 */
export const SOURCES = {
  visa: { label: "Visa: Dispute Management Guidelines for Visa Merchants (June 2024)", url: "https://usa.visa.com/content/dam/VCOM/global/support-legal/documents/merchants-dispute-management-guidelines.pdf" },
  razorpay: { label: "Razorpay: Contest a dispute (API)", url: "https://razorpay.com/docs/api/disputes/contest/" },
  razorpayBlog: { label: "Razorpay: international chargebacks for Indian businesses", url: "https://razorpay.com/blog/international-payment-chargebacks-for-indian-businesses-how-to-win-prevent-and-handle-them" },
} as const;

/** Plain label and what Razorpay says each slot is for. */
export const SLOT_INFO: Record<string, { label: string; what: string }> = {
  shipping_proof: { label: "Proof of delivery", what: "Shows the product was shipped to the customer's address." },
  billing_proof: { label: "Order confirmation or receipt", what: "Shows what was ordered, such as a receipt or invoice." },
  cancellation_proof: { label: "Proof of cancellation", what: "Shows the product or service was cancelled, and when." },
  customer_communication: { label: "Customer messages", what: "Written or email messages where the customer confirms they got it or are satisfied." },
  proof_of_service: { label: "Proof the service was provided", what: "Shows the service was given to the customer." },
  explanation_letter: { label: "Your explanation letter", what: "A letter from you with anything the bank should know." },
  refund_confirmation: { label: "Refund confirmation", what: "Shows a refund was given to the customer." },
  access_activity_log: { label: "Login and usage log", what: "Server or activity logs showing the customer used or downloaded the product." },
  refund_cancellation_policy: { label: "Refund or cancellation policy", what: "Your policy, as shown to the customer." },
  term_and_conditions: { label: "Terms and conditions", what: "Your sales terms, as shown to the customer." },
  others: { label: "Anything else", what: "A document that does not fit the other slots." },
};

export interface Requirement {
  need: string; // what the bank is looking for, in plain words
  slots: string[]; // any one of these slots covers it
  why: string;
  src?: "visa" | "razorpay";
}
export interface CodeChecklist {
  key: Requirement[]; // usually decides the dispute
  helpful: Requirement[]; // strengthens it
}

export const CHECKLISTS: Record<string, CodeChecklist> = {
  "13.1": {
    key: [
      { need: "Proof the customer received or used it", slots: ["proof_of_service", "access_activity_log", "shipping_proof"], why: "Visa lets you answer with proof the customer, or someone they authorised, received it.", src: "visa" },
    ],
    helpful: [
      { need: "The customer saying they got it or were happy", slots: ["customer_communication"], why: "Written messages are strong evidence of receipt.", src: "razorpay" },
      { need: "What was ordered", slots: ["billing_proof"], why: "Ties the delivery to the order." },
      { need: "Your own explanation", slots: ["explanation_letter"], why: "Say anything the documents do not make clear." },
    ],
  },
  "13.2": {
    key: [
      { need: "The terms they agreed to, including renewal", slots: ["term_and_conditions"], why: "Shows what they signed up for and when it renews." },
      { need: "When and how they cancelled", slots: ["cancellation_proof"], why: "The dates decide whether the charge came before or after the cancel." },
      { need: "They kept using it after cancelling", slots: ["access_activity_log", "proof_of_service"], why: "Visa lets you answer with proof the customer used the service after withdrawing permission.", src: "visa" },
    ],
    helpful: [
      { need: "Messages with the customer", slots: ["customer_communication"], why: "Shows what they asked for and when." },
      { need: "Order confirmation", slots: ["billing_proof"], why: "Shows the original purchase." },
      { need: "A refund you already gave", slots: ["refund_confirmation"], why: "If the credit was already issued, show it.", src: "visa" },
      { need: "Your own explanation", slots: ["explanation_letter"], why: "Say anything the documents do not make clear." },
    ],
  },
  "13.3": {
    key: [
      { need: "What was sold: the description, quote or contract", slots: ["billing_proof", "term_and_conditions"], why: "Visa asks for an invoice, contract or similar that answers the claim.", src: "visa" },
      { need: "What was delivered", slots: ["proof_of_service", "access_activity_log", "shipping_proof"], why: "Shows the delivery matches the description." },
    ],
    helpful: [
      { need: "The customer accepting or being satisfied", slots: ["customer_communication"], why: "Shows they did not object at the time.", src: "razorpay" },
      { need: "Your own explanation", slots: ["explanation_letter"], why: "Say anything the documents do not make clear." },
    ],
  },
  "13.6": {
    key: [
      { need: "Proof the refund was already given, or that none was due", slots: ["refund_confirmation", "refund_cancellation_policy", "term_and_conditions"], why: "Visa lets you show the credit was processed, or that the sale was valid and no credit was due. Terms the customer accepted at checkout count when they include the refund policy.", src: "visa" },
    ],
    helpful: [
      { need: "Order confirmation", slots: ["billing_proof"], why: "Shows the original sale." },
      { need: "Messages with the customer", slots: ["customer_communication"], why: "Shows what was agreed about the refund." },
      { need: "Your own explanation", slots: ["explanation_letter"], why: "Say anything the documents do not make clear." },
    ],
  },
  "13.7": {
    key: [
      { need: "Your cancellation policy, as shown to the customer", slots: ["refund_cancellation_policy"], why: "Visa asks for proof the policy was properly disclosed.", src: "visa" },
      { need: "Proof they agreed to it when they bought", slots: ["term_and_conditions"], why: "It must be agreed at the time of sale. Online, that means a click-to-accept button.", src: "visa" },
      { need: "When and how they cancelled", slots: ["cancellation_proof"], why: "Shows whether they followed the policy." },
    ],
    helpful: [
      { need: "They kept using it after cancelling", slots: ["access_activity_log", "proof_of_service"], why: "Visa lists continued use as a rebuttal.", src: "visa" },
      { need: "Messages with the customer", slots: ["customer_communication"], why: "Shows what was said about the cancellation." },
      { need: "Your own explanation", slots: ["explanation_letter"], why: "Say anything the documents do not make clear." },
    ],
  },
};

export interface Row extends Requirement {
  covered: boolean;
  evidenceIds: string[]; // documents that fill it
}
export interface ChecklistResult {
  key: Row[];
  helpful: Row[];
  keyCovered: number;
  keyTotal: number;
}

/** documentsBySlot: slot name to the evidence IDs placed in it. */
export function checklistFor(code: string, documentsBySlot: Map<string, string[]>): ChecklistResult | null {
  const c = CHECKLISTS[code];
  if (!c) return null;
  const row = (r: Requirement): Row => {
    const ids = r.slots.flatMap((s) => documentsBySlot.get(s) ?? []);
    return { ...r, covered: ids.length > 0, evidenceIds: [...new Set(ids)] };
  };
  const key = c.key.map(row);
  return { key, helpful: c.helpful.map(row), keyCovered: key.filter((r) => r.covered).length, keyTotal: key.length };
}
