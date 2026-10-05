import { DisputeTable, type Row } from "@/components/DisputeTable";
import { getDemoCases, getSavedResult } from "@/lib/data";
import { formatInr, formatOriginal, merchantShort, timeLeft, toInr } from "@/lib/format";

export const metadata = { title: "Disputes | Dispute Advisor (concept prototype)" };

export default function DisputesPage() {
  const rows = getDemoCases()
    .map((c) => {
      const inr = toInr(c.dispute.amount / 100, c.dispute.currency);
      return { c, inr, saved: getSavedResult(c.id), score: inr / (c.dispute.respond_by_hours_left + 12) };
    })
    .sort((a, b) => b.score - a.score);

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

  const needDecision = rows.filter((r) => r.saved?.call !== "shield");
  const atStake = needDecision.reduce((s, r) => s + r.inr, 0);
  const due24 = needDecision.filter((r) => r.c.dispute.respond_by_hours_left < 24).length;

  return (
    <>
      <h1 className="mb-4 text-2xl leading-8 font-semibold">Disputes</h1>
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <Stat label="Need a decision" value={String(needDecision.length)} />
        <Stat label="At stake (demo rate)" value={formatInr(atStake)} />
        <Stat label="Due within 24 hours" value={String(due24)} warn />
      </div>
      <DisputeTable rows={tableRows} />
    </>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-[22px] shadow-[0_1px_2px_rgba(0,0,0,.03)]">
      <span className="block text-[13px] text-helper">{label}</span>
      <b className={`text-[26px] font-semibold ${warn && value !== "0" ? "text-warn" : ""}`}>{value}</b>
    </div>
  );
}
