import { DisputeTable } from "@/components/DisputeTable";
import { getDisputeRows } from "@/lib/disputeRows";
import { Patterns } from "@/components/Patterns";
import { StartHere } from "@/components/StartHere";
import { getReasonTip } from "@/lib/data";
import { buildPatterns } from "@/lib/patterns";
import { getRates } from "@/lib/fx";
import { rateNote, rateWord } from "@/lib/rates";
import { ListStats } from "@/components/ListStats";
import Link from "next/link";

export const metadata = { title: "Disputes | Dispute Advisor (concept prototype)" };

export default async function DisputesPage() {
  const rates = await getRates();
  const { rows, tableRows } = getDisputeRows(rates);

  const businesses = new Set(tableRows.map((r) => r.merchant)).size;
  const patterns = buildPatterns(rows.map((r) => ({ code: r.c.dispute.reason_code, reason: r.c.dispute.reason_description, inr: r.inr, call: r.saved?.call ?? null })));
  return (
    <>
      <h1 className="mb-4 text-2xl leading-8 font-semibold">Disputes</h1>
      <StartHere />
      <Link href="/alerts" className="mb-4 flex min-h-10 items-center text-[14px] text-ink-soft">
        <span>
          Want these to come to you? <b className="font-semibold text-brand hover:underline">Choose Slack, WhatsApp or email and set your alert rules</b> (preview).
        </span>
      </Link>
      <ListStats rows={tableRows} rateLabel={rateWord(rates)} />
      <p className="mb-2 hidden text-[13px] text-helper md:block">{`Demo data: ${tableRows.length} disputes from ${businesses} different businesses, so the names change from row to row.`} Soonest deadline first; change the order with Sort. <a href="#patterns" className="font-semibold text-brand hover:underline">What is causing them ↓</a></p>
      <DisputeTable rows={tableRows} rateNote={rateNote(rates)} />
      <Patterns
        patterns={patterns}
        tips={Object.fromEntries(patterns.map((p) => [p.code, getReasonTip(p.code)]))}
      />
    </>
  );
}
