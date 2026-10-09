"use client";
import { useEffect, useRef, useState } from "react";
import type { RebuttalResult } from "@/lib/rebuttal";
import { VERDICT_LABEL, applyFix, sameDraft, type RebuttalView, type Verdict } from "@/lib/rebuttalCore";
import { TOUR_BANK_EVENT } from "@/lib/tourSteps";
import { readProfile } from "@/lib/useProfile";

const btn = "min-h-11 rounded-[10px] px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50";
const ghost = `${btn} border border-[#D6D6D6] bg-white text-[#111]`;
const ghostBrand = `${btn} border border-brand bg-white text-brand`;

const VERDICT_CHIP: Record<Verdict, string> = {
  holds_up: "bg-fight-soft text-fight",
  weak_spot: "bg-fold-soft text-fold",
  likely_to_lose: "bg-danger-soft text-danger",
};
const VERDICT_LINE: Record<Verdict, string> = {
  holds_up: "A reviewer would probably accept this.",
  weak_spot: "One gap a reviewer could use against you.",
  likely_to_lose: "The documents don't meet the rule, so better wording won't fix this.",
};
const VERDICT_BAND: Record<Verdict, string> = {
  holds_up: "border-fight/30 bg-fight-soft",
  weak_spot: "border-fold/30 bg-fold-soft",
  likely_to_lose: "border-danger/30 bg-danger-soft",
};
const VERDICT_ICON: Record<Verdict, string> = { holds_up: "✓", weak_spot: "!", likely_to_lose: "✕" };
const VERDICT_ICON_BG: Record<Verdict, string> = { holds_up: "bg-fight", weak_spot: "bg-fold", likely_to_lose: "bg-danger" };
const LABEL = "text-[12px] font-semibold tracking-[.6px] text-helper uppercase";
const CHECK_ICON = { pass: "✓", changed: "↻", na: "–" } as const;
const CHECK_CLS = { pass: "text-green-ink", changed: "text-fold", na: "text-helper" } as const;

/**
 * Bank's rebuttal: a practice run where a second AI pass plays the cardholder's bank and attacks the draft.
 * It never changes the call and never edits the draft by itself. Every step is a click.
 */
