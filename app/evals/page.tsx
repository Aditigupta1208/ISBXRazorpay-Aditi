import { CallChip } from "@/components/CallChip";
import { THRESHOLDS, summarize, tier, type EvalRow, type Summary, type Tier } from "@/lib/eval";
import { claudeEarlyCall, evalLabels, loadLatestRun, savedV1Rows } from "@/lib/evalView";
import { toCall } from "@/lib/data";
import type { Call } from "@/lib/types";

export const metadata = { title: "Evals | Dispute Advisor (concept prototype)" };
export const dynamic = "force-dynamic";

const pct = (v: number | null) => (v === null ? "n/a" : `${Math.round(v * 100)}%`);
const TIER_TEXT: Record<Tier, string> = { below: "Below launch bar", launch: "Meets launch", target: "Meets target", stretch: "Meets stretch" };
const TIER_CLS: Record<Tier, string> = { below: "bg-escalate-soft text-escalate", launch: "bg-fold-soft text-fold", target: "bg-fight-soft text-fight", stretch: "bg-fight-soft text-fight" };

function valueFor(key: (typeof THRESHOLDS)[number]["key"], s: Summary | null, scored: number): { text: string; v: number | null } {
  if (!s) return { text: "n/a", v: null };
  const v = s[key] as number | null;
  if (key === "wrongFoldRate") return { text: `${s.wrongFold} of ${scored}`, v };
  if (key === "wrongFightRate") return { text: `${s.wrongFight} of ${scored}`, v };
  return { text: pct(v), v };
}

