import { CallChip } from "@/components/CallChip";
import { RulesVsUnseen } from "@/components/RulesVsUnseen";
import { scoreRules, type KeyRow } from "@/lib/ruleScoreboard";
import labelsFileData from "@/data/labels.json";
import { THRESHOLDS, summarize, tier, type EvalRow, type Summary, type Tier } from "@/lib/eval";
import { claudeEarlyCall, evalLabels, loadLatestRun, savedV1Rows } from "@/lib/evalView";
import { getCases } from "@/lib/data";
import { toCall } from "@/lib/data";
import { PROMPT_VERSION } from "@/lib/prompt";
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
  const latest = loadLatestRun();
  const scored = (rows: EvalRow[]) => rows.filter((r) => r.label !== "shield");

  const checklistRows: EvalRow[] = labels.map((l) => ({
    id: l.id, caseType: l.case_type, label: toCall(l.decision), checklist: toCall(l.checklist_decision), raw: toCall(l.checklist_decision), final: toCall(l.checklist_decision),
    status: "live", decidingEvidence: [], labelEvidence: [], draftCited: null, unsupportedCitations: 0, rulesTriggered: [], flaggedInstruction: false, tokensIn: 0, tokensOut: 0, ms: 0, costUsd: 0,
  }));
  // Fair comparison: the checklist is scored on exactly the cases the agent was scored on.
  const only = (ids: Set<string>) => checklistRows.filter((r) => ids.has(r.id));
  const v1Ids = new Set(v1Rows.map((r) => r.id));
  const latestIds = new Set(latest?.rows.map((r) => r.id) ?? []);
  const checklistV1 = summarize(only(v1Ids));
  const checklistLatest = latest ? summarize(only(latestIds)) : null;
  const v1 = summarize(v1Rows);
  const newerIds = new Set(checklistRows.filter((r) => !v1Ids.has(r.id)).map((r) => r.id));
  const checklistNewer = scored(only(newerIds));
  const agreeCount = (rows: EvalRow[]) => scored(rows).filter((r) => r.final === r.label).length;
  const n = (rows: EvalRow[]) => scored(rows).length;
  const latestByCase = new Map(latest?.rows.map((r) => [r.id, r]));
  const latestName = latest?.run.prompt ?? PROMPT_VERSION;
  const rules = scoreRules(getCases(), (labelsFileData as { labels: KeyRow[] }).labels);

  const cols: { name: string; sub: string; s: Summary | null; n: number; agent: boolean }[] = [
    { name: "Fixed checklist", sub: `same ${n(v1Rows)} cases as agent v1`, s: checklistV1, n: n(only(v1Ids)), agent: false },
    { name: "Agent, prompt v1", sub: `saved, ChatGPT, ${n(v1Rows)} cases`, s: v1, n: n(v1Rows), agent: true },
    ...(latest
      ? [
          { name: `Agent, prompt ${latestName}`, sub: `${latest.run.model}, ${latest.run.date}, ${n(latest.rows)} cases`, s: latest.summary, n: n(latest.rows), agent: true },
        ]
      : []),
  ];

  const cell = (call: Call | null, label: Call, note?: string) =>
    call === null ? (
      <span className="text-helper">Not run</span>
    ) : (
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <CallChip call={call} short />
        {call !== label && (
          <span className="text-escalate" title="Differs from the human answer">
            <span aria-hidden>✗</span>
            <span className="sr-only">differs from the human answer</span>
          </span>
        )}
        {note && <span className="text-xs text-helper">{note}</span>}
      </span>
    );

  const c15 = labels.find((l) => l.id === "C15");

  return (
    <>
      <h1 className="mb-2 text-2xl leading-8 font-semibold">Evals</h1>
      <p className="mb-4 max-w-[760px] text-[15px] text-ink-soft">
        Does the agent make the same call as a person who knows Visa&apos;s rules, and does it beat a fixed checklist? Every score below is computed from the files in this repo.
      </p>

      <nav aria-label="On this page" className="mb-4 flex flex-wrap gap-2 text-[13px] font-semibold">
        {[["#c15", "The case that matters"], ["#cases", "Each case"], ["#rules", "Rules vs unseen cases"], ["#limits", "What the numbers do not show"]].map(([href, label]) => (
          <a key={href} href={href} className="rounded-full border border-line bg-white px-3 py-1.5 text-brand hover:border-brand">{label}</a>
        ))}
      </nav>

      <div className="mb-3 grid grid-cols-3 gap-2 md:gap-4">
        <Tile label="Agent v1 (saved)" value={`${agreeCount(v1Rows)} of ${n(v1Rows)}`} note="match the human answer" />
        <Tile label="Fixed checklist" value={`${agreeCount(only(v1Ids))} of ${n(only(v1Ids))}`} note="same cases, same answer key" />
        {latest ? (
          <Tile label={`Agent ${latestName} (automated)`} value={`${agreeCount(latest.rows)} of ${n(latest.rows)}`} note={`checklist on these: ${agreeCount(only(latestIds))} of ${n(only(latestIds))}`} />
        ) : (
          <Tile label={`Agent ${PROMPT_VERSION} (automated)`} value="Not run yet" note="needs the API key" muted />
        )}
      </div>
      <p className="mb-4 text-[13px] text-helper">
        The {newerIds.size} newer cases (C17 to C20: messy evidence and hidden instructions; C21 to C30: unseen test cases) have no saved agent run. The checklist gets {agreeCount(checklistNewer)} of {n(checklistNewer)} of them right.
        {!latest && <> Run <code className="rounded bg-white px-1 py-0.5 text-[12px]">npm run eval</code> to score the agent on all of them.</>}
      </p>

      {c15 && (
        <section className="mb-4 scroll-mt-4 rounded-2xl border border-brand bg-brand-soft p-[18px]" aria-labelledby="c15">
          <h2 id="c15" className="text-[17px] font-semibold">The case that matters most: C15</h2>
          <p className="mt-1 mb-3 max-w-[760px] text-[14px] text-[#333]">
            A group-tour dispute where the accepted policy meant only half was owed. A reviewer that only applied Visa&apos;s rules said Accept, which would have refunded USD 1,600 the merchant did not owe. The right call depends on the money and on a document the merchant has not sent: Escalate. (From the kill test, <code className="text-[12px]">eval/kill-test-v1.md</code>.)
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
            {[
              ["Human answer", toCall(c15.decision) as Call],
              ["Checklist", toCall(c15.checklist_decision) as Call],
              ["Agent v1", (v1Rows.find((r) => r.id === "C15")?.final ?? null) as Call | null],
              ...(latest ? [[`Agent ${latestName}`, (latestByCase.get("C15")?.final ?? null) as Call | null] as const] : []),
            ].map(([who, call]) => (
              <span key={who as string} className="inline-flex items-center gap-1.5">
                <span className="text-helper">{who}:</span>
                {cell(call as Call | null, toCall(c15.decision) as Call)}
              </span>
            ))}
          </div>
        </section>
      )}

      <div className="relative mb-4 overflow-x-auto rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(0,0,0,.03)]">
        <table className="w-full min-w-[640px] text-left text-[14px]">
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
              <tr key={t.key} className="border-b border-line align-top last:border-0">
                <th scope="row" className="px-4 py-3 font-medium">{t.label}</th>
                <td className="px-4 py-3 whitespace-nowrap text-ink-soft">
                  {[t.launch, t.target, t.stretch].map((x) => `${t.dir === "min" ? "≥" : "≤"}${Math.round(x * 100)}%`).join(" / ")}
                </td>
                {cols.map((c) => {
                  if (!c.agent && (t.key === "decidingEvidence" || t.key === "citationFirstTry")) return <td key={c.name} className="px-4 py-3 text-helper">Not measurable</td>;
                  const { text, v } = valueFor(t.key, c.s, c.n);
                  const tr = c.agent ? tier(t, v) : null; // the bars are the agent's targets, not the checklist's
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
              {cols.map((c) => (
                <td key={c.name} className="px-4 py-3 text-[13px] text-ink-soft">
                  {!c.agent || !c.s ? <span className="text-helper">n/a</span> : (
                    <>Unsupported citations: <b>{c.s.unsupportedCitations}</b><br />Fraud routed: <b>{pct(c.s.fraudRouted)}</b>{latest && c.name.includes(latestName) && <><br />Injection resisted: <b>{pct(c.s.injectionResisted)}</b></>}</>
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

      <h2 id="cases" className="mt-6 mb-2 scroll-mt-4 text-lg font-semibold">Case by case</h2>
      <div className="relative mb-2 overflow-x-auto rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(0,0,0,.03)]">
        <table className="w-full text-left text-[14px]">
          <caption className="sr-only">Each case: the human answer and what each method said. A cross means it differs from the human answer.</caption>
          <thead>
            <tr className="border-b border-line text-[13px] text-helper">
              <th scope="col" className="px-1 py-3 font-medium md:px-4">Case</th>
              <th scope="col" className="hidden px-4 py-3 font-medium md:table-cell">Type</th>
              <th scope="col" className="px-1 py-3 font-medium md:px-4"><span className="md:hidden">Human</span><span className="hidden md:inline">Human answer</span></th>
              <th scope="col" className="px-1 py-3 font-medium md:px-4">Checklist</th>
              <th scope="col" className="px-1 py-3 font-medium md:px-4">Agent v1<span className="hidden md:inline"> (saved)</span></th>
              <th scope="col" className="hidden px-4 py-3 font-medium md:table-cell">Early Claude run*</th>
              {latest && <th scope="col" className="px-1 py-3 font-medium md:px-4">Agent {latestName}</th>}
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
                  <th scope="row" className="px-1 py-2.5 font-medium md:px-4">{l.id}</th>
                  <td className="hidden px-4 py-2.5 text-ink-soft md:table-cell">{l.case_type}</td>
                  <td className="px-1 py-2.5 md:px-4"><CallChip call={label} short /></td>
                  <td className="px-1 py-2.5 md:px-4">{l.checklist_decision === "n/a" ? <span className="text-helper">n/a</span> : cell(toCall(l.checklist_decision) as Call, label)}</td>
                  <td className="px-1 py-2.5 md:px-4">{cell(v1r ? (v1r.final as Call) : null, label)}</td>
                  <td className="hidden px-4 py-2.5 md:table-cell">{cell(claudeEarlyCall(l.id) as Call | null, label)}</td>
                  {latest && <td className="px-1 py-2.5 md:px-4">{cell((lr?.final ?? null) as Call | null, label, lr && lr.raw !== lr.final ? `model said ${lr.raw}` : undefined)}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mb-6 max-w-[760px] text-[13px] text-helper">
        A cross means it differs from the human answer. &quot;Not run&quot;: C17 to C30 have no saved agent run{latest ? "" : `, and the ${PROMPT_VERSION} agent has not been run yet (needs the API key)`}. *The early Claude run came from a chat that knew the test design, so it is kept for comparison only.
      </p>

      <RulesVsUnseen s={rules} agentKnown={{ agree: agreeCount(v1Rows), n: n(v1Rows) }} />

      <h2 id="limits" className="mb-2 scroll-mt-4 text-lg font-semibold">What these numbers do not show</h2>
      <ul className="mb-6 max-w-[760px] list-disc space-y-1.5 pl-5 text-[15px] text-ink-soft">
        <li>The answer key was written by the builder from Visa&apos;s rules. A second AI flagged disagreements, but the builder decided them.</li>
        <li>The {labels.length} cases are short and written for this test. Real disputes are messier. C17 to C20 are the first attempt at messy and tricked cases. C21 to C30 were drafted by the builder&apos;s AI assistant for the unseen-rules test, and their answers are proposed, not yet confirmed.</li>
        <li>The v1 results came from a different prompt and model, by hand. They are kept as the clean baseline, not as the product&apos;s score.</li>
        <li>The checklist only sees which document types are attached, never what they say. It cannot answer Escalate. Its answers come from code (<code>lib/baseline.ts</code>, one fixed rule per reason code), and a test checks that the code reproduces every answer shown here, so it was not hand-picked to lose.</li>
        <li>The builder chose which cases are &quot;checklist-friendly&quot; and which &quot;need judgment&quot;. On the checklist-friendly cases the checklist ties a person, as it should. The agent has to earn its place on the others, and a smarter fixed rule (for example one that reads dates) might close part of that gap.</li>
        <li>&quot;Finds the deciding evidence&quot; counts how many of the human answer&apos;s document numbers the agent named. The kill test&apos;s 15 of 15 was judged by reading, so this is stricter.</li>
        <li>Nothing here is a real win rate. It shows the agent applies the rules to written evidence and knows when to stop.</li>
      </ul>
    </>
  );
}

function Tile({ label, value, note, muted }: { label: string; value: string; note: string; muted?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,.03)] md:p-[22px]">
      <span className="block text-[12px] leading-4 text-helper md:text-[13px]">{label}</span>
      <b className={`block text-xl font-semibold md:text-[26px] ${muted ? "text-helper" : ""}`}>{value}</b>
      <span className="mt-0.5 block text-[11px] leading-4 text-ink-soft md:text-[13px]">{note}</span>
    </div>
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
