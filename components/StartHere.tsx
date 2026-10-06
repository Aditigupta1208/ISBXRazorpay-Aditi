"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { TourLink } from "./TourLink";

const KEY = "da:v1:tips-hidden";

const EXAMPLES = [
  { id: "C06", label: "a Fight call" },
  { id: "C15", label: "an Escalate call" },
  { id: "C10", label: "a clear win" },
];

/** The first thing a new visitor sees: what this is, and two ways in (the tour, or an example). Can be hidden. */
export function StartHere() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    try { setHidden(localStorage.getItem(KEY) === "1"); } catch { /* storage may be blocked */ }
  }, []);
  const set = (v: boolean) => {
    setHidden(v);
    try { localStorage.setItem(KEY, v ? "1" : "0"); } catch { /* ignore */ }
  };
  if (hidden) {
    return (
      <p className="mb-4 text-[13px] text-helper">
        <button type="button" onClick={() => set(false)} className="-my-3 inline-block py-3 font-semibold text-brand hover:underline">Show the welcome</button>
      </p>
    );
  }
  return (
    <section aria-labelledby="start-here" className="mb-5 rounded-2xl bg-[#E9EFFC] p-4 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="start-here" className="text-xl font-semibold text-[#0f1c3d] md:text-[22px]">Should you fight this dispute?</h2>
          <p className="mt-1 text-[14px] leading-5 text-[#3a4663] md:hidden">Tells you whether to fight, fold or escalate each card dispute. You approve everything.</p>
          <p className="mt-1 hidden max-w-[640px] text-[15px] leading-6 text-[#3a4663] md:block">
            When a customer disputes a card payment, Dispute Advisor reads your evidence and Visa&apos;s rule and tells you whether to <b className="font-semibold text-[#0f1c3d]">fight, fold or escalate</b>, with the money worked out and a response that cites every document. You approve everything.
          </p>
        </div>
        <button type="button" onClick={() => set(true)} className="-mt-2 -mr-2 min-h-10 shrink-0 px-2 text-[13px] font-semibold text-[#3a4663] underline">Hide</button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 md:mt-4">
        <TourLink className="min-h-11 rounded-[10px] bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-focus" label="Take the 2-minute tour" />
        <p className="hidden text-[13px] text-[#3a4663] md:block">
          or open an example:{" "}
          {EXAMPLES.map((e, i) => (
            <span key={e.id}>
              {i > 0 && ", "}
              <Link href={`/disputes/${e.id}`} className="-my-3 inline-block py-3 font-medium text-brand hover:underline">{e.label} ({e.id})</Link>
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
