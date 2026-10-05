export const metadata = { title: "How it works | Dispute Advisor (concept prototype)" };

const FLOW = [
  ["1", "Dispute and evidence", "Razorpay's dispute record plus the documents you have."],
  ["2", "The check", "Claude reads them with Visa's rule for the reason code (prompt v2.1)."],
  ["3", "Safety rules", "Seven checks in code can change or block the answer."],
  ["4", "You decide", "Edit, approve, fold or ask for a document. Nothing goes without a click."],
  ["5", "Outcome", "Mark won or lost. Next steps and a prevention tip."],
];

const RULES = [
  ["R1", "The answer has every expected field."],
  ["R2", "Every sentence of the draft cites a document. Cited documents must exist."],
  ["R3", "The deciding documents exist. If not, the call becomes Escalate."],
  ["R4", "Fight needs good confidence and nothing missing. Otherwise it becomes Escalate."],
  ["R5", "Fraud reasons (10.x) go to Chargeback Shield before any AI call."],
  ["R6", "The draft is 1,000 characters or less."],
  ["R7", "Full card numbers are rejected."],
];

const ANSWERS = [
  ["What data or signal does it use?", "Razorpay's dispute record and payment facts, plus the evidence you add. Your own terms are read too, but only as your claim, never as proof."],
  ["Why AI and not a fixed rule?", "A checklist only sees which documents are attached. The AI reads what they say, spots contradictions, weighs the money and knows when to stop. On our 15 scored test cases it matched the human answer on 15 and a checklist on 8 (saved v1 run; see Evals)."],
  ["What action does it take?", "It recommends Fight, Fold or Escalate, maps documents to Razorpay's evidence slots, and drafts a response that cites a document in every sentence. Nothing is sent from this prototype."],
  ["What does the merchant control?", "Everything that matters. Every submit and fold needs approval. You can edit the draft, override the call (your reason goes in the audit trail), or turn the agent off."],
  ["How does it learn?", "In a real product, won and lost outcomes by reason code and evidence type would sharpen advice. In this prototype the outcome is stored in your browser and shown back to you. No model is trained."],
  ["How is accuracy and trust protected?", "The seven safety rules, a saved result when the live check fails, an audit trail, and evidence treated as data, never as instructions. The Evals page shows where it is still weak."],
  ["What business result does it aim at?", "More money recovered per rupee disputed, more disputes answered before the deadline, less time per dispute, and fewer repeat disputes after prevention fixes."],
];

export default function HowItWorksPage() {
  return (
    <>
      <h1 className="mb-1 text-2xl leading-8 font-semibold">How it works</h1>
      <p className="mb-6 max-w-[760px] text-[15px] text-ink-soft">
        Dispute Advisor helps Indian businesses that sell services, subscriptions, travel or digital goods to international customers. When a card dispute is not about fraud, it reads your evidence, applies Visa&apos;s rule, and tells you whether to fight, fold or escalate, with the money maths and a draft that cites every source.
      </p>

      <ol className="mb-8 grid gap-3 md:grid-cols-5" aria-label="Flow">
        {FLOW.map(([n, t, d]) => (
          <li key={n} className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,.03)]">
            <span aria-hidden className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-soft text-[13px] font-semibold text-brand">{n}</span>
            <b className="block text-[15px]">{t}</b>
            <span className="text-[13px] text-ink-soft">{d}</span>
          </li>
        ))}
      </ol>

      <Section title="The seven safety rules" note="They run in code after every answer. You can see each result on the dispute page.">
        <ul className="space-y-2">
          {RULES.map(([id, t]) => (
            <li key={id} className="flex gap-3 text-[15px]"><b className="w-8 shrink-0 text-brand">{id}</b><span>{t}</span></li>
          ))}
        </ul>
      </Section>

      <Section title="The seven questions in the challenge brief">
        <dl className="space-y-4">
          {ANSWERS.map(([q, a]) => (
            <div key={q}>
              <dt className="text-[15px] font-semibold">{q}</dt>
              <dd className="max-w-[760px] text-[15px] text-ink-soft">{a}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="One assumption to confirm">
        <p className="max-w-[760px] text-[15px] text-ink-soft">
          We assume Razorpay&apos;s Dispute Responder does not today recommend fold or fight for a merchant&apos;s own evidence. Razorpay&apos;s Agentic Dashboard demo shows Ray reading an uploaded file in chat, so reading uploads alone is not new. What we add is the dispute-specific rule, the money maths and the Escalate call. We could not confirm this with the Agent Studio team.
        </p>
      </Section>

      <Section title="Left out on purpose">
        <p className="max-w-[760px] text-[15px] text-ink-soft">
          Fraud disputes (Chargeback Shield covers them), pre-dispute alerts, real calls to Razorpay (requests are shown, not sent), connections to booking or product systems, contacting customers, arbitration, sign-in and several merchants, and a mobile app.
        </p>
      </Section>

      <Section title="Limits you should know">
        <ul className="max-w-[760px] list-disc space-y-1.5 pl-5 text-[15px] text-ink-soft">
          <li>All 20 test cases are written by us from public patterns. The documents inside them are made up.</li>
          <li>The answer key is our reading of Visa&apos;s rules. It is not a real win rate.</li>
          <li>Exchange rates and fees in the money maths are demo values and are labelled that way.</li>
          <li>Without an API key this demo shows saved results. A new check on added evidence needs the live model.</li>
          <li>Odds on saved results are derived from the confidence level. Live checks give the model&apos;s own estimate. Neither is a promise.</li>
        </ul>
      </Section>
    </>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold">{title}</h2>
      {note && <p className="mb-2 text-[13px] text-helper">{note}</p>}
      <div className={note ? "" : "mt-2"}>{children}</div>
    </section>
  );
}
