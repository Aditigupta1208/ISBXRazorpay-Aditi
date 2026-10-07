import Link from "next/link";
import { CallChip } from "@/components/CallChip";
import { PageTitle } from "@/components/ui";
import { getDisputeRows } from "@/lib/disputeRows";
import { getRates } from "@/lib/fx";
import { formatInr } from "@/lib/format";

export const metadata = { title: "Where it sits | Dispute Advisor (concept prototype)" };

const STEPS = [
  ["1", "Open Disputes, as you do today", "Transactions, then Disputes. Razorpay lists each dispute with its reason, amount and deadline."],
  ["2", "See the advisor's call on each", "A new column says Fight, Fold or Escalate, worked out from your evidence and Visa's rule for that reason."],
  ["3", "Review it, then you decide", "Open a dispute to see why, the money and a draft that cites your documents. Nothing is sent until you approve."],
];

const SIDE: { label: string; kind: "off" | "parent" | "child-off" | "active" | "live"; href?: string; badge?: string }[] = [
  { label: "Home", kind: "off" },
  { label: "Transactions", kind: "parent" },
  { label: "Payments", kind: "child-off" },
  { label: "Orders", kind: "child-off" },
  { label: "Refunds", kind: "child-off" },
  { label: "Disputes", kind: "active", href: "/disputes" },
  { label: "Settlements", kind: "off" },
  { label: "Reports", kind: "off" },
  { label: "Agent Studio", kind: "parent" },
  { label: "Dispute Advisor", kind: "live", href: "/agent-studio", badge: "New" },
];

