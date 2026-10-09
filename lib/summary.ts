/** A plain-text summary a merchant can paste to a colleague. Built only from what the screen already shows. */
export interface SummaryInput {
  disputeId: string;
  merchant: string;
  amountOriginal: string; // "$1,200"
  amountInr: string; // "₹1,05,600"
  reasonCode: string;
  reasonDescription: string;
  customerClaim: string;
  timeLeft: string; // "30h"
  call: "fight" | "fold" | "escalate" | "shield";
  confidence?: string;
  reasonLine: string;
  gap: { label: string; text: string } | null;
  history: string | null; // "2 earlier payments (...). No earlier disputes."
  documents: { id: string; name: string }[];
  actionTaken?: string; // "Submitted (simulated)"
}

const CALL: Record<SummaryInput["call"], string> = { fight: "Fight", fold: "Fold (accept)", escalate: "Escalate (get one document first)", shield: "Fraud: Chargeback Shield handles it" };

export function buildSummary(i: SummaryInput): string {
  const lines = [
    `Dispute ${i.disputeId}: ${i.amountOriginal} (${i.amountInr}), Visa ${i.reasonCode} ${i.reasonDescription}`,
    i.merchant,
    `Customer says: "${i.customerClaim}"`,
    `Time left to respond: ${i.timeLeft}`,
    "",
    `Advisor's call: ${CALL[i.call]}${i.confidence && i.call !== "shield" ? `, ${i.confidence} confidence` : ""}`,
  ];
  if (i.gap) lines.push(`${i.gap.label}: ${i.gap.text}`);
  if (i.reasonLine) lines.push(`Why: ${i.reasonLine}`);
  if (i.history) lines.push(`Customer history: ${i.history}`);
  if (i.documents.length > 0) {
    lines.push("", "Documents:");
    for (const d of i.documents) lines.push(`- ${d.id}: ${d.name}`);
  }
  if (i.actionTaken) lines.push("", `Status: ${i.actionTaken}`);
  lines.push("", "Prepared by Dispute Advisor (a concept prototype, not a Razorpay product). It is a recommendation: nothing has been sent, and the merchant decides.");
  return lines.join("\n");
}
