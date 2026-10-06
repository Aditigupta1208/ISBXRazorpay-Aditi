import { DisputeTable, type Row } from "@/components/DisputeTable";
import { Patterns } from "@/components/Patterns";
import { StartHere } from "@/components/StartHere";
import { getDemoCases, getReasonTip, getSavedResult } from "@/lib/data";
import { buildPatterns } from "@/lib/patterns";
import { byUrgency } from "@/lib/list";
import { getRates } from "@/lib/fx";
import { rateNote, rateWord } from "@/lib/rates";
import { formatInr, formatOriginal, merchantShort, timeLeft, toInr } from "@/lib/format";

export const metadata = { title: "Disputes | Dispute Advisor (concept prototype)" };

export default async function DisputesPage() {
  const rates = await getRates();
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
      <p className="mb-2 hidden text-[13px] text-helper md:block">Demo data: 16 disputes from 16 different businesses, so the names change from row to row. Due within 24 hours comes first.</p>
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
      <span className="block text-[12px] leading-4 text-helper md:text-[13px]">{label}</span>
      <b className={`text-xl font-semibold md:text-[26px] ${warn && value !== "0" ? "text-warn" : ""}`}>{value}</b>
    </div>
  );
}
