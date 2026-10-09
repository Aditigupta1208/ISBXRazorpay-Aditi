import Link from "next/link";
import { Fragment, type ReactNode } from "react";

/** Small line icons used across How it works. Decorative: always aria-hidden. */
const PATHS: Record<string, ReactNode> = {
  card: (<><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18M7 15h3" /></>),
  docs: (<><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4M10 12h5M10 16h5" /></>),
  scale: (<><path d="M12 4v16M6 20h12M5 8h14" /><path d="m5 8-3 6a3 3 0 0 0 6 0L5 8Zm14 0-3 6a3 3 0 0 0 6 0l-3-6Z" /></>),
  shield: (<><path d="M12 3 4 6v6c0 4.5 3.2 7.8 8 9 4.8-1.2 8-4.5 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></>),
  hand: (<><path d="M8 11V6a1.5 1.5 0 0 1 3 0v4m0-1V4.5a1.5 1.5 0 0 1 3 0V10m0-1.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2-3.5a1.5 1.5 0 0 1 2.5-1.5L8 14" /></>),
  swords: (<><path d="m4 4 9 9M20 4l-9 9M3 21l4-4m10 4-4-4" /><path d="m4 4 3 .5L4 7.5Zm16 0-3 .5 3 3Z" /></>),
  flag: (<><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></>),
  help: (<><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01" /></>),
  loop: (<><path d="M20 12a8 8 0 0 1-14 5M4 12a8 8 0 0 1 14-5" /><path d="M18 3v4h-4M6 21v-4h4" /></>),
  bank: (<><path d="M3 10 12 4l9 6" /><path d="M5 10v7M10 10v7M14 10v7M19 10v7M3 20h18" /></>),
  box: (<><path d="M3 8 12 3l9 5v8l-9 5-9-5z" /><path d="M3 8l9 5 9-5M12 13v8" /></>),
  chart: (<><path d="M4 20V4M4 20h16" /><path d="m7 15 4-4 3 3 5-6" /></>),
  lock: (<><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>),
};

export function Ico({ name, className = "h-5 w-5" }: { name: keyof typeof PATHS | string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {PATHS[name]}
    </svg>
  );
}

const CHIP = "inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold";
const OUTCOMES = [
  { name: "Fight", tone: "bg-fight-soft", ink: "text-fight", bar: "bg-fight", icon: "swords", text: "Your documents meet Visa's rule. Contest it, with a drafted response that cites a document in every sentence." },
  { name: "Fold", tone: "bg-fold-soft", ink: "text-fold", bar: "bg-fold", icon: "flag", text: "The rule is against you, or winning would cost more than it recovers. Accept it and move on." },
  { name: "Escalate", tone: "bg-escalate-soft", ink: "text-escalate", bar: "bg-escalate", icon: "help", text: "One missing document could change the answer. It names the document and writes the message to get it." },
];

/** The whole product in one picture: a dispute goes in, one of three calls comes out, and you decide. */
export function Hero() {
  return (
    <section aria-labelledby="hero-h" className="mb-8 overflow-hidden rounded-2xl border border-[#C9D7F5] bg-gradient-to-br from-[#EEF3FF] via-white to-white p-4 md:p-6">
      <p className="text-[12px] font-semibold tracking-[.6px] text-[#2B5BC8] uppercase">The idea in one picture</p>
      <h2 id="hero-h" className="mt-1 max-w-[720px] text-[20px] leading-7 font-semibold">A customer disputes a card payment, and it is not fraud. Should you fight it, fold, or find one more document first?</h2>
      <div className="mt-5 grid items-stretch gap-3 md:grid-cols-[210px_auto_minmax(0,1fr)]">
        <div className="rounded-xl border border-line bg-white p-4">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-brand"><Ico name="card" /></span>
          <b className="mt-2 block text-[14px]">A dispute arrives</b>
          <span className="mt-0.5 block text-[13px] text-ink-soft">Razorpay&apos;s record, plus the documents you have: contract, chat, login logs, billing.</span>
          <span className="mt-2 block text-[12px] text-helper">Fraud reasons go to Chargeback Shield instead.</span>
        </div>
        <div aria-hidden className="flex items-center justify-center text-[18px] text-helper"><span className="md:hidden">↓</span><span className="hidden md:inline">→</span></div>
        <ul className="grid gap-3 sm:grid-cols-3" aria-label="The three possible calls">
          {OUTCOMES.map((o) => (
            <li key={o.name} className={`relative overflow-hidden rounded-xl p-4 ${o.tone}`}>
              <span className={`absolute inset-x-0 top-0 h-1 ${o.bar}`} aria-hidden />
              <span className={`flex items-center gap-2 text-[16px] font-semibold ${o.ink}`}><Ico name={o.icon} />{o.name}</span>
              <span className="mt-1.5 block text-[13px] leading-5 text-[#333]">{o.text}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-4 flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-[14px] ring-1 ring-line">
        <span className="text-brand"><Ico name="hand" className="h-5 w-5 shrink-0" /></span>
        <span><b className="font-semibold">You always decide.</b> Nothing is sent to Razorpay, Visa or your customer without your click.</span>
      </p>
    </section>
  );
}

const STAGES = [
  { icon: "box", title: "What goes in", text: "Razorpay's dispute record, your documents, and your own terms (read as your claim, never as proof)." },
  { icon: "scale", title: "The Fold-or-Fight check", text: "The AI applies Visa's rule for that reason, names the deciding documents and works out the money." },
  { icon: "shield", title: "Nine checks in code", text: "Plain code, not the AI, can downgrade a Fight to Escalate and stop any sentence with no source." },
  { icon: "hand", title: "What you get", text: "A call, a drafted response, and a practice run against the bank. You approve.", hi: true },
];

/** The four stages an answer passes through. */
export function Pipeline() {
  return (
    <section aria-label="The pipeline" className="mb-8">
      <h2 className="text-[16px] font-semibold">How an answer is made</h2>
      <p className="mb-3 text-[13px] text-helper">Four stages. The AI does the reading. Code does the checking.</p>
      <ol className="grid items-stretch gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
        {STAGES.map((s, i) => (
          <Fragment key={s.title}>
            {i > 0 && (
              <li aria-hidden className="flex items-center justify-center text-[16px] text-helper md:px-0.5">
                <span className="md:hidden">↓</span>
                <span className="hidden md:inline">→</span>
              </li>
            )}
            <li className={`rounded-2xl border p-4 ${s.hi ? "border-brand bg-[#F4F8FF]" : "border-line bg-white"}`}>
              <span className={`grid h-9 w-9 place-items-center rounded-lg ${s.hi ? "bg-brand text-white" : "bg-[#F1F3F6] text-ink-soft"}`}><Ico name={s.icon} /></span>
              <b className="mt-2 block text-[14px]">{s.title}</b>
              <span className="mt-0.5 block text-[13px] text-ink-soft">{s.text}</span>
            </li>
          </Fragment>
        ))}
      </ol>
    </section>
  );
}

function MiniVisual({ n }: { n: string }) {
  if (n === "1")
    return (
      <span className="mt-2 flex flex-wrap gap-1.5">
        <span className={`${CHIP} bg-[#F1F3F6] text-ink`}>$480</span>
        <span className={`${CHIP} bg-[#F1F3F6] text-ink`}>13.2</span>
        <span className={`${CHIP} bg-fold-soft text-fold`}>14h left</span>
      </span>
    );
  if (n === "2")
    return (
      <span className="mt-2 flex flex-wrap gap-1.5">
        {["E1", "E2", "E3", "E4"].map((e) => (
          <span key={e} className={`${CHIP} bg-brand-soft text-[#2B5BC8]`}>{e}</span>
        ))}
      </span>
    );
  if (n === "3")
    return (
      <span className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className={`${CHIP} bg-fight-soft text-fight`}>Fight</span>
        <span className="text-[12px] text-helper">high confidence</span>
      </span>
    );
  if (n === "4")
    return (
      <span className="mt-2 flex items-center gap-1.5" aria-label="9 of 9 checks passed">
        <span className="flex gap-0.5" aria-hidden>
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="h-2 w-2 rounded-full bg-fight" />
          ))}
        </span>
        <span className="text-[12px] text-helper">9 of 9 passed</span>
      </span>
    );
  return (
    <span className="mt-2 flex flex-wrap gap-1.5">
      <span className={`${CHIP} bg-brand text-white`}>Approve</span>
      <span className={`${CHIP} bg-fight-soft text-fight`}>Won</span>
      <span className={`${CHIP} bg-danger-soft text-danger`}>Lost</span>
    </span>
  );
}

export function FlowCards({ steps }: { steps: string[][] }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Flow">
      {steps.map(([n, t, d, href, cta]) => (
        <li key={n} className="relative rounded-2xl border border-line bg-white p-4 focus-within:ring-2 focus-within:ring-brand-soft hover:border-brand">
          <span aria-hidden className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand text-[13px] font-semibold text-white">{n}</span>
          <b className="block text-[14px]">{t}</b>
          <span className="mt-0.5 block text-[13px] text-ink-soft">{d}</span>
          <MiniVisual n={n} />
          <Link href={href} className="mt-3 inline-block text-[13px] font-semibold text-brand after:absolute after:inset-0 after:content-[''] hover:underline">{cta} →</Link>
        </li>
      ))}
    </ol>
  );
}

/** The nine rules, grouped by what they do when they fire. */
export function RuleGroups({ groups }: { groups: { title: string; note: string; icon: string; ink: string; tone: string; rules: [string, string][] }[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {groups.map((g) => (
        <section key={g.title} aria-label={g.title} className="rounded-2xl border border-line bg-white p-4 md:p-5">
          <div className="flex items-start gap-3">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${g.tone} ${g.ink}`}><Ico name={g.icon} /></span>
            <div>
              <h3 className="text-[15px] font-semibold">{g.title}</h3>
              <p className="text-[13px] text-helper">{g.note}</p>
            </div>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {g.rules.map(([id, t]) => (
              <li key={id} className="flex gap-3 py-2 text-[14px] first:pt-0 last:pb-0">
                <b className={`w-8 shrink-0 ${g.ink}`}>{id}</b>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

const LOOP = [
  ["You act", "Approve, fold or escalate."],
  ["Mark the result", "Won or Lost, once you know."],
  ["Your record updates", "Results shows what really happened."],
  ["Next estimate moves", "Odds on the next dispute lean on your record."],
];

/** The learning loop as four linked steps. */
export function LearnLoop() {
  return (
    <ol className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]" aria-label="The learning loop">
      {LOOP.map(([t, d], i) => (
        <Fragment key={t}>
          {i > 0 && (
            <li aria-hidden className="hidden items-center justify-center text-[16px] text-helper lg:flex">→</li>
          )}
          <li className="flex gap-2.5 rounded-xl bg-[#F4F8FF] p-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-[12px] font-semibold text-brand ring-1 ring-[#C9D7F5]" aria-hidden>{i + 1}</span>
            <span className="text-[13px] text-ink-soft"><b className="block text-[14px] font-semibold text-ink">{t}</b>{d}</span>
          </li>
        </Fragment>
      ))}
    </ol>
  );
}