export default async function DashboardEntry() {
  const rates = await getRates();
  const { tableRows } = getDisputeRows(rates);
  const need = tableRows.filter((r) => r.call !== "shield");
  const due24 = need.filter((r) => r.hours < 24).length;
  const shown = tableRows.slice(0, 7);

  return (
    <>
      <PageTitle eyebrow="Where it sits" title="Dispute Advisor inside the Razorpay Dashboard">
        A concept view of how a merchant reaches it. The path is the one they already use for disputes. The advisor adds a call to each dispute.
      </PageTitle>

      <ol className="mb-5 grid gap-3 md:grid-cols-3" aria-label="How a merchant gets here">
        {STEPS.map(([n, t, d]) => (
          <li key={n} className="rounded-2xl border border-line bg-white p-4">
            <span aria-hidden className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-soft text-[12px] font-semibold text-brand">{n}</span>
            <b className="block text-[14px]">{t}</b>
            <span className="block text-[12px] text-ink-soft">{d}</span>
          </li>
        ))}
      </ol>

      <section id="dashboard-frame" aria-label="Concept view of the Razorpay Dashboard" className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-[#F6F7F9] px-4 py-2 text-[12px] text-helper">
          <span className="font-semibold text-ink-soft">Razorpay Dashboard · Transactions · Disputes</span>
          <span>Concept view, not the real dashboard</span>
        </div>
        <div className="grid md:grid-cols-[210px_minmax(0,1fr)]">
          <nav aria-label="Dashboard menu (concept)" className="hidden border-r border-line bg-[#FBFBFC] p-3 md:block">
            <ul className="space-y-0.5 text-[14px]">
              {SIDE.map((i) => {
                const child = i.kind === "child-off" || i.kind === "active";
                const base = `flex min-h-9 items-center justify-between gap-2 rounded-lg px-3 ${child ? "ml-3" : ""}`;
                if (i.href)
                  return (
                    <li key={i.label}>
                      <Link href={i.href} aria-current={i.kind === "active" ? "page" : undefined} className={`${base} font-semibold ${i.kind === "active" ? "bg-brand-soft text-brand" : "text-ink hover:bg-[#F0F2F5]"}`}>
                        {i.label}
                        {i.badge && <span className="rounded-full bg-[#E3F5EC] px-2 py-0.5 text-[12px] font-semibold text-fight">{i.badge}</span>}
                      </Link>
                    </li>
                  );
                return (
                  <li key={i.label}>
                    <span aria-disabled="true" className={`${base} ${i.kind === "parent" ? "mt-2 font-semibold text-ink-soft" : "text-helper"}`}>{i.label}</span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 px-3 text-[12px] text-helper">Greyed items are not part of this concept.</p>
          </nav>

          <div className="min-w-0 p-4 md:p-5">
            <h2 className="mb-3 text-[16px] font-semibold">Disputes</h2>

            <div id="advisor-entry" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand bg-[#F4F8FF] p-4">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[14px] font-semibold">
                  Dispute Advisor
                  <span className="rounded-full bg-[#E3F5EC] px-2 py-0.5 text-[12px] font-semibold text-fight">New</span>
                </p>
                <p className="text-[14px] text-ink-soft">
                  {need.length} disputes need a decision, and the advisor has made a call on each. {due24} are due within 24 hours.
                </p>
              </div>
              <Link href="/disputes" className="inline-flex min-h-11 items-center rounded-[10px] bg-brand px-5 text-[14px] font-semibold text-white hover:bg-brand-focus">Open Dispute Advisor</Link>
            </div>

            <ul className="lg:hidden" aria-label="Disputes">
              {shown.map((r) => (
                <li key={r.id} className="border-b border-line last:border-0">
                  <Link href={`/disputes/${r.id}`} className="block py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold">{r.amount} <span className="font-normal text-helper">· {r.inr}</span></span>
                      <span className={`text-[12px] font-semibold ${r.warn ? "text-warn" : "text-helper"}`}>{r.timeText} left</span>
                    </div>
                    <div className="text-[12px] text-ink-soft">{r.reasonCode} {r.reason}</div>
                    <div className="mt-1.5">{r.call && <CallChip call={r.call} />}</div>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="relative hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-[14px]">
                <caption className="sr-only">Disputes as Razorpay lists them, with the Dispute Advisor call added</caption>
                <thead>
                  <tr className="border-b border-line text-[12px] text-helper">
                    <th scope="col" className="py-2 pr-3 font-normal">Dispute</th>
                    <th scope="col" className="px-3 py-2 font-normal">Reason</th>
                    <th scope="col" className="px-3 py-2 font-normal">Amount</th>
                    <th scope="col" className="px-3 py-2 font-normal">Respond by</th>
                    <th scope="col" className="rounded-t-lg bg-[#F4F8FF] px-3 py-2 font-semibold text-brand">Dispute Advisor</th>
                    <th scope="col" className="py-2 pl-3"><span className="sr-only">Open</span></th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((r) => (
                    <tr key={r.id} className="relative border-b border-line last:border-0 hover:bg-[#FAFCFF]">
                      <td className="py-3 pr-3">
                        <Link href={`/disputes/${r.id}`} className="font-mono text-[12px] text-ink-soft after:absolute after:inset-0 after:content-['']">{r.disputeId}</Link>
                        <div className="text-[12px] text-helper">{r.merchant}</div>
                      </td>
                      <td className="px-3 py-3"><span className="rounded-md bg-[#F1F4FB] px-1.5 py-px font-mono text-[12px]">{r.reasonCode}</span> <span className="text-ink-soft">{r.reason}</span></td>
                      <td className="px-3 py-3 font-semibold whitespace-nowrap">{r.amount}<span className="font-normal text-helper"> · {r.inr}</span></td>
                      <td className={`px-3 py-3 font-semibold whitespace-nowrap ${r.warn ? "text-warn" : ""}`}>{r.warn && <span aria-hidden>⚠ </span>}{r.timeText}</td>
                      <td className="bg-[#F4F8FF] px-3 py-3">{r.call && <CallChip call={r.call} />}</td>
                      <td className="py-3 pl-3 text-right font-semibold whitespace-nowrap text-brand">Review →</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-[12px] text-helper">
              Showing {shown.length} of {tableRows.length} · {formatInr(need.reduce((s, r) => s + r.inrNumber, 0))} at stake.{" "}
              <Link href="/disputes" className="-my-2 inline-block py-2 font-semibold text-brand hover:underline">See all in Dispute Advisor</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
