import { DisputeTable } from "@/components/DisputeTable";
import { getDisputeRows } from "@/lib/disputeRows";
import { Patterns } from "@/components/Patterns";
import { StartHere } from "@/components/StartHere";
import { getReasonTip } from "@/lib/data";
import { buildPatterns } from "@/lib/patterns";
import { getRates } from "@/lib/fx";
import { rateNote, rateWord } from "@/lib/rates";
import { formatInr } from "@/lib/format";

export const metadata = { title: "Disputes | Dispute Advisor (concept prototype)" };

export default async function DisputesPage() {
  const rates = await getRates();
  const { rows, tableRows } = getDisputeRows(rates);

  const patterns = buildPatterns(rows.map((r) => ({ code: r.c.dispute.reason_code, reason: r.c.dispute.reason_description, inr: r.inr, call: r.saved?.call ?? null })));
  const needDecision = rows.filter((r) => r.saved?.call !== "shield");
  const atStake = needDecision.reduce((s, r) => s + r.inr, 0);
  const due24 = needDecision.filter((r) => r.c.dispute.respond_by_hours_left < 24).length;

  return (
    <>
      <h1 className="mb-4 text-2xl leading-8 font-semibold">Disputes</h1>
      <StartHere />
      <div className="mb-4 grid grid-cols-3 gap-2 md:gap-4">
        <Stat label="Need a decision" value={String(needDecision.length)} />
        <Stat label={`At stake (${rateWord(rates)})`} value={formatInr(atStake)} />
        <Stat label="Due within 24 hours" value={String(due24)} warn />
      </div>
      <p className="mb-2 hidden text-[13px] text-helper md:block">Demo data: 16 disputes from 16 different businesses, so the names change from row to row. Soonest deadline first; change the order with Sort. <a href="#patterns" className="font-semibold text-brand hover:underline">What is causing them ↓</a></p>
      <DisputeTable rows={tableRows} rateNote={rateNote(rates)} />
      <Patterns
        patterns={patterns}
        tips={Object.fromEntries(patterns.map((p) => [p.code, getReasonTip(p.code)]))}
      />
    </>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,.03)] md:p-[22px]">
      <span className="block text-[13px] leading-4 text-helper">{label}</span>
      <b className={`text-[24px] font-semibold ${warn && value !== "0" ? "text-warn" : ""}`}>{value}</b>
    </div>
  );
}
