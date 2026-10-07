"use client";
import { useState } from "react";
import { formatInr } from "@/lib/format";
import { useLedger, clearLedger } from "@/lib/ledger";
import { SAMPLE_COUNT, sampleRecords, summarize, weakestCode } from "@/lib/results";
import { ODDS_BY_CONFIDENCE } from "@/lib/results";
import type { Rates } from "@/lib/rates";
import { Card, Section, Stat } from "@/components/ui";
import { LearnBox } from "@/components/LearnBox";
import { compactStats } from "@/lib/assistCore";

const pct = (n: number | null) => (n === null ? "n/a" : `${Math.round(n * 100)}%`);

export function ResultsView({ rates, tips, reasonNames }: { rates: Rates; tips: Record<string, string>; reasonNames: Record<string, string> }) {
  const { recs: mine, ready } = useLedger();
  const [withSample, setWithSample] = useState(true);
  const [cleared, setCleared] = useState(false);
  const youList = cleared ? [] : mine;
  const all = [...(withSample ? sampleRecords(rates) : []), ...youList];
  const m = summarize(all);
  const youCount = youList.length;
  const weakest = weakestCode(m.byCode);
  const high = m.byConfidence.find((r) => r.confidence === "High") ?? null;

  return (
    <div className={ready ? "" : "opacity-60"} aria-busy={!ready}>
      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-ink-soft">
        <label className="flex min-h-10 cursor-pointer items-center gap-2 text-ink">
          <input type="checkbox" checked={withSample} onChange={(e) => setWithSample(e.target.checked)} className="h-4 w-4 accent-[#2F63C8]" />
          Include {SAMPLE_COUNT} sample past disputes (made up)
        </label>
        <span>
          {youCount ? `Plus ${youCount} you acted on in this demo${m.pending ? `, ${m.pending} waiting for Won or Lost` : ""}.` : "Nothing recorded by you yet."}
        </span>
        {youCount > 0 && (
          <button onClick={() => { clearLedger(); setCleared(true); }} className="ml-auto min-h-10 rounded-[10px] border border-[#D6D6D6] bg-white px-3.5 text-[14px] font-semibold text-ink">
            Clear what I recorded
          </button>
        )}
      </div>

      {m.settled === 0 ? (
        <Card>
          <p className="text-[14px] text-ink-soft">No results yet. Turn on the sample history above, or open a dispute, act on it, then mark Won or Lost.</p>
        </Card>
      ) : (
        <>
          <Card className="mb-6 !p-0">
            <p id="results-headline" className="border-b border-line px-4 py-4 text-[16px] font-semibold md:px-5">
              {high ? <>When the advisor said Fight with high confidence, you won {high.won} of {high.n}.</> : <>You won {m.won} of {m.fights} fights.</>}
            </p>
            <div className="grid grid-cols-3 divide-x divide-line">
              <Stat label="Recovered per ₹ disputed" value={pct(m.netRecovered)} note={`${formatInr(m.recoveredInr)} of ${formatInr(m.disputedInr)}`} />
              <Stat label="Won when fought" value={pct(m.winRate)} note={`${m.won} of ${m.fights} fights`} />
              <Stat label="Answered on time" value={pct(m.onTimeRate)} note={`${Math.round((m.onTimeRate ?? 0) * m.settled)} of ${m.settled}`} />
            </div>
            <p className="border-t border-line px-4 py-3 text-[12px] text-helper md:px-5">
              {formatInr(m.lostInr)} was lost or accepted. Recovered counts only the part you contested and won. Arbitration fees are not included in this demo.
            </p>
          </Card>

          <Section id="advisor-right" title="Was the advisor right?" note="The AI estimate is checked against what actually happened.">
            <Card className="!p-0">
              <ul className="md:hidden">
                {[
                  ...m.byConfidence.map((r) => ({ k: r.confidence, title: `Fight, ${r.confidence.toLowerCase()} confidence`, sub: `${r.n} cases · AI estimate ${Math.round(ODDS_BY_CONFIDENCE[r.confidence] * 100)}%`, what: `Won ${r.won} of ${r.n} (${pct(r.won / r.n)})` })),
                  { k: "fold", title: "Fold", sub: `${m.foldCalls.n} cases`, what: `${m.foldCalls.wrong} would have won (you fought anyway)` },
                  { k: "esc", title: "Escalate", sub: `${m.escalated.n} cases`, what: `${m.escalated.fought} fought later, ${m.escalated.won} won` },
                ].map((r) => (
                  <li key={r.k} className="border-b border-line px-4 py-3 last:border-0">
                    <div className="flex items-baseline justify-between gap-3"><b className="font-semibold">{r.title}</b><span className="text-[12px] text-helper">{r.sub}</span></div>
                    <div className="text-[14px]">{r.what}</div>
                  </li>
                ))}
              </ul>
              <div className="hidden md:block">
                <table className="w-full text-[14px]">
                  <thead className="text-left text-[12px] text-helper">
                    <tr className="border-b border-line">
                      <th className="px-4 py-2.5 font-normal md:px-5">The advisor said</th>
                      <th className="px-2 py-2.5 font-normal">Cases</th>
                      <th className="px-2 py-2.5 font-normal">AI estimate</th>
                      <th className="px-4 py-2.5 font-normal md:px-5">What happened</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.byConfidence.map((r) => (
                      <tr key={r.confidence} className="border-b border-line last:border-0">
                        <td className="px-4 py-3 font-semibold md:px-5">Fight, {r.confidence.toLowerCase()} confidence</td>
                        <td className="px-2 py-3">{r.n}</td>
                        <td className="px-2 py-3">{Math.round(ODDS_BY_CONFIDENCE[r.confidence] * 100)}%</td>
                        <td className="px-4 py-3 md:px-5">Won <b className="font-semibold">{r.won} of {r.n}</b> ({pct(r.won / r.n)})</td>
                      </tr>
                    ))}
                    <tr className="border-b border-line">
                      <td className="px-4 py-3 font-semibold md:px-5">Fold</td>
                      <td className="px-2 py-3">{m.foldCalls.n}</td>
                      <td className="px-2 py-3 text-helper">n/a</td>
                      <td className="px-4 py-3 md:px-5">{m.foldCalls.wrong} would have won (you fought anyway)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold md:px-5">Escalate</td>
                      <td className="px-2 py-3">{m.escalated.n}</td>
                      <td className="px-2 py-3 text-helper">n/a</td>
                      <td className="px-4 py-3 md:px-5">{m.escalated.fought} fought later, {m.escalated.won} won</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </Section>

          <Section title="By reason" note="Where fights are won and lost.">
            <Card className="!p-0">
              <ul>
                {m.byCode.map((r) => {
                  const rate = r.fights ? r.won / r.fights : null;
                  return (
                    <li key={r.code} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 border-b border-line px-4 py-3 last:border-0 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_96px] md:px-5">
                      <div className="min-w-0">
                        <b className="font-semibold">{r.code}</b> <span className="text-[14px]">{reasonNames[r.code] ?? ""}</span>
                        <div className="text-[12px] text-helper">{r.disputes} {r.disputes === 1 ? "dispute" : "disputes"} · {r.fights} fought, {r.won} won</div>
                      </div>
                      <div className="order-3 col-span-2 md:order-none md:col-span-1" aria-hidden={rate === null}>
                        {rate !== null && (
                          <div className="h-2 overflow-hidden rounded-full bg-[#EDEDED]" role="img" aria-label={`Won ${pct(rate)} of fights`}>
                            <div className={`h-full rounded-full ${rate >= 0.7 ? "bg-fight" : "bg-fold"}`} style={{ width: `${Math.round(rate * 100)}%` }} />
                          </div>
                        )}
                      </div>
                      <div className="text-right text-[14px]"><b className="font-semibold">{pct(rate)}</b><div className="text-[12px] text-helper">{formatInr(r.recoveredInr)} back</div></div>
                    </li>
                  );
                })}
              </ul>
              {weakest && (
                <p className="border-t border-line bg-[#FAFAFA] px-4 py-3 text-[14px] md:px-5">
                  <b className="font-semibold">Weakest:</b> {weakest.code} {reasonNames[weakest.code] ?? ""}, won {weakest.won} of {weakest.fights} fights.
                  {tips[weakest.code] && <> <b className="font-semibold text-green-ink">Fix:</b> {tips[weakest.code]}</>}
                </p>
              )}
            </Card>
          </Section>

          <LearnBox stats={compactStats(m)} usesSample={withSample && youCount === 0} />

          <details className="mb-6 rounded-2xl border border-line bg-white px-4 py-1 md:px-5">
            <summary className="min-h-10 cursor-pointer py-2.5 text-[14px] font-semibold">How the loop works</summary>
            <ol className="mb-3 list-decimal space-y-1 pl-5 text-[14px] text-ink-soft">
              <li>You act on a dispute and mark Won or Lost. It is added here.</li>
              <li>On the next dispute with the same reason, the check shows your own record next to the AI estimate.</li>
              <li>In the real product these results would also move the estimate and set the launch thresholds on the Evals page. In this prototype nothing is trained.</li>
            </ol>
          </details>
        </>
      )}
    </div>
  );
}
