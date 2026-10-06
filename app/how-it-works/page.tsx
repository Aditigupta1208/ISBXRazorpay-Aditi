import Link from "next/link";
import { PROMPT_VERSION } from "@/lib/prompt";
import { SOURCES } from "@/lib/evidenceChecklist";
import { ODDS_PRIOR_WEIGHT } from "@/lib/results";
import { THRESHOLDS } from "@/lib/eval";
import { getCases } from "@/lib/data";

export const metadata = { title: "How it works | Dispute Advisor (concept prototype)" };

const FLOW = [
  ["1", "The dispute arrives", "Razorpay's record: $480, reason 13.2 (cancelled recurring transaction), 14 hours left.", "/disputes/C06", "Open it"],
  ["2", "It reads your documents", "Four of them, against Visa's rule for that reason: a customer who cancelled but kept using the service loses.", "/disputes/C06", "See the documents"],
  ["3", "It makes the call", "The login log shows use after the claimed cancellation and the billing log shows no cancel. Fight, with high confidence.", "/disputes/C06", "See the reason"],
  ["4", "Seven rules check it", "Code, not the AI, can downgrade a Fight to Escalate if a document is missing or a sentence has no source.", "#rules", "See the rules"],
  ["5", "You decide, then it learns", "Review the draft and approve. Mark Won or Lost and the next estimate moves.", "/results", "See Results"],
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

const RULE_CHECK = [
  ["13.1", "37", "Matches. Visa also lets you answer if the delivery date has not passed or the customer cancelled before delivery; the advisor does not model those."],
  ["13.2", "39", "Matches the rebuttal: proof the customer used the service after withdrawing permission. Visa also lists processing the credit."],
  ["13.3", "40", "Matches: an invoice, contract or similar that answers the claim. Visa also allows a neutral third-party opinion on quality; not modelled."],
  ["13.6", "45", "Matches: the credit was already processed, or the sale was valid and none was due."],
  ["13.7", "46 to 47", "Matches: the policy must be disclosed and agreed at the time of sale, and online that means a click-to-accept. The advisor treats this narrowly on purpose; the guide also allows other answers, such as a credit already given."],
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
      <p className="text-[13px] font-semibold tracking-[.6px] text-helper uppercase">For reviewers</p>
      <h1 className="mb-1 text-2xl leading-8 font-semibold">How it works</h1>
      <p className="mb-5 max-w-[760px] text-[15px] text-ink-soft">
        For businesses that sell services, subscriptions, travel or digital goods abroad. When a customer disputes a card payment and it is not fraud, Dispute Advisor tells you whether to fight, fold or escalate, and why.
      </p>

      <section id="one-minute" aria-labelledby="one-minute-h" className="mb-8 scroll-mt-4">
        <h2 id="one-minute-h" className="text-lg font-semibold">One dispute, start to finish</h2>
        <p className="mb-3 text-[14px] text-ink-soft">A customer in Ireland disputes a $480 subscription charge. They say: &ldquo;I cancelled this.&rdquo;</p>
        <ol className="grid gap-3 md:grid-cols-5" aria-label="Flow">
          {FLOW.map(([n, t, d, href, cta]) => (
            <li key={n} className="relative rounded-2xl border border-line bg-white p-4 focus-within:ring-2 focus-within:ring-brand-soft hover:border-brand">
              <span aria-hidden className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-soft text-[13px] font-semibold text-brand">{n}</span>
              <b className="block text-[15px]">{t}</b>
              <span className="block text-[13px] text-ink-soft">{d}</span>
              <Link href={href} className="mt-2 inline-block text-[13px] font-medium text-brand after:absolute after:inset-0 after:content-[''] hover:underline">{cta} →</Link>
            </li>
          ))}
        </ol>
      </section>

      <Section id="rules" title="The seven safety rules" note="They run in code after every answer. You can see each result on the dispute page.">
        <ul className="grid gap-x-10 gap-y-2 md:grid-cols-2">
          {RULES.map(([id, t]) => (
            <li key={id} className="flex gap-3 text-[15px]"><b className="w-8 shrink-0 text-brand">{id}</b><span>{t}</span></li>
          ))}
        </ul>
      </Section>

      <Section id="learning" title="How it learns, and how a change ships" note="What this prototype does today, and what a real launch would add.">
        <div className="grid gap-x-10 gap-y-5 md:grid-cols-2">
          <div>
            <h3 className="text-[15px] font-semibold">After an outcome (built)</h3>
            <ul className="mt-1 list-disc space-y-1.5 pl-5 text-[15px] text-ink-soft">
              <li>Marking a dispute won or lost updates your record on the Results page.</li>
              <li>Your record shifts the odds shown on the next dispute where the advisor was equally confident. The AI&apos;s estimate counts as {ODDS_PRIOR_WEIGHT} past fights, so a few results move it a little and many take over. The money check then uses the adjusted odds.</li>
              <li>A miss (the advisor said Fight and it was lost, or said Fold and you won) can be downloaded as a candidate eval case, with names and numbers masked and a proposed answer a person must confirm.</li>
              <li>Here all of this stays in your browser. A real launch would store outcomes per merchant, queue misses for review and recalibrate on all merchants together.</li>
            </ul>
          </div>
          <div>
            <h3 className="text-[15px] font-semibold">Before a prompt or model change ships (the gate)</h3>
            <p className="mt-1 text-[15px] text-ink-soft">The change is run on every case in the eval set ({getCases().length} today) with <code>npm run eval -- --gate</code>. It ships only if no measure is below its launch bar and every hidden-instruction case is resisted. The previous prompt (v2.1) is kept as the baseline to compare against.</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px] text-ink-soft">
              {THRESHOLDS.map((t) => (
                <li key={t.key}>{t.label}: {t.dir === "min" ? "at least" : "at most"} {Math.round(t.launch * 100)}%</li>
              ))}
              <li>Hidden instructions resisted: all of them</li>
            </ul>
            <p className="mt-2 text-xs text-helper">The gate is a command we run before changing the live prompt, not an automatic block on deploys.</p>
          </div>
        </div>
      </Section>

      <div className="mt-10 border-t border-line pt-6">
        <h2 className="text-xl font-semibold">For reviewers</h2>
        <p className="mb-5 text-[13px] text-helper">The challenge brief&apos;s seven questions, what we assumed, what we left out, and where this prototype is weak.</p>

        <Section title="The seven questions in the challenge brief">
          <dl className="grid gap-x-10 gap-y-4 md:grid-cols-2">
            {ANSWERS.map(([q, a]) => (
              <div key={q}>
                <dt className="text-[15px] font-semibold">{q}</dt>
                <dd className="text-[15px] text-ink-soft">{a}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <div className="grid gap-x-10 md:grid-cols-2">
          <Section title="One assumption to confirm">
            <p className="text-[15px] text-ink-soft">
              We assume Razorpay&apos;s Dispute Responder does not today recommend fold or fight for a merchant&apos;s own evidence. Razorpay&apos;s Agentic Dashboard demo shows Ray reading an uploaded file in chat, so reading uploads alone is not new. What we add is the dispute-specific rule, the money maths and the Escalate call. We could not confirm this with the Agent Studio team.
            </p>
          </Section>

          <Section title="Left out on purpose">
            <p className="text-[15px] text-ink-soft">
              Fraud disputes (Chargeback Shield covers them), pre-dispute alerts, real calls to Razorpay (requests are shown, not sent), connections to booking or product systems, contacting customers, arbitration, sign-in and several merchants, and a mobile app.
            </p>
          </Section>
        </div>

        <Section title="Where the rules come from" note="Checked on 6 Oct 2026 against the published sources. The five rules were written first from public guides, then compared with these.">
          <ul className="mb-3 list-disc space-y-1 pl-5 text-[15px] text-ink-soft">
            <li><a className="text-brand underline" href={SOURCES.visa.url} target="_blank" rel="noreferrer">{SOURCES.visa.label}</a>: the rules for each reason code.</li>
            <li><a className="text-brand underline" href={SOURCES.razorpay.url} target="_blank" rel="noreferrer">{SOURCES.razorpay.label}</a>: the 11 evidence slots, the 1,000 character summary, draft and submit.</li>
            <li><a className="text-brand underline" href={SOURCES.razorpayBlog.url} target="_blank" rel="noreferrer">{SOURCES.razorpayBlog.label}</a>: the USD 600 Visa arbitration fee (from 1 April 2025) and the response windows.</li>
          </ul>
          <div className="overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full text-left text-[14px]">
              <caption className="sr-only">Each rule compared with Visa&apos;s merchant guide</caption>
              <thead className="text-[13px] text-helper"><tr><th scope="col" className="px-3 py-2 font-medium">Code</th><th scope="col" className="px-3 py-2 font-medium">Visa guide page</th><th scope="col" className="px-3 py-2 font-medium">Result of the check</th></tr></thead>
              <tbody>
                {RULE_CHECK.map(([code, page, note]) => (
                  <tr key={code} className="border-t border-line align-top"><th scope="row" className="px-3 py-2 font-semibold">{code}</th><td className="px-3 py-2 whitespace-nowrap">{page}</td><td className="px-3 py-2 text-ink-soft">{note}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[13px] text-helper">The guide is the June 2024 edition, so a newer one may differ. Everything here is a reading of public documents, not legal or Visa advice. Razorpay&apos;s response windows (3 business days for the first stage, then 2, then 1) are shown in its guide; this demo uses hours left and the first stage only.</p>
        </Section>

        <Section title="What this demo counts">
          <p className="text-[15px] text-ink-soft">
            If the builder has connected a counter, the demo adds one to an anonymous count when you open a dispute, re-run a check, upload, submit, fold, mark an outcome, or view Results, Evals or this page, and once for a first visit. No names, emails, IP addresses, cookies, evidence text or accounts are stored, and nothing is counted if your browser sends Do Not Track. Your outcomes and drafts stay in your own browser.
          </p>
        </Section>

        <Section title="Limits you should know">
          <ul className="list-disc space-y-1.5 pl-5 text-[15px] text-ink-soft md:columns-2 md:gap-10">
            <li>All {getCases().length} test cases are written by us from public patterns. The documents inside them are made up.</li>
            <li>The answer key is our reading of Visa&apos;s rules. It is not a real win rate.</li>
            <li>Exchange rates and fees in the money maths are demo values and are labelled that way.</li>
            <li>Without an API key this demo shows saved results. A new check on added evidence needs the live model.</li>
            <li>Odds on saved results are derived from the confidence level. Live checks give the model&apos;s own estimate. Neither is a promise.</li>
          </ul>
        </Section>
      </div>
    </>
  );
}

function Section({ id, title, note, children }: { id?: string; title: string; note?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-8 scroll-mt-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {note && <p className="mb-2 text-[13px] text-helper">{note}</p>}
      <div className={note ? "" : "mt-2"}>{children}</div>
    </section>
  );
}
