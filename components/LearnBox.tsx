"use client";
import { useState } from "react";
import { KIND_LABEL, smallSample, type LearnResult, type LearnStats } from "@/lib/assistCore";
import { readProfile } from "@/lib/useProfile";
import { Card } from "@/components/ui";

const btn = "min-h-11 rounded-[10px] px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50";

/**
 * "What to change next": the AI reads the counts on this page (never names, amounts or documents) and suggests one change.
 * Code checks that every number it quotes matches the counts. Nothing changes by itself.
 */
export function LearnBox({ stats, usesSample }: { stats: LearnStats; usesSample: boolean }) {
  const [running, setRunning] = useState(false);
  const [shown, setShown] = useState<{ r: LearnResult; sig: string } | null>(null);
  const [error, setError] = useState("");
  const sig = JSON.stringify(stats);
  const current = shown && shown.sig === sig ? shown.r : null; // a suggestion belongs to the counts it was made from

  const run = async () => {
    setRunning(true);
    setError("");
    try {
      const res = await fetch("/api/assist", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "learn", stats, policyText: readProfile().policy }) });
      const r = (await res.json()) as LearnResult;
      if (r.status === "live" || r.status === "saved") setShown({ r, sig });
      else setError(r.message);
    } catch {
      setError("That didn't work just now. Try again in a moment.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <section id="what-next" className="mb-6 scroll-mt-4" data-testid="learn-box">
      <h2 className="text-[16px] font-semibold">What to change next</h2>
      <p className="mb-2 text-[12px] text-helper">The advisor reads the counts above and suggests one change. It sees counts only: no names, amounts or documents.</p>
      <Card>
        {!current && (
          <>
            <p className="text-[14px] text-ink-soft">{usesSample ? "This uses the made-up sample history, so the suggestion is an example of how it would work with your own results." : "This uses the results you recorded in this demo."}</p>
            <button className={`${btn} mt-3 border border-brand bg-white text-brand`} onClick={run} disabled={running}>
              {running ? "Reading your results…" : "Suggest a change"}
            </button>
            {running && (
              <p className="mt-2 text-[12px] text-helper" data-testid="wait-note">
                Connecting to the AI model. On this demo it can take up to a minute. If it cannot answer, you will see a saved example.
              </p>
            )}
            {error && <p className="mt-2 text-[14px] text-escalate" role="alert">{error}</p>}
          </>
        )}
        {current && (current.status === "live" || current.status === "saved") && (
          <div data-testid="learn-result">
            <p className="text-[16px] font-semibold">{current.output.headline}</p>
            <p className="mt-1 text-[14px] text-ink-soft">{current.output.finding}</p>
            <div className="mt-3 rounded-xl bg-[#F4F8FF] p-3">
              <p className="text-[12px] font-semibold tracking-[.6px] text-helper uppercase">{KIND_LABEL[current.output.suggestion.kind]}</p>
              <p className="mt-0.5 text-[14px]">{current.output.suggestion.text}</p>
            </div>
            <p className="mt-2 text-[12px] text-helper">
              Based on {current.output.cites.map((c) => `${c.code}: won ${c.won} of ${c.fights}`).join("; ")}.{" "}
              {smallSample(current.output) ? "Small sample: treat it as a hint, not a rule. " : ""}
              {current.output.note && !smallSample(current.output) ? `${current.output.note} ` : ""}
            </p>
            <p className="mt-1 text-[12px] text-helper" data-testid="learn-source">
              {current.status === "live" ? `Suggested by AI (${current.model}, ${current.promptVersion})${current.cached ? ", from the cache" : ""}. Every number was checked against the counts.` : `${current.label}. ${current.message}`} Nothing in your terms changes unless you change it.
            </p>
            <button className={`${btn} mt-2 border border-[#D6D6D6] bg-white text-[#111]`} onClick={() => setShown(null)}>
              Ask again
            </button>
          </div>
        )}
      </Card>
    </section>
  );
}
