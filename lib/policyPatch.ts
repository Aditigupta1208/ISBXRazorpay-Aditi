/**
 * "Policy patch": ready-to-adapt wording for the next customer, by reason code. A fixed template, not a model answer, so it never depends on a key.
 * Square brackets are blanks for the merchant to fill in. It is a starting point, not legal advice.
 */
export interface PatchBlock {
  kind: "Checkout wording" | "Email to send" | "Keep this record";
  title: string;
  text: string;
}

export const POLICY_PATCH: Record<string, PatchBlock[]> = {
  "13.1": [
    { kind: "Checkout wording", title: "Say how and when it is delivered", text: "After payment we email access to [customer email] within [time]. If you have not received it, write to [support email] and we will resend it." },
    { kind: "Email to send", title: "Access email with the first-use link", text: "Hi [name], your [product] is ready. Start here: [link]. We record your first sign-in so we can help if anything is not working." },
    { kind: "Keep this record", title: "Export the logs before access ends", text: "Before you close an account or its access ends, export the sign-in and usage log (dates, number of sessions or downloads) and keep it with the order. It is the document that decides most non-delivery disputes." },
  ],
  "13.2": [
    { kind: "Checkout wording", title: "Renewal terms with a tick box", text: "[ ] I agree that [plan] renews automatically every [period] at [price] until I cancel. I can cancel any time at [link] before the renewal date." },
    { kind: "Email to send", title: "Reminder before each renewal", text: "Hi [name], your [plan] renews on [date] for [price]. To cancel, go to [link] before then. Reply to this email if you need help." },
    { kind: "Email to send", title: "Cancellation confirmation with the effective date", text: "Hi [name], we have received your request to cancel [plan]. It ends on [date]. You will not be charged again." },
    { kind: "Keep this record", title: "Keep the account audit log", text: "Keep the log of plan changes and cancellation requests for each account. It shows whether a cancellation was ever requested." },
  ],
  "13.3": [
    { kind: "Checkout wording", title: "State what is and is not included", text: "This purchase includes [what is included]. It does not include [exclusions]. By paying you confirm you have read this." },
    { kind: "Email to send", title: "Ask for sign-off at each milestone", text: "Hi [name], milestone [n] is ready: [link]. Please reply 'approved' or tell us what to change by [date]." },
    { kind: "Keep this record", title: "Save the page as sold", text: "Save a dated copy of the product or service page, and of the signed scope, for every sale. A later change to the page must not rewrite what the customer saw." },
  ],
  "13.6": [
    { kind: "Checkout wording", title: "A refund policy the customer ticks", text: "[ ] I have read the refund policy: refunds can be requested within [number] days of purchase at [link]. After that we cannot refund, but we can [alternative]." },
    { kind: "Email to send", title: "Refund confirmation the same day", text: "Hi [name], we refunded [amount] on [date]. Your bank can take [number] business days to show it. Reference: [refund id / bank reference]." },
    { kind: "Keep this record", title: "Keep the bank reference", text: "For every refund, keep the refund id and the bank or acquirer reference number. It proves the credit was processed." },
  ],
  "13.7": [
    { kind: "Checkout wording", title: "Cancellation terms with a tick box", text: "[ ] I have read the cancellation policy: [terms, including deadlines and any fee] at [link]." },
    { kind: "Email to send", title: "Repeat the terms in the confirmation email", text: "Hi [name], thanks for booking [service] on [date]. Cancellation: [terms]. To cancel, use [link]." },
    { kind: "Keep this record", title: "Keep the acceptance record", text: "Keep the checkout record that shows the customer ticked the policy, with the date and the customer's email." },
  ],
};

export function policyPatchFor(code: string): PatchBlock[] | null {
  return POLICY_PATCH[code] ?? null;
}