export function RebuttalPanel({
  caseId,
  added,
  draft,
  result,
  onResult,
  onApply,
  onAddDocument,
  onFocusEvidence,
  onLog,
}: {
  caseId: string;
  added: { title: string; content: string }[];
  draft: string;
  result: RebuttalView | undefined;
  onResult: (v: RebuttalView) => void;
  onApply: (newDraft: string) => void;
  onAddDocument: () => void;
  onFocusEvidence: (ids: string[]) => void;
  onLog: (text: string) => void;
}) {
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState<{ kind: "info" | "error"; text: string } | null>(null);
  const hasDraft = draft.trim().length > 0;
  const stale = !!result && !sameDraft(draft, result.forDraft);
  const rewrite = result ? applyFix(draft, result) : null;
  const changedChecks = result?.checks.filter((c) => c.status === "changed").length ?? 0;

  const run = async (demo = false) => {
    const profile = readProfile();
    if (!profile.enabled && !demo) {
      setNotice({ kind: "info", text: "Dispute Advisor is off in Agent setup. Turn it on to test your response." });
      return;
    }
    setRunning(true);
    setNotice(null);
    try {
      const res = await fetch("/api/rebuttal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          caseId,
          added,
          draft,
          demo: demo || undefined,
          policy: profile.policy.trim() ? { text: profile.policy, acceptance: profile.acceptance } : undefined,
        }),
      });
      const r = (await res.json()) as RebuttalResult;
      if (r.status === "live" || r.status === "saved") {
        onResult(r.view);
        onLog(`Tested the response against a bank reviewer: ${VERDICT_LABEL[r.view.verdict]}${r.status === "saved" ? " (saved example)" : ""}`);
      } else {
        setNotice({ kind: "error", text: r.message });
      }
    } catch {
      setNotice({ kind: "error", text: "We couldn't run the test. Check the response against the documents yourself." });
    } finally {
      setRunning(false);
    }
  };

  // The guided tour asks for the saved example so the reviewer sees a result. It never calls the model.
  const runRef = useRef(run);
  runRef.current = run;
  const hasResult = useRef(false);
  hasResult.current = !!result;
  useEffect(() => {
    const onTour = () => {
      if (!hasResult.current) void runRef.current(true);
    };
    window.addEventListener(TOUR_BANK_EVENT, onTour);
    return () => window.removeEventListener(TOUR_BANK_EVENT, onTour);
  }, []);

  return (
    <div id="rebuttal" data-testid="rebuttal" className="mt-6 scroll-mt-4 overflow-hidden rounded-2xl border border-[#C9D7F5] bg-white">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 bg-gradient-to-br from-[#EEF3FF] to-[#F7F9FF] px-4 py-4 md:px-5">
        <div className="flex min-w-0 flex-1 basis-72 gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-white" aria-hidden>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10 12 4l9 6" /><path d="M5 10v7M10 10v7M14 10v7M19 10v7" /><path d="M3 20h18" /></svg>
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[16px] font-semibold">Test it on the bank first</h3>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-[12px] font-semibold text-[#2B5BC8] ring-1 ring-[#C9D7F5]">Practice run</span>
            </div>
            <p className="mt-0.5 text-[13px] text-ink-soft">
              A practice run, not a real bank decision. A second AI pass reads your response like the cardholder&apos;s bank and tells you where it is weakest. It never changes your call or edits your draft.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {!hasDraft && <span className="text-[13px] text-helper">Write a response first.</span>}
          <button className={`${btn} bg-brand text-white`} onClick={() => run()} disabled={running || !hasDraft} data-testid="rebuttal-run">
            {running ? "Testing…" : result ? "Test again" : "Test this response"}
          </button>
        </div>
      </div>

      <div className="px-4 pb-4 md:px-5">
        {!result && !running && (
          <ol className="mt-4 grid gap-2.5 text-[13px] sm:grid-cols-3" aria-label="How the practice run works">
            {[
              ["1", "The bank reads it", "Your response and your documents, as a reviewer would."],
              ["2", "It finds the weak point", "The strongest objection and the sentence that invites it."],
              ["3", "You fix it, or not", "Use the rewrite with one click. Nothing changes until you do."],
            ].map(([n, t, d]) => (
              <li key={n} className="flex gap-2.5 rounded-xl bg-[#F7F8FA] p-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-[12px] font-semibold text-brand ring-1 ring-[#C9D7F5]" aria-hidden>{n}</span>
                <span><b className="block text-[14px] font-semibold">{t}</b><span className="text-helper">{d}</span></span>
              </li>
            ))}
          </ol>
        )}

        {running && (
          <div className="mt-4 rounded-xl bg-[#F4F8FF] p-3.5" role="status" aria-live="polite">
            <p className="text-[14px] font-semibold text-brand">Reading it as the bank would…</p>
            <p className="mt-0.5 text-[13px] text-helper" data-testid="wait-note">Connecting to the AI model. On this demo it can take up to a minute. If it cannot answer, you will see the saved result.</p>
          </div>
        )}

        {notice && (
          <p className={`mt-3 rounded-[10px] px-3 py-2 text-[14px] ${notice.kind === "error" ? "bg-danger-soft text-danger" : "bg-[#F4F8FF] text-[#2B5BC8]"}`} role="status">
            {notice.text}
          </p>
        )}

        {result && (
          <div className={`mt-4 ${stale ? "opacity-70" : ""}`} data-testid="rebuttal-result" aria-label="The bank reviewer's pushback">
            {stale && (
              <p className="mb-3 rounded-[10px] bg-fold-soft px-3 py-2 text-[14px] font-semibold text-fold" data-testid="rebuttal-stale">
                You changed the response after this test. Test again to check the new version.
              </p>
            )}

            <div data-tour="bank-body">
              <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${VERDICT_BAND[result.verdict]}`}>
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[15px] font-bold text-white ${VERDICT_ICON_BG[result.verdict]}`} aria-hidden>{VERDICT_ICON[result.verdict]}</span>
                <div className="min-w-0">
                  <span className={`inline-block rounded-full bg-white px-3 py-0.5 text-[12px] font-semibold ${VERDICT_CHIP[result.verdict].split(" ")[1]}`} data-testid="rebuttal-verdict">
                    {VERDICT_LABEL[result.verdict]}
                  </span>
                  <p className="mt-0.5 text-[14px]">{VERDICT_LINE[result.verdict]}</p>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-line bg-[#F7F8FA] p-4">
                <p className={LABEL}>{result.verdict === "holds_up" ? "What a reviewer might still ask" : "The bank's strongest objection"}</p>
                <p className="mt-1 text-[14px] leading-6">
                  {result.objection}
                  {result.evidenceIds.map((id) => (
                    <button
                      key={id}
                      onClick={() => onFocusEvidence([id])}
                      className="relative ml-1.5 inline-flex min-h-8 min-w-8 items-center justify-center rounded-md bg-brand-soft px-1.5 text-[12px] font-semibold text-[#2B5BC8] after:absolute after:-inset-1 after:content-['']"
                      aria-label={`Show ${id}`}
                    >
                      {id}
                    </button>
                  ))}
                </p>
              </div>

              {(result.weakSentence || result.fix?.kind === "reword") && (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {result.weakSentence && (
                    <div className="rounded-xl border border-fold/30 bg-white p-4" data-testid="rebuttal-weak">
                      <p className={LABEL}><span className="mr-1.5 rounded bg-fold-soft px-1.5 py-0.5 text-fold normal-case">Before</span>Weakest sentence in your response</p>
                      <blockquote className="mt-2 border-l-4 border-fold pl-3 text-[14px] leading-6">{result.weakSentence}</blockquote>
                      {result.whyWeak && <p className="mt-2 text-[13px] text-helper">{result.whyWeak}</p>}
                    </div>
                  )}
                  {result.fix?.kind === "reword" && (
                    <div className="rounded-xl border border-fight/30 bg-white p-4" data-testid="rebuttal-fix">
                      <p className={LABEL}><span className="mr-1.5 rounded bg-fight-soft px-1.5 py-0.5 text-fight normal-case">After</span>Suggested rewrite</p>
                      <p className="mt-2 text-[14px] leading-6">{result.fix.sentence}</p>
                      <p className="mt-2 text-[13px] text-helper">Built from your documents. Check every fact before you use it.</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2.5">
                        <button
                          className={`${btn} bg-brand text-white`}
                          disabled={!rewrite}
                          data-testid="rebuttal-apply"
                          onClick={() => {
                            if (!rewrite) return;
                            onApply(rewrite);
                            onLog("Used the suggested rewrite from the practice run");
                          }}
                        >
                          Use this rewrite
                        </button>
                        {!rewrite && <span className="text-[13px] text-helper">Test again to get a rewrite for the current draft.</span>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {result.fix?.kind === "add_document" && (
                <div className="mt-3 rounded-xl border border-brand/30 bg-white p-4" data-testid="rebuttal-fix">
                  <p className={LABEL}>A document that would answer it</p>
                  <p className="mt-2 text-[14px] leading-6">{result.fix.document}</p>
                  <div className="mt-3">
                    <button className={ghostBrand} onClick={onAddDocument}>
                      Add the document
                    </button>
                  </div>
                </div>
              )}
            </div>

            <details className="mt-3" data-testid="rebuttal-checks">
              <summary className="flex min-h-11 cursor-pointer items-center text-[14px] font-semibold text-brand">
                Safety checks on this answer{changedChecks > 0 && <span className="ml-2 text-fold">{changedChecks} changed</span>}
              </summary>
              <ul className="mt-2 space-y-1 text-[14px]">
                {result.checks.map((c) => (
                  <li key={c.id} className="flex gap-2">
                    <span className={`w-5 shrink-0 font-semibold ${CHECK_CLS[c.status]}`} aria-hidden>
                      {CHECK_ICON[c.status]}
                    </span>
                    <span>
                      <span className="font-semibold">{c.rule}.</span> <span className="text-[#333]">{c.message}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </details>

            <p className="mt-2 text-[13px] text-helper">{result.source.label}</p>
          </div>
        )}
      </div>
    </div>
  );
}
