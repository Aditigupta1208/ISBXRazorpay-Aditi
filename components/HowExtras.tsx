import { Card, Section } from "@/components/ui";
import { FAILURES, METRICS, TIERS, POSITION, HEARD, MERCHANT_LIMITS, TOOLS, ASSUMPTIONS, SHADOW_MODE, WHY_AI_POINTS, CODE_VS_AI, LOOP_STEPS } from "@/lib/howContent";

const tag: Record<string, string> = {
  Built: "bg-fight-soft text-fight",
  "Built as a preview": "bg-brand-soft text-brand",
  "Not built": "bg-[#F1F3F6] text-ink-soft",
  "Rejected on evidence": "bg-danger-soft text-danger",
};

function Table({ caption, head, rows }: { caption: string; head: string[]; rows: React.ReactNode[][] }) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl border border-line bg-white md:block">
        <table className="w-full text-left text-[14px]">
          <caption className="sr-only">{caption}</caption>
          <thead className="text-[13px] text-helper"><tr>{head.map((h) => <th key={h} scope="col" className="px-3 py-2 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-line align-top">
                {r.map((c, j) => (j === 0 ? <th key={j} scope="row" className="px-3 py-2 font-semibold">{c}</th> : <td key={j} className="px-3 py-2 text-ink-soft">{c}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-2 md:hidden" aria-label={caption}>
        {rows.map((r, i) => (
          <li key={i} className="rounded-2xl border border-line bg-white p-3.5 text-[14px]">
            {r.map((c, j) => (
              <p key={j} className={j === 0 ? "font-semibold" : "mt-1.5 text-ink-soft"}>
                {j > 0 && <span className="block text-[12px] font-semibold tracking-[.6px] text-helper uppercase">{head[j]}</span>}
                {c}
              </p>
            ))}
          </li>
        ))}
      </ul>
    </>
  );
}

export function WhyAiSection({ children }: { children: React.ReactNode }) {
  return (
    <Section id="why-ai" title="Why AI, and why a fixed rule is not enough" note="A rule can check that a document exists. Only reading can tell what it says, notice it contradicts another, and write a response that cites it.">
      <Card>
        <ol className="grid gap-3 md:grid-cols-2">
          {WHY_AI_POINTS.map(([t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-soft text-[12px] font-semibold text-brand" aria-hidden>{i + 1}</span>
              <span className="text-[14px] text-ink-soft"><b className="block font-semibold text-ink">{t}</b>{d}</span>
            </li>
          ))}
        </ol>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {CODE_VS_AI.map((c) => (
            <div key={c.who} className="rounded-xl bg-[#F6F7F9] p-3 text-[13px] text-ink-soft"><b className="block text-[14px] font-semibold text-ink">{c.who}</b>{c.does}</div>
          ))}
        </div>
      </Card>
      <h3 className="mt-4 mb-2 text-[14px] font-semibold">Same documents, different call</h3>
      {children}
      <p className="mt-2 text-[13px] text-helper">The numbers do not carry the argument. On the first 15 scored cases the agent matched the human answer on 15 and the checklist on 8. On the latest run it agrees 87% overall and 75% on cases that need judgment, which is under our own 80% bar; the Evals page shows the gate as failed and nothing was tuned.</p>
    </Section>
  );
}

export function FailuresSection() {
  return (
    <Section id="failures" title="What can go wrong, and what stops it" note="Each row points to the check that handles it. Rule numbers are explained under The nine safety rules.">
      <Table caption="Risks and the checks that stop them" head={["What can go wrong", "What stops it", "Check"]} rows={FAILURES.map((f) => [f.risk, f.stops, <b key="r" className="font-semibold whitespace-nowrap text-ink">{f.rule}</b>])} />
    </Section>
  );
}

export function MetricsSection() {
  return (
    <Section id="metrics" title="What we would measure" note="Targets are targets, not results. Results on this prototype use labelled sample data.">
      <Table caption="Metric tree" head={["Level", "Measure", "Why", "In this prototype"]} rows={METRICS.map((m) => [m.level, <span key="n" className="text-ink">{m.name}</span>, m.why, m.today])} />
    </Section>
  );
}

export function TiersSection() {
  return (
    <Section id="tiers" title="What is in the product" note="Three core features, then the ones that support them, then conveniences.">
      <div className="grid gap-4 md:grid-cols-3">
        {TIERS.map((t) => (
          <Card key={t.tier}>
            <h3 className="text-[14px] font-semibold">{t.tier}</h3>
            <p className="mb-2 text-[13px] text-helper">{t.note}</p>
            <ul className="space-y-2 text-[14px]">
              {t.items.map(([n, d]) => (<li key={n}><b className="block font-semibold">{n}</b><span className="text-ink-soft">{d}</span></li>))}
            </ul>
          </Card>
        ))}
      </div>
    </Section>
  );
}

export function PositionSection() {
  return (
    <Section id="position" title="Where it sits next to what Razorpay already has" note="Based on public descriptions. We have not confirmed Razorpay's own tool behaviour.">
      <div className="grid gap-3 md:grid-cols-3">
        {POSITION.map((p) => (
          <div key={p.name} className={`rounded-2xl border p-4 ${p.ours ? "border-brand bg-brand-soft" : "border-line bg-white"}`}>
            <h3 className="text-[14px] font-semibold">{p.name}</h3>
            <dl className="mt-2 space-y-2 text-[13px]">
              <div><dt className="text-helper">Covers</dt><dd className="text-ink-soft">{p.covers}</dd></div>
              <div><dt className="text-helper">Who acts</dt><dd className="text-ink-soft">{p.who}</dd></div>
              <div><dt className="text-helper">{p.ours ? "What we add" : "The gap"}</dt><dd className="text-ink-soft">{p.gap}</dd></div>
            </dl>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function MerchantsContent() {
  return (
    <>
      <Section id="heard" title="What merchants told us, and what changed" note="Three conversations with Indian businesses that take card payments from abroad, plus follow-ups on a dispute each had accepted or lost. Paraphrased; names and businesses removed.">
        <Table caption="What merchants said and what it changed" head={["What we heard", "Who", "What it changed", "Status"]} rows={HEARD.map((h) => [<span key="h" className="font-normal text-ink-soft">{h.heard}</span>, h.who, h.built, <span key="s" className={`inline-block rounded-full px-2.5 py-0.5 text-[12px] font-semibold whitespace-nowrap ${tag[h.status] ?? ""}`}>{h.status}</span>])} />
      </Section>
      <Section id="merchant-limits" title="What these conversations do not show">
        <Card><ul className="list-disc space-y-1.5 pl-5 text-[14px] text-ink-soft">{MERCHANT_LIMITS.map((l) => <li key={l}>{l}</li>)}</ul></Card>
      </Section>
    </>
  );
}

export function SourcesContent() {
  return (
    <>
      <Section id="tools" title="External tools, data and services used" note="The challenge asks for these to be stated.">
        <Table caption="External tools, data and services" head={["Tool or source", "Used for", "Note"]} rows={TOOLS.map((t) => [t.name, t.used, t.note])} />
      </Section>
      <Section id="assumptions" title="Assumptions, and how we would check them" note="All disputes and documents here are made up. These are the things that would have to be true for the real product.">
        <Table caption="Assumptions and checks" head={["We assume", "How we would check it"]} rows={ASSUMPTIONS.map((a) => [<span key="a" className="font-normal text-ink-soft">{a.a}</span>, a.check])} />
        <Card className="mt-3"><p className="text-[14px] text-ink-soft">{SHADOW_MODE}</p></Card>
      </Section>
    </>
  );
}

const WHO_CLS: Record<string, string> = { You: "bg-brand-soft text-brand", Automatic: "bg-fight-soft text-fight", Builder: "bg-[#F1F3F6] text-ink-soft" };

/** The learning loop with who does each step. Used on Results. */
export function LearningLoop() {
  return (
    <Section id="loop" title="How it learns" note="It calibrates and tests. It does not retrain a model on one merchant's few outcomes.">
      <Card>
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-label="The learning loop">
          {LOOP_STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-2.5 rounded-xl bg-[#F4F8FF] p-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-[12px] font-semibold text-brand ring-1 ring-[#C9D7F5]" aria-hidden>{i + 1}</span>
              <span className="min-w-0 text-[13px] text-ink-soft">
                <b className="block text-[14px] font-semibold text-ink">{s.title}</b>
                {s.note}
                <span className={`mt-1 block w-fit rounded-full px-2 py-0.5 text-[12px] font-semibold ${WHO_CLS[s.who]}`}>{s.who === "You" ? "You" : s.who === "Automatic" ? "Automatic" : "Builder decides"}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-[13px] text-helper">In a real launch, Razorpay&apos;s outcomes by reason code and bank would be the learning signal. Only the platform holds that data.</p>
      </Card>
    </Section>
  );
}