export default function EvalsPage() {
  const labels = evalLabels();
  const v1Rows = savedV1Rows();
  const v1 = summarize(v1Rows);
  const checklistRows: EvalRow[] = labels.map((l) => ({
    id: l.id, caseType: l.case_type, label: toCall(l.decision), checklist: toCall(l.checklist_decision), raw: toCall(l.checklist_decision), final: toCall(l.checklist_decision),
    status: "live", decidingEvidence: [], labelEvidence: [], draftCited: null, unsupportedCitations: 0, rulesTriggered: [], flaggedInstruction: false, tokensIn: 0, tokensOut: 0, ms: 0, costUsd: 0,
  }));
  const checklist = summarize(checklistRows);
  const latest = loadLatestRun();
  const scoredCount = (rows: EvalRow[]) => rows.filter((r) => r.label !== "shield").length;
  const latestByCase = new Map(latest?.rows.map((r) => [r.id, r]));

  const cols: { name: string; sub: string; s: Summary | null; n: number }[] = [
    { name: "Fixed checklist", sub: `${scoredCount(checklistRows)} cases`, s: checklist, n: scoredCount(checklistRows) },
    { name: "Agent, prompt v1", sub: `saved, ChatGPT, ${scoredCount(v1Rows)} cases`, s: v1, n: scoredCount(v1Rows) },
    { name: "Agent, prompt v2.1", sub: latest ? `${latest.run.model}, ${latest.run.date}` : "No automated run yet", s: latest?.summary ?? null, n: latest ? scoredCount(latest.rows) : 0 },
  ];

  const cell = (l: string, call: Call | null, label: Call, note?: string) =>
    call === null ? (
      <span className="text-helper">Not run</span>
    ) : (
      <span className="inline-flex items-center gap-1.5">
        <CallChip call={call} />
        {call !== label && (
          <span className="text-escalate" title="Differs from the human answer">
            <span aria-hidden>✗</span>
            <span className="sr-only">differs from the human answer</span>
          </span>
        )}
        {note && <span className="text-xs text-helper">{note}</span>}
      </span>
    );

  return (
    <>
      <h1 className="mb-2 text-2xl leading-8 font-semibold">Evals</h1>
      <p className="mb-4 max-w-[760px] text-[15px] text-ink-soft">
        Does the agent make the same call as a person who knows Visa&apos;s rules, and does it beat a fixed checklist? Every number below is computed from the files in this repo. Nothing is typed in by hand.
      </p>

      {!latest && (
        <div className="mb-4 rounded-2xl border border-line bg-brand-soft p-[18px] text-[15px]">
          <b>No automated v2.1 run yet.</b> The automated run needs the Claude API key. Until then, the numbers for the agent come from the saved v1 run done by hand in ChatGPT. Run <code className="rounded bg-white px-1.5 py-0.5 text-[13px]">npm run eval</code> to add the v2.1 column.
        </div>
      )}

      <div className="relative mb-4 overflow-x-auto rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(0,0,0,.03)]">
        <table className="w-full min-w-[820px] text-left text-[14px]">
          <caption className="sr-only">Results against the PRD bars</caption>
          <thead>
            <tr className="border-b border-line text-[13px] text-helper">
              <th scope="col" className="px-4 py-3 font-medium">Measure</th>
              <th scope="col" className="px-4 py-3 font-medium">Launch / target / stretch</th>
              {cols.map((c) => (
                <th key={c.name} scope="col" className="px-4 py-3 font-medium">
                  <span className="block text-ink">{c.name}</span>
                  <span className="block font-normal">{c.sub}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {THRESHOLDS.map((t) => (
              <tr key={t.key} className="border-b border-line last:border-0 align-top">
                <th scope="row" className="px-4 py-3 font-medium">{t.label}</th>
                <td className="px-4 py-3 whitespace-nowrap text-ink-soft">
                  {[t.launch, t.target, t.stretch].map((x) => `${t.dir === "min" ? "≥" : "≤"}${Math.round(x * 100)}%`).join(" / ")}
                </td>
                {cols.map((c, i) => {
                  const unavailable = (i === 0 && (t.key === "decidingEvidence" || t.key === "citationFirstTry")) || !c.s;
                  if (unavailable) return <td key={c.name} className="px-4 py-3 text-helper">{c.s ? "Not measurable" : "n/a"}</td>;
                  const { text, v } = valueFor(t.key, c.s, c.n);
                  const tr = tier(t, v);
                  return (
                    <td key={c.name} className="px-4 py-3">
                      <b className="text-[15px]">{text}</b>
                      {t.key.startsWith("wrong") && <span className="ml-1 text-helper">({pct(v)})</span>}
                      {tr && <span className={`mt-1 block w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${TIER_CLS[tr]}`}>{TIER_TEXT[tr]}</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="align-top">
              <th scope="row" className="px-4 py-3 font-medium">Other bars</th>
              <td className="px-4 py-3 text-ink-soft">Unsupported claims 0, fraud routed 100%</td>
              {cols.map((c, i) => (
                <td key={c.name} className="px-4 py-3 text-[13px] text-ink-soft">
                  {i === 0 || !c.s ? <span className="text-helper">n/a</span> : (
                    <>Unsupported citations: <b>{c.s.unsupportedCitations}</b><br />Fraud routed: <b>{pct(c.s.fraudRouted)}</b>{latest && i === 2 && <><br />Injection resisted: <b>{pct(c.s.injectionResisted)}</b></>}</>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {latest && (
        <div className="mb-4 grid gap-4 md:grid-cols-3">
          <Card label="Safety rules changed the call" value={`${latest.summary.downgrades} cases`} note={`Model alone: ${pct(latest.summary.rawAgreement)}. After the rules: ${pct(latest.summary.agreement)}.`} />
          <Card label="Average cost per check" value={latest.summary.avgCostUsd === null ? "n/a" : `USD ${latest.summary.avgCostUsd.toFixed(3)}`} note="Token prices as of the date in lib/pricing.ts." />
          <Card label="Average time per check" value={latest.summary.avgMs === null ? "n/a" : `${(latest.summary.avgMs / 1000).toFixed(1)} s`} note={`${latest.summary.failed} of ${latest.summary.cases} had no usable answer.`} />
        </div>
      )}

      <h2 className="mt-6 mb-2 text-lg font-semibold">Case by case</h2>
      <div className="relative mb-3 overflow-x-auto rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(0,0,0,.03)]">
        <table className="w-full min-w-[900px] text-left text-[14px]">
          <caption className="sr-only">Each case: the human answer and what each method said. A cross means it differs from the human answer.</caption>
          <thead>
            <tr className="border-b border-line text-[13px] text-helper">
              {["Case", "Type", "Human answer", "Checklist", "Agent v1 (saved)", "Claude early run (saved)", "Agent v2.1"].map((h) => (
                <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {labels.map((l) => {
              const label = toCall(l.decision) as Call;
              const v1r = v1Rows.find((r) => r.id === l.id);
              const lr = latestByCase.get(l.id);
              const hi = l.id === "C15";
              return (
                <tr key={l.id} className={`border-b border-line last:border-0 ${hi ? "bg-brand-soft" : ""}`}>
                  <th scope="row" className="px-4 py-2.5 font-medium">{l.id}</th>
                  <td className="px-4 py-2.5 text-ink-soft">{l.case_type}</td>
                  <td className="px-4 py-2.5"><CallChip call={label} /></td>
                  <td className="px-4 py-2.5">{l.checklist_decision === "n/a" ? <span className="text-helper">n/a</span> : cell("checklist", toCall(l.checklist_decision) as Call, label)}</td>
                  <td className="px-4 py-2.5">{cell("v1", v1r ? (v1r.final as Call) : null, label)}</td>
                  <td className="px-4 py-2.5">{cell("early", claudeEarlyCall(l.id) as Call | null, label)}</td>
                  <td className="px-4 py-2.5">{latest ? cell("v2.1", (lr?.final ?? null) as Call | null, label, lr && lr.raw !== lr.final ? `model said ${lr.raw}` : undefined) : <span className="text-helper">No automated run yet</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mb-6 text-[13px] text-helper">
        C15 is highlighted because it is the case that matters most: USD 3,200 at stake, but the accepted policy means only half is owed. A rules-only reviewer said Accept and the checklist says Fight. The human answer is Escalate, because the right call depends on the money and on a document the merchant has not sent.
      </p>

      <h2 className="mb-2 text-lg font-semibold">What these numbers do not show</h2>
      <ul className="mb-6 max-w-[760px] list-disc space-y-1.5 pl-5 text-[15px] text-ink-soft">
        <li>The answer key was written by the builder from Visa&apos;s rules. A second AI flagged disagreements, but the builder decided them.</li>
        <li>The 20 cases are short and written for this test. Real disputes are messier. C17 to C20 are the first attempt at messy and tricked cases.</li>
        <li>The v1 results came from a different prompt and model, by hand. They are kept as the clean baseline, not as the product&apos;s score.</li>
        <li>The checklist only sees which document types are attached, never what they say. It cannot answer Escalate.</li>
        <li>"Finds the deciding evidence" counts how many of the human answer's document numbers the agent named. The kill test's 15 of 15 was judged by reading, so this is stricter.</li>
        <li>Nothing here is a real win rate. It shows the agent applies the rules to written evidence and knows when to stop.</li>
      </ul>
    </>
  );
}

function Card({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-[22px] shadow-[0_1px_2px_rgba(0,0,0,.03)]">
      <span className="block text-[13px] text-helper">{label}</span>
      <b className="text-[26px] font-semibold">{value}</b>
      <span className="mt-1 block text-[13px] text-ink-soft">{note}</span>
    </div>
  );
}
