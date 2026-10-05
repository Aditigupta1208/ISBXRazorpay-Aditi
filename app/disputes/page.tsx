import Link from "next/link";
import { CallChip } from "@/components/CallChip";
import { getCases, getSavedResult } from "@/lib/data";
import { formatInr, formatOriginal, merchantShort, timeLeft, toInr } from "@/lib/format";

export const metadata = { title: "Disputes | Dispute Advisor (concept prototype)" };

export default function DisputesPage() {
  const rows = getCases()
    .map((c) => {
      const inr = toInr(c.dispute.amount / 100, c.dispute.currency);
      return { c, inr, saved: getSavedResult(c.id), score: inr / (c.dispute.respond_by_hours_left + 12) };
    })
    .sort((a, b) => b.score - a.score);

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
      <div className="relative overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[720px] border-collapse text-[15px]">
          <thead>
            <tr className="border-b border-line bg-[#FAFAFA] text-left text-xs font-semibold text-helper">
              <th className="px-[18px] py-3.5">Dispute</th>
              <th className="px-[18px] py-3.5">Amount</th>
              <th className="px-[18px] py-3.5">Reason</th>
              <th className="px-[18px] py-3.5 whitespace-nowrap">Time left</th>
              <th className="px-[18px] py-3.5">Call</th>
              <th className="px-[18px] py-3.5">
                <span className="sr-only">Open</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ c, inr, saved }) => {
              const t = timeLeft(c.dispute.respond_by_hours_left);
              return (
                <tr key={c.id} className="border-b border-[#F1F1F1] hover:bg-[#FAFCFF]">
                  <td className="px-[18px] py-4">
                    <div className="font-mono text-[13px] text-[#555]">{c.dispute.id}</div>
                    <div className="text-[13px] text-helper">{merchantShort(c.merchant)}</div>
                  </td>
                  <td className="px-[18px] py-4 font-semibold whitespace-nowrap">
                    {formatOriginal(c.dispute.amount, c.dispute.currency)}
                    <span className="font-normal text-helper"> · {formatInr(inr)}</span>
                  </td>
                  <td className="px-[18px] py-4">
                    <span className="rounded-md bg-[#F1F4FB] px-1.5 py-px font-mono text-xs text-[#344]">
                      {c.dispute.reason_code}
                    </span>{" "}
                    {c.dispute.reason_description}
                  </td>
                  <td className={`px-[18px] py-4 font-semibold ${t.warn ? "text-warn" : ""}`}>
                    {t.warn && <span aria-hidden>⚠ </span>}
                    {t.text}
                  </td>
                  <td className="px-[18px] py-4">{saved ? <CallChip call={saved.call} /> : <span className="text-helper">Not checked</span>}</td>
                  <td className="px-[18px] py-4">
                    <Link href={`/disputes/${c.id}`} className="font-semibold text-brand">
                      Details
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="px-[18px] py-3.5 text-[13px] text-helper">
          Calls are saved results from the kill test. Amounts in ₹ use a fixed demo rate.
        </p>
      </div>
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
