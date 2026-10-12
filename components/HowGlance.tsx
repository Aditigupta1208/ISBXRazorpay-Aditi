import Link from "next/link";
import { Card, Section } from "@/components/ui";
import { Ico } from "@/components/HowVisuals";
import { TIERS } from "@/lib/howContent";

export interface GlanceFacts {
  /** Share of scored cases where the latest run matched the human answer, 0 to 1. Null when there is no run. */
  agreement: number | null;
  scored: number;
  gatePass: boolean | null;
  failedMeasures: string[];
}

const SEVEN: { q: string; a: string; href: string; icon: string }[] = [
  { q: "What signals the opportunity?", a: "A card dispute on a service or subscription payment, plus the documents the merchant holds. Razorpay's own tool does not cover these.", href: "#tools", icon: "docs" },
  { q: "Why AI and not a fixed rule?", a: "A rule sees that a document exists. Only reading shows what it says, and that two of them disagree.", href: "#why-ai", icon: "scale" },
  { q: "What does it recommend?", a: "Fight, Accept or Get a document, priced in rupees, with a draft that cites a document in every sentence.", href: "#tiers", icon: "flag" },
  { q: "What does the merchant control?", a: "Everything. Edit, approve, accept or switch it off. Nothing is sent without a click.", href: "#failures", icon: "hand" },
  { q: "How does it learn?", a: "It calibrates on your outcomes and turns misses into tests. It does not retrain a model.", href: "/results#loop", icon: "loop" },
  { q: "How is trust protected?", a: "Nine code checks, a labelled fallback when the AI fails, and an eval with a release gate that we show failing.", href: "#failures", icon: "shield" },
  { q: "What outcome is measured?", a: "Net dispute value recovered, answered on time, win rate, with wrong-call rates as guardrails.", href: "#metrics", icon: "chart" },
];

/** The whole argument on one screen. The other tabs keep every detail. */
export function HowGlance({ facts }: { facts: GlanceFacts }) {
  const core = TIERS[0].items;
  return (
    <>
      <div className="mb-6 rounded-2xl bg-brand-soft p-4 md:p-5">
        <p className="text-[18px] leading-7 font-semibold">Other tools help you fight. Dispute Advisor tells you whether you should, and shows you why.</p>
        <p className="mt-1 max-w-[760px] text-[14px] text-ink-soft">For Indian businesses that sell services, subscriptions or digital goods to customers abroad. When the dispute is not fraud, the merchant gets a priced call and a response they can trace to their own documents, before a 3-day clock runs out.</p>
      </div>

      <p data-testid="glossary" className="mb-6 text-[13px] text-helper">Words: the model's output says fight, fold or escalate. Merchants see <b className="font-semibold text-ink">Fight</b>, <b className="font-semibold text-ink">Accept</b> (fold) and <b className="font-semibold text-ink">Get a document</b> (escalate).</p>

      <Section id="glance-core" title="Three things to look at">
        <div className="grid gap-3 md:grid-cols-3">
          {core.map(([n, d], i) => (
            <Card key={n}>
              <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-soft text-[13px] font-semibold text-brand" aria-hidden>{i + 1}</span>
              <h3 className="mt-2 text-[14px] font-semibold">{n}</h3>
              <p className="mt-1 text-[14px] text-ink-soft">{d}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="glance-evidence" title="What backs it up">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-line bg-white p-4"><p className="text-[13px] text-helper">First test</p><p className="text-[24px] leading-8 font-semibold">15 of 15</p><p className="text-[13px] text-ink-soft">calls matched a person; a fixed checklist got 8 of 15</p></div>
          <div className="rounded-2xl border border-line bg-white p-4"><p className="text-[13px] text-helper">Latest run</p><p className="text-[24px] leading-8 font-semibold">{facts.agreement === null ? "n/a" : `${Math.round(facts.agreement * 100)}%`}</p><p className="text-[13px] text-ink-soft">agreement on {facts.scored} cases, including 10 held-out</p></div>
          <div className="rounded-2xl border border-line bg-white p-4"><p className="text-[13px] text-helper">Release gate</p><p className={`text-[24px] leading-8 font-semibold ${facts.gatePass ? "text-fight" : "text-danger"}`}>{facts.gatePass === null ? "n/a" : facts.gatePass ? "Pass" : "Fail"}</p><p className="text-[13px] text-ink-soft">{facts.gatePass === false ? `below the bar on ${facts.failedMeasures.length}; nothing tuned` : "no measure below its bar"}</p></div>
          <div className="rounded-2xl border border-line bg-white p-4"><p className="text-[13px] text-helper">Merchants</p><p className="text-[24px] leading-8 font-semibold">3</p><p className="text-[13px] text-ink-soft">conversations shaped what we built and rejected</p></div>
        </div>
        <p className="mt-2 text-[13px] text-helper">The data is synthetic and the scoring is ours. Weakest spot: on cases that need judgment the agent agrees with the human answer {facts.failedMeasures.length > 0 ? "below our own bar" : "above our bar"}.{" "}
          <Link href="/evals" className="font-semibold text-brand hover:underline">See the Evals page</Link></p>
      </Section>

      <Section id="glance-seven" title="The brief's seven questions, in one line each" note="Each answer links to the full detail in the other tabs.">
        <ul className="grid gap-2.5 md:grid-cols-2">
          {SEVEN.map((s, i) => (
            <li key={s.q} className="flex gap-3 rounded-2xl border border-line bg-white p-3.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand"><Ico name={s.icon} /></span>
              <div className="min-w-0 text-[14px]">
                <p className="text-[12px] font-semibold tracking-[.6px] text-helper uppercase">{i + 1}. {s.q}</p>
                <p className="mt-0.5 text-ink-soft">{s.a}</p>
                {s.href.startsWith("/") ? <Link href={s.href} className="mt-1 inline-flex min-h-8 items-center text-[13px] font-semibold text-brand hover:underline">In depth →</Link> : <a href={s.href} className="mt-1 inline-flex min-h-8 items-center text-[13px] font-semibold text-brand hover:underline">In depth →</a>}
              </div>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
