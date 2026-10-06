import { getDemoCases, getSavedResult } from "@/lib/data";
import { byUrgency } from "@/lib/list";
import { formatInr, formatOriginal, merchantShort, timeLeft, toInr } from "@/lib/format";
import type { Rates } from "@/lib/rates";
import type { Row } from "@/components/DisputeTable";

/** The demo disputes, most urgent first, with the advisor's saved call on each. Shared by the dashboard entry and the Disputes tab. */
export function getDisputeRows(rates: Rates) {
  const rows = getDemoCases()
    .map((c) => {
      const inr = toInr(c.dispute.amount / 100, c.dispute.currency, rates);
      return { c, inr, saved: getSavedResult(c.id) };
    })
    .sort((a, b) => byUrgency({ hours: a.c.dispute.respond_by_hours_left, inr: a.inr, shield: a.saved?.call === "shield" }, { hours: b.c.dispute.respond_by_hours_left, inr: b.inr, shield: b.saved?.call === "shield" }));

  const tableRows: Row[] = rows.map(({ c, inr, saved }) => {
    const tl = timeLeft(c.dispute.respond_by_hours_left);
    return {
      id: c.id,
      disputeId: c.dispute.id,
      merchant: merchantShort(c.merchant),
      amount: formatOriginal(c.dispute.amount, c.dispute.currency),
      inr: formatInr(inr),
      inrNumber: inr,
      reasonCode: c.dispute.reason_code,
      reason: c.dispute.reason_description,
      timeText: tl.text,
      warn: tl.warn,
      hours: c.dispute.respond_by_hours_left,
      call: saved?.call ?? null,
    };
  });
  return { rows, tableRows };
}
