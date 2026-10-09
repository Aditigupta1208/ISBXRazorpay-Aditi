"use client";
import Link from "next/link";
import { SLOT_INFO } from "@/lib/evidenceChecklist";
import { formatOriginal } from "@/lib/format";
import { exhibitMap, responseWithExhibits } from "@/lib/packet";
import type { CaseData, CheckView } from "@/lib/types";
import { useCaseState } from "@/lib/useCaseState";

const name = (e: { title?: string; content: string }) => {
  const first = e.content.split(/[:.]/)[0].trim();
  const n = e.title || first;
  return n.length > 60 ? n.slice(0, 57).trimEnd() + "…" : n;
};

/** A print-ready evidence packet: cover, contents, the response, and each document as a numbered exhibit. Nothing is sent anywhere. */
export function PacketView({ c, view: savedView }: { c: CaseData; view: CheckView }) {
  const d = c.dispute;
  const { state, ready } = useCaseState(c.id);
  const view = state.check?.view ?? savedView;
  const all = [...c.evidence, ...(state.added ?? [])] as { id: string; title?: string; content: string }[];
  const slotOf = new Map(view.slots.map((s) => [s.evidenceId, s.slot]));
  const included = all.filter((e) => slotOf.has(e.id));
  const left = all.filter((e) => !slotOf.has(e.id));
  const map = exhibitMap(included.map((e) => e.id));
  const draft = state.draft ?? view.draft;
  const contest = Math.min(state.contestAmount ?? view.defensibleAmount ?? d.amount, d.amount);

  return (
    <div className="mx-auto max-w-[820px] text-[14px] leading-6 print:max-w-none" data-testid="packet">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/disputes/${c.id}`} className="font-semibold text-brand">← Back to the dispute</Link>
        <button type="button" onClick={() => window.print()} className="min-h-10 rounded-[10px] bg-brand px-4 font-semibold text-white">Print or save as PDF</button>
      </div>
      {ready && included.length === 0 && <p className="mb-4 rounded-xl bg-fold-soft px-3 py-2 font-semibold text-fold">No documents are attached yet, so this packet has no exhibits.</p>}

      <section className="rounded-2xl border border-line bg-white p-6 print:border-0 print:p-0">
        <p className="text-[12px] font-semibold tracking-[.6px] text-helper uppercase">Evidence packet · cover summary</p>
        <h1 className="mt-1 text-[26px] leading-8 font-semibold">Dispute {d.id}</h1>
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
          <dt className="text-helper">Merchant and customer</dt><dd>{c.merchant}</dd>
          <dt className="text-helper">Network and reason</dt><dd>{d.network} {d.reason_code} {d.reason_description}</dd>
          <dt className="text-helper">Amount disputed</dt><dd>{formatOriginal(d.amount, d.currency)}</dd>
          <dt className="text-helper">Amount contested</dt><dd>{formatOriginal(contest, d.currency)}</dd>
          <dt className="text-helper">Dispute raised</dt><dd>{d.raised_on}</dd>
          <dt className="text-helper">Customer says</dt><dd>“{c.customer_claim}”</dd>
          <dt className="text-helper">Razorpay record</dt><dd>{c.razorpay_facts}</dd>
        </dl>

        <h2 className="mt-6 text-[16px] font-semibold">Response</h2>
        {draft.trim() ? <p className="mt-1 whitespace-pre-wrap">{responseWithExhibits(draft, map)}</p> : <p className="mt-1 text-helper">No response has been written yet.</p>}

        <h2 className="mt-6 text-[16px] font-semibold">Contents</h2>
        <ol className="mt-1 list-none space-y-0.5">
          {included.map((e) => (
            <li key={e.id}>
              <b>Exhibit {map.get(e.id)}</b>: {name(e)} <span className="text-helper">({SLOT_INFO[slotOf.get(e.id) ?? ""]?.label ?? slotOf.get(e.id)})</span>
            </li>
          ))}
        </ol>
        {left.length > 0 && <p className="mt-2 text-[13px] text-helper">Not included (not placed in a Razorpay slot): {left.map((e) => name(e)).join("; ")}.</p>}
      </section>

      {included.map((e) => (
        <section key={e.id} className="mt-4 rounded-2xl border border-line bg-white p-6 [break-before:page] print:mt-0 print:border-0 print:p-0">
          <p className="text-[12px] font-semibold tracking-[.6px] text-helper uppercase">Exhibit {map.get(e.id)} · {SLOT_INFO[slotOf.get(e.id) ?? ""]?.label ?? slotOf.get(e.id)}</p>
          <h2 className="mt-1 text-[18px] font-semibold">{name(e)}</h2>
          <p className="mt-3 whitespace-pre-wrap">{e.content}</p>
        </section>
      ))}

      <p className="mt-6 text-[12px] text-helper">Prepared with Dispute Advisor, a concept prototype for the Razorpay x ISB AI PM Build Challenge. Not an official Razorpay product. Simulated: nothing here was sent to Razorpay or the bank.</p>
    </div>
  );
}
