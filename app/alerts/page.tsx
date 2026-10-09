import { AlertsView } from "@/components/AlertsView";
import { getDisputeRows } from "@/lib/disputeRows";
import { getCheckView } from "@/lib/data";
import { getRates } from "@/lib/fx";
import { formatInr, formatOriginal, timeLeft } from "@/lib/format";
import { checklistFor } from "@/lib/evidenceChecklist";
import { namedGap } from "@/lib/namedGap";
import type { AlertRow } from "@/lib/alertRules";

export const metadata = { title: "Alerts | Dispute Advisor (concept prototype)" };

export default async function AlertsPage() {
  const rates = await getRates();
  const { rows } = getDisputeRows(rates);
  const alertRows: AlertRow[] = rows.map(({ c, inr, saved }) => {
    const v = getCheckView(c.id);
    const slotMap = new Map<string, string[]>();
    for (const s of v?.slots ?? []) slotMap.set(s.slot, [...(slotMap.get(s.slot) ?? []), s.evidenceId]);
    const keyDocs = v && v.call !== "shield" ? checklistFor(c.dispute.reason_code, slotMap) : null;
    const gap = v
      ? namedGap({ call: v.call, getFirst: v.getFirst, missingEvidence: v.missingEvidence, uncoveredKeyNeeds: (keyDocs?.key ?? []).filter((r) => !r.covered).map((r) => r.need), decidingEvidence: v.decidingEvidence })
      : null;
    return {
      id: c.id,
      disputeId: c.dispute.id,
      merchant: c.merchant.split(".")[0],
      amountText: formatOriginal(c.dispute.amount, c.dispute.currency),
      inr,
      inrText: formatInr(inr),
      reasonCode: c.dispute.reason_code,
      reason: c.dispute.reason_description,
      hours: c.dispute.respond_by_hours_left,
      timeText: timeLeft(c.dispute.respond_by_hours_left).text,
      call: saved?.call ?? null,
      odds: v?.odds ?? null,
      gap: gap ? `${gap.label}: ${gap.text}` : null,
    };
  });
  return <AlertsView rows={alertRows} />;
}
