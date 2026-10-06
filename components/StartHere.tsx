import Link from "next/link";

const STEPS = [
  { id: "C06", title: "A fight call", text: "A cancelled subscription, 14 hours left. See the cited draft and the seven safety checks." },
  { id: "C15", title: "An escalate call", text: "A group tour where only half is owed. The advisor stops and asks for one document." },
  { id: "C10", title: "A clear win", text: "A small refund dispute with full proof. Nothing to add, so it is ready to review." },
];

function Step({ s, i }: { s: (typeof STEPS)[number]; i: number }) {
  return (
    <li className="relative flex items-center gap-3 rounded-xl border border-line p-3 hover:border-brand focus-within:ring-2 focus-within:ring-brand-soft md:block">
      <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[13px] font-semibold text-brand md:mb-1.5">{i + 1}</span>
      <span className="min-w-0 flex-1 md:block">
        <b className="block text-[15px]">{s.title}</b>
        <span className="hidden text-[13px] text-ink-soft md:block">{s.text}</span>
      </span>
      <Link href={`/disputes/${s.id}`} className="shrink-0 text-[13px] font-medium text-brand after:absolute after:inset-0 after:content-[''] hover:underline md:mt-2 md:inline-block">
        <span className="md:hidden">Open {s.id} →</span>
        <span className="hidden md:inline">Open dispute {s.id} →</span>
      </Link>
    </li>
  );
}

/** Desktop: a card with three steps. Phone: one folded line, so the list stays on the first screen. */
export function StartHere() {
  return (
    <section aria-labelledby="start-here" className="mb-4 rounded-2xl border border-line bg-white md:p-5">
      <details className="group p-3.5 md:hidden">
        <summary className="flex min-h-10 cursor-pointer items-center justify-between text-[15px] font-semibold">
          <span id="start-here">New here? Try these three</span>
          <span aria-hidden className="text-brand transition-transform group-open:rotate-90">›</span>
        </summary>
        <p className="mt-1 mb-3 text-[13px] text-helper">About two minutes. Nothing is sent anywhere.</p>
        <ol className="grid gap-2">{STEPS.map((s, i) => <Step key={s.id} s={s} i={i} />)}</ol>
      </details>
      <div className="hidden md:block">
        <h2 className="text-[17px] font-semibold">New here? Try these three</h2>
        <p className="mb-3 text-[13px] text-helper">About two minutes. Nothing is sent anywhere.</p>
        <ol className="grid grid-cols-3 gap-3">{STEPS.map((s, i) => <Step key={s.id} s={s} i={i} />)}</ol>
      </div>
    </section>
  );
}
