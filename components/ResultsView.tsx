"use client";
import { useState } from "react";
import { formatInr } from "@/lib/format";
import { useLedger, clearLedger } from "@/lib/ledger";
import { SAMPLE_COUNT, sampleRecords, summarize, weakestCode } from "@/lib/results";
import { ODDS_BY_CONFIDENCE } from "@/lib/results";
import type { Rates } from "@/lib/rates";

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

  return (
    <div className={ready ? "" : "opacity-60"} aria-busy={!ready}>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-line bg-white px-4 py-3 text-[14px]">
        <label className="flex min-h-10 cursor-pointer items-center gap-2">
          <input type="checkbox" checked={withSample} onChange={(e) => setWithSample(e.target.checked)} className="h-4 w-4 accent-[#2F63C8]" />
          Include {SAMPLE_COUNT} sample past disputes (made up)
        </label>
        <span className="text-helper">
          {youCount ? `Plus ${youCount} you acted on in this demo${m.pending ? `, ${m.pending} waiting for Won or Lost` : ""}.` : "Nothing recorded by you yet. Open a dispute, act on it, then mark Won or Lost."}
        </span>
        {youCount > 0 && (
          <button onClick={() => { clearLedger(); setCleared(true); }} className="ml-auto min-h-10 rounded-[10px] border border-[#D6D6D6] px-3.5 text-[13px] font-semibold">
            Clear what I recorded
          </button>
        )}
      </div>

      {m.settled === 0 ? (
        <p className="rounded-2xl border border-line bg-white p-6 text-[15px] text-ink-soft">
          No results yet. Turn on the sample history above, or act on a dispute and mark Won or Lost.
        </p>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-3 gap-2 md:gap-4">
            <Tile label="Recovered per ₹ disputed" value={pct(m.netRecovered)} note={`${formatInr(m.recoveredInr)} of ${formatInr(m.disputedInr)}`} />
            <Tile label="Won when fought" value={pct(m.winRate)} note={`${m.won} of ${m.fights} fights`} />
            <Tile label="Answered on time" value={pct(m.onTimeRate)} note={`${Math.round((m.onTimeRate ?? 0) * m.settled)} of ${m.settled}`} />
          </div>
          <p className="mb-5 text-[13px] text-helper">
            {formatInr(m.lostInr)} was lost or accepted. Recovered counts only the part you contested and won. Arbitration fees are not included in this demo.
          </p>

          <Section title="By reason" note="Where fights are won and lost.">
            <div className="overflow-hidden rounded-2xl border border-line bg-white">
              <ul>
                {m.byCode.map((r) => {
                  const rate = r.fights ? r.won / r.fights : null;
                  return (
                    <li key={r.code} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 border-b border-line px-4 py-3 last:border-0 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_96px]">
                      <div className="min-w-0">
                        <b className="text-[15px]">{r.code}</b> <span className="text-[14px] text-ink-soft">{reasonNames[r.code] ?? ""}</span>
                        <div className="text-[13px] text-helper">{r.disputes} {r.disputes === 1 ? "dispute" : "disputes"} · {r.fights} fought, {r.won} won</div>
                      </div>
                      <div className="order-3 col-span-2 md:order-none md:col-span-1" aria-hidden={rate === null}>
                        {rate !== null && (
                          <div className="h-2 overflow-hidden rounded-full bg-[#EDEDED]" role="img" aria-label={`Won ${pct(rate)} of fights`}>
                            <div className="h-full rounded-full bg-fight" style={{ width: `${Math.round(rate * 100)}%` }} />
                          </div>
                        )}
                      </div>
                      <div className="text-right text-[14px]"><b>{pct(rate)}</b><div className="text-[13px] text-helper">{formatInr(r.recoveredInr)} back</div></div>
                    </li>
                  );
                })}
              </ul>
            </div>
            {weakest && (
              <p className="mt-2 text-[14px]">
                <b>Weakest:</b> {weakest.code} {reasonNames[weakest.code] ?? ""}, won {weakest.won} of {weakest.fights} fights.
                {tips[weakest.code] && <> <span className="font-semibold text-green-ink">Fix: </span>{tips[weakest.code]}</>}
              </p>
            )}
          </Section>

          <Section title="Was the advisor right?" note="This is how the product would learn. The AI estimate is checked against what actually happened.">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-line bg-white p-4">
                <h3 className="mb-1 text-[15px] font-semibold">Fight calls, by confidence</h3>
                {m.byConfidence.length === 0 ? (
                  <p className="text-[14px] text-helper">No Fight calls with a result yet.</p>
                ) : (
                  <table className="w-full text-[14px]">
                    <thead className="text-left text-[13px] text-helper"><tr><th className="py-1 font-medium">Confidence</th><th className="py-1 font-medium">AI estimate</th><th className="py-1 font-medium">Actually won</th></tr></thead>
                    <tbody>
                      {m.byConfidence.map((r) => (
                        <tr key={r.confidence} className="border-t border-line">
                          <td className="py-1.5">{r.confidence}</td>
                          <td className="py-1.5">{Math.round(ODDS_BY_CONFIDENCE[r.confidence] * 100)}%</td>
                          <td className="py-1.5"><b>{r.won} of {r.n}</b> ({pct(r.won / r.n)})</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="rounded-2xl border border-line bg-white p-4 text-[14px]">
                <h3 className="mb-1 text-[15px] font-semibold">Other calls</h3>
                <ul className="space-y-1.5">
                  <li><b>Fold calls:</b> {m.foldCalls.n}. {m.foldCalls.wrong} would have won (you fought anyway).</li>
                  <li><b>Escalate calls:</b> {m.escalated.n}. {m.escalated.fought} fought later, {m.escalated.won} won.</li>
                  <li><b>Fight calls that won:</b> {m.fightCalls.won} of {m.fightCalls.n}.</li>
                </ul>
              </div>
            </div>
          </Section>

          <Section title="How the loop works">
            <ol className="list-decimal space-y-1 pl-5 text-[15px] text-ink-soft">
              <li>You act on a dispute and mark Won or Lost. It is added here.</li>
              <li>On the next dispute with the same reason, the check shows your own record next to the AI estimate.</li>
              <li>In the real product these results would also move the estimate and set the launch thresholds on the Evals page. In this prototype nothing is trained.</li>
            </ol>
          </Section>
        </>
      )}
    </div>
  );
}

function Tile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-3 md:p-[18px]">
      <div className="text-[12px] text-helper md:text-[13px]">{label}</div>
      <div className="text-xl font-semibold md:text-[26px]">{value}</div>
      <div className="text-[12px] text-helper md:text-[13px]">{note}</div>
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-[17px] font-semibold">{title}</h2>
      {note && <p className="mb-2 text-[13px] text-helper">{note}</p>}
      <div className={note ? "" : "mt-2"}>{children}</div>
    </section>
  );
}
